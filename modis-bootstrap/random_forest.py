#!/usr/bin/env python3

import argparse
import multiprocessing as mp
import time

import rasterio as rio
import numpy as np
import h5py
import joblib
from retrying import retry

'''
Because the tifs we're working with are far too large to be stored monolithically,
this script is intended to be used with VRTs. Experience teaches that this path is
fraught. There are multiple retry decorators here to try and compensate but vsis3
doesn't seem to be suitable for long running jobs that aren't easily checkpointed.

Use with caution and consider the `random_forest_boto.py` script as an alternative.
'''


def load_window(landsat_ds, window):
    pool = mp.Pool(mp.cpu_count())
    bands = pool.map(load_band, (band for band in range(1, 43)))
    pool.close()
    pool.join()
    results = np.array([band.flatten() for band in bands], dtype=np.float).swapaxes(0,1)
    return results

@retry(wait_exponential_multiplier=1000, wait_exponential_max=10000)
def load_band(band):
    try:
        padded = np.empty((window.height, window.width))
        padded.fill(np.nan)
        band_data = landsat_ds.read(band, window=window)
        padded[:band_data.shape[0],:band_data.shape[1]] = band_data
        return padded
    except:
        print("WARNING: band {} failed to read at {}".format(band, window))
        raise

@retry(wait_exponential_multiplier=1000, wait_exponential_max=10000, stop_max_delay=30000)
def write_data(output_ds, window, data):
    try:
        output_ds.write(data, window=window, indexes=1)
    except:
        print("encountered failure during write - trying again")
        raise

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--classifier', required=True)
    parser.add_argument('--landsat-vrt', required=True)
    parser.add_argument('--window-size', type=int, default=2560)
    parser.add_argument('--output-tif', required=True)
    parser.add_argument('--starting-window', type=int, default=1)
    args = parser.parse_args()

    # load up the classifier
    clf = joblib.load(args.classifier)
    clf.n_jobs = mp.cpu_count()

with rio.Env(CPL_DEBUG=True, VRT_SHARED_SOURCE=0):
    with rio.open(args.landsat_vrt, 'r') as landsat_ds:
        maxwidth = (landsat_ds.width//args.window_size) + 1
        maxheight = (landsat_ds.height//args.window_size) + 1
        xs = range(0, maxwidth)
        ys = range(0, maxheight)
        output_width = args.window_size * (maxwidth + 1)
        output_height = args.window_size * (maxheight + 1)
        xys = [(x, y) for x in xs for y in ys]
        metadata = landsat_ds.profile
        metadata['dtype'] = 'uint8'
        metadata['count'] = 1  # bands
        metadata['nodata'] = 0
        metadata['driver'] = 'GTiff'
        metadata['width'] = output_width
        metadata['height'] = output_height
        metadata['bigtiff'] = 'YES'

        print("opening landsat imagery: {}".format(args.landsat_vrt))
        print("saving classifications to {} with metadata {}".format(args.output_tif, metadata))
        with rio.open(args.output_tif, mode='w', **metadata) as output_ds:
            windows = [rio.windows.Window(x * args.window_size,
                y * args.window_size, args.window_size, args.window_size) for (x, y) in xys]
            total_loop_time = 0
            for idx in range(args.starting_window - 1, len(windows)):
                window_start_time = time.process_time()

                window = windows[idx]
                print('beginning {}'.format(window))
                print('window {} of {}'.format(idx+1, len(windows)))
                l7_window = load_window(landsat_ds, window)
                print('window loaded, predicting')
                no_nodata = ~np.isnan(l7_window).any(axis=1)
                # generate empty array to stuff values into
                output = np.empty((l7_window.shape[0],), dtype=np.uint8)
                #print('l7', l7_window.shape, l7_window)
                #print('nonodata', no_nodata.shape, no_nodata)
                l7_data = l7_window[no_nodata]
                l7_nodata = l7_window[~no_nodata]
                if l7_data.shape[0] > 0:
                    output[no_nodata] = clf.predict(l7_data)
                nd_shape = l7_nodata.shape[0]
                output[~no_nodata] = np.zeros((l7_nodata.shape[0],), dtype=np.uint8)

                window_end_time = time.process_time()
                elapsed = window_end_time - window_start_time
                total_loop_time = total_loop_time + elapsed
                avg_loop_time = total_loop_time / (idx + 1)
                print('window completed in {} seconds'.format(elapsed))
                print('average window time: {} seconds'.format(avg_loop_time))

                output = output.reshape((args.window_size, args.window_size))
                write_data(output_ds, window, output)