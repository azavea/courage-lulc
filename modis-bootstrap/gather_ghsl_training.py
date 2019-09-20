#!/usr/bin/env python3

import time
import os
import argparse
import math
import multiprocessing as mp

import numpy as np
import rasterio as rio
import h5py
from retrying import retry

DEBUG = False

# Our data is big and we'd like to randomly acccess its contents
# https://stackoverflow.com/questions/25655588/incremental-writes-to-hdf5-with-h5py?rq=1
# http://docs.h5py.org/en/stable/high/dataset.html#resizable-datasets
def dump_to_h5(h5_dset, np_arr):
    length_to_append = np_arr.shape[0]
    length_after_append = h5_dset.shape[0] + length_to_append
    try:
        h5_dset.resize(length_after_append, axis=0)
        dset[-length_to_append:] = np_arr
    except:
        print("problem detected during insert, attempting to resolve...")
        print(length_to_append)
        rows = int(np_arr.size / 43)
        np_arr = np_arr.reshape((rows, 43))
        h5_dset.resize(length_after_append, axis=0)
        dset[-length_to_append:] = np_arr

# parallelize a batch of windows
def compute_batch(batch):
    pool = mp.Pool(mp.cpu_count())
    results = pool.imap(compute_window, (window for window in batch))
    pool.close()
    pool.join()
    return np.concatenate([res for res in results], axis=0)

# the unit of work to be parallelized
def compute_window(label_window):
    print("computing data for window {}".format(label_window))
    # 13 is the modis label for urban environments
    labels = retry_read(ghsl_ds, 1, label_window)
    labels13 = labels * 13 
    landsat_cells = [labels13.flatten()]
    # we shouldn't go through the heavy costs of reading 42 bands where no urban sites are expected
    if np.count_nonzero(labels) < 1:
        if DEBUG: print("no urban sites at window {}".format(label_window))
        return np.empty((0,43))
    for band in range(1, 43):
        band_cells = retry_read(landsat_ds, band, label_window).flatten()
        landsat_cells.append(band_cells)

    landsat_cells = np.array(landsat_cells, dtype=ghsl_training_type).swapaxes(0, 1)

    if DEBUG:
        print("WINDOW: {}".format(label_window))
        print("RESULTS: {}".format(landsat_cells))

    # throw out any nan-containing rows
    landsat_cells = landsat_cells[~np.isnan(landsat_cells).any(axis=1)]
    landsat_cells = landsat_cells[landsat_cells[:,0] != 0]

    # GHSL training should be 0 or else 13 (two possible values for row 0); otherwise throw
    try:
        assert(np.unique(landsat_cells[:,0]).size <= 2)
    except:
        print("trouble with results from: {}".format(label_window))
        return np.empty((0,43))

    return landsat_cells

# helper function for creating an iterator of equal-sized chunks of work
# https://chrisalbon.com/python/data_wrangling/break_list_into_chunks_of_equal_size/
def chunks(l, n):
    for i in range(0, len(l), n):
        yield l[i:i+n]

# A simple mechanism for retrying rasterio reads
def retry_read(rio_ds, band, window=None, retries = 3):
    for i in range(retries):
        try:
            return rio_ds.read(band, window=window)
        except rio.errors.RasterioIOError:
            print("Read error for band {} at window {} on try {} of {}".format(band, window, i+1, retries))
            time.sleep(2)
            continue

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--ghsl-labels', required=True)
    parser.add_argument('--landsat-data', required=True)
    parser.add_argument('--h5-file', required=True)
    parser.add_argument('--chunk-size', type=int, default=128)
    parser.add_argument('--window-size', type=int)
    parser.add_argument('--debug', action='store_true')
    args = parser.parse_args()
    print("ghsl export with args: {}".format(args))

    DEBUG = args.debug

    ghsl_training_type = np.float32

    """
    The `GDAL_MAX_DATASET_POOL_SIZE` environment variable is a hard requirement for
    massively parallel GDAL reads. By default, it only has a 100 dataset maximum. This
    is not sufficient for the scale of compute we're engaged in: because the dataset
    pool is FIFO, datasets can be lost in which case fatal reading errors will occur
    """
    with rio.Env(GDAL_MAX_DATASET_POOL_SIZE=min(args.chunk_size, 400), CPL_DEBUG=True):
        with h5py.File(args.h5_file, "a") as h5, rio.open(args.ghsl_labels) as ghsl_ds, rio.open(args.landsat_data) as landsat_ds:
            # Abort if GHSL training is found; otherwise, create a dataset
            if 'ghsl_training' not in h5.keys():
                print("ghsl_training not found in hdf5 file, creating dataset now")
                dset = h5.create_dataset('ghsl_training', (0, 43), maxshape=(None,43),
                                        dtype=ghsl_training_type, chunks=True)
            else:
                if h5['ghsl_training'].size == 0:
                    print("ghsl training data empty, continuing")
                    dset = h5['ghsl_training']
                else:
                    print("ghsl training data found, aborting process")
                    exit(1)

            if args.window_size is None:
                # use block shapes to construct windows
                assert len(set(ghsl_ds.block_shapes)) == 1
                ghsl_windows = [window[1] for window in ghsl_ds.block_windows(1)]
                expected_chunks = (len(ghsl_windows) // args.chunk_size) + 1

                chunk_count = 0
                for chunk in chunks(ghsl_windows, args.chunk_size):
                    chunk_count = chunk_count + 1
                    print("evaluating chunk {} of {}".format(chunk_count, expected_chunks))
                    data = compute_batch(chunk)
                    rows = int(data.size / 43)
                    data.reshape((rows, 43))
                    print("writing {} results from chunk {}".format(rows, chunk_count))
                    dump_to_h5(dset, data)
                exit(0)
            else:
                # use the manually specified window size
                xs = range(0, (ghsl_ds.width//args.window_size) + 1)
                ys = range(0, (ghsl_ds.height//args.window_size) + 1)
                xys = [(x, y) for x in xs for y in ys]
                windows = [rio.windows.Window(x * args.window_size,
                    y * args.window_size, args.window_size, args.window_size) for (x, y) in xys]
                expected_chunks = (len(windows) // args.chunk_size) + 1

                chunk_count = 0
                for chunk in chunks(windows, args.chunk_size):
                    chunk_count = chunk_count + 1
                    print("evaluating chunk {} of {}".format(chunk_count, expected_chunks))
                    data = compute_batch(chunk)
                    rows = int(data.size / 43)
                    data.reshape((rows, 43))
                    print("writing {} results from chunk {}".format(rows, chunk_count))
                    dump_to_h5(dset, data)
                exit(0)

# ./gather_ghsl_training.py --ghsl-labels ghsl-gte50cnfd.vrt --landsat-data L7-2017.vrt --h5-file training.h5