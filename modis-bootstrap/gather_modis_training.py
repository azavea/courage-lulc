#!/usr/bin/env python3

import sys
import os
import argparse
import math
import multiprocessing as mp

import numpy as np
import rasterio as rio
import h5py

DEBUG = False

'''
Collect training data from landsat (30m) provided an overlapping MODIS dataset (500m)
'''


# Our data is big and we'd like to randomly acccess its contents; hdf5 is a reasonable choice
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
        rows = int(np_arr.size / 43)
        data.reshape((rows, 43))
        h5_dset.resize(length_after_append, axis=0)
        dset[-length_to_append:] = np_arr

# construct a window for reading cells from the 'under' raster by the row/col of the 'over' raster 
def window_under(over_ds, under_ds, row, col):
    ll = rio.transform.xy(over_ds.transform, row, col, 'll')
    ur = rio.transform.xy(over_ds.transform, row, col, 'ur')
    left = ll[0]
    bottom = ll[1]
    right = ur[0]
    top = ur[1]
    return rio.windows.from_bounds(left, bottom, right, top, under_ds.transform)

"""
'Within each of the filtered MCD12Q1 500 m product pixels a single 30 m GWELD
pixel location was selected. This is complicated because the spatial arrangement
of land cover may be quite different at 500 m and 30 m. This has not been
studied for the CONUS but, for example, Roy and Kumar (2017) reported that only
about 5% of 1 km MODIS pixels over the Brazilian Tropical Moist Forest Biome
(4 million km2) contained homogeneous land cover mapped at 30 m.'
"""
# the intuition is that the cell closest to the mean value for a 500m region should best characterize it
def cell_nearest_mean(np_arr):
    mean = np_arr.mean(axis=0)
    minimum = np_arr[0]
    shortest_distance = np.abs((mean - minimum)).sum()
    for cell_idx in range(1, np_arr.shape[0]):
        n = np_arr[cell_idx]
        n_distance = np.abs((mean - n)).sum()
        if n_distance < shortest_distance:
            minimum = n
            shortest_distance = n_distance
    return minimum

def compute_batch(batch):
    pool = mp.Pool(mp.cpu_count())
    results = pool.imap(compute_window, (window for window in batch))
    pool.close()
    pool.join()
    return np.concatenate([res for res in results], axis=0)

def compute_window(label_window):
    print("computing data for modis window {}".format(label_window))
    labels = retry_read(modis_ds, 1, label_window)
    if np.count_nonzero(labels) < 1:
        if DEBUG: print("no trusted modis data at {}".format(label_window))
        return np.empty((0,43))
    labels = labels.flatten()
    # toss out nodata to avoid extra work
    labels = labels[labels != 0]
    cols = range(label_window.col_off, label_window.col_off + math.ceil(label_window.width) + 1)
    rows = range(label_window.row_off, label_window.row_off + math.ceil(label_window.height) + 1)
    xys = [ (x, y) for x in cols for y in rows]

    training_ready_values = np.empty((0, 43), dtype=modis_training_type) 
    for i, label in enumerate(labels):
        (modis_col, modis_row) = xys[i]
        landsat_window = window_under(modis_ds, landsat_ds, modis_row, modis_col)
        # each item in landsat cells will be a band ranging over multiple cells
        landsat_cells = []
        for band in range(1, 43):
            # useful for debugging because you can track the integer
            #band_cells = np.concatenate([[band], landsat_ds.read(band, window=landsat_window).flatten()])
            band_cells = retry_read(landsat_ds, band, landsat_window).flatten()
            landsat_cells.append(band_cells)

        # we need to swap axes so that there's an array for each cell
        landsat_cells = np.array(landsat_cells, dtype=np.float).swapaxes(0, 1)

        landsat_cells = landsat_cells[~np.isnan(landsat_cells).any(axis=1)]
        if landsat_cells.size > 0:
            # remove any nan containing rows that mightve snuck in
            representative_cell = cell_nearest_mean(landsat_cells)
            training_ready = np.insert(representative_cell, 0, label)
            training_ready = training_ready.astype(modis_training_type, casting='safe')
            training_ready = training_ready.reshape((1,43))
            training_ready_values = np.concatenate([training_ready_values, training_ready], axis=0)
        else:
            print("empty landsat at modis_row: {}, modis_col: {} for modis label: {}".format(modis_row, modis_col, label))
            print("empty landsat at {}".format(landsat_window))

    return training_ready_values

# https://chrisalbon.com/python/data_wrangling/break_list_into_chunks_of_equal_size/
def chunks(l, n):
    for i in range(0, len(l), n):
        yield l[i:i+n]

# retry a rasterio read to make this thing less brittle
def retry_read(rio_ds, band, window=None, retries = 3):
    for i in range(retries):
        try:
            return rio_ds.read(band, window=window)
        except rio.errors.RasterioIOError:
            print("Read error for band {} at window {} on try {} of {}".format(band, window, i+1, retries))
            continue

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--modis-labels', required=True)
    parser.add_argument('--landsat-data', required=True)
    parser.add_argument('--h5-file', required=True)
    parser.add_argument('--chunk-size', type=int, default=32)
    parser.add_argument('--debug', action='store_true')
    args = parser.parse_args()

    DEBUG = args.debug

    modis_training_type = np.float32

    if os.path.exists(args.h5_file):
        os.remove(args.h5_file)
    with h5py.File(args.h5_file, "a") as h5, rio.open(args.modis_labels) as modis_ds, rio.open(args.landsat_data) as landsat_ds:
        dset = h5.create_dataset('modis_training', (0, 43), maxshape=(None,43),
                                dtype=modis_training_type, chunks=True)

        assert len(set(modis_ds.block_shapes)) == 1
        modis_windows = [window[1] for window in modis_ds.block_windows(1)]

        chunk_count = 0
        for chunk in chunks(modis_windows, args.chunk_size):
            chunk_count = chunk_count + 1
            print("beginning evaluation of chunk {}".format(chunk_count))
            data = compute_batch(chunk)
            rows = int(data.size / 43)
            data.reshape((rows, 43))
            print("writing results of chunk {}".format(chunk_count))
            dump_to_h5(dset, data)

    exit(0)
