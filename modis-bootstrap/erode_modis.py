#!/usr/bin/env python3

import argparse

import rasterio as rio
import numpy as np
from scipy import ndimage

'''
For all the classes, except the deciduous needleleaf forest class, a spatial filter
was applied so that only the MCD12Q1 pixel locations that had the same land cover
class in the surrounding eight 500 m pixels were retained. This is similar to previous
approaches (Blanco et al., 2013, Colditz et al., 2012) and was implemented to help reduce
spatial differences between the 500 m MCD12Q1 and 30 m GWELD data, in particular, 500 m pixel
edge effects where the underlying land cover may change across 500 m pixel boundaries, and
also to reduce the impact of the 50 m 1σ MODIS geolocation error and variable across-track
MODIS spatial resolution (Wolfe et al., 2002, Campagnolo et al., 2016).
'''
# https://www.sciencedirect.com/science/article/pii/S0034425717302249

# A standard 3x3 kernel to be used during erosion 
EROSION_WINDOW = [[1, 1, 1], [1, 1, 1], [1, 1, 1]]

# Erode all categories with the provided window
def erode(np_arr, erosion_window=EROSION_WINDOW):
    # true if all members of `arr` are equal 
    members_are_equal = lambda arr: np.unique(arr).size == 1
    mask = ndimage.generic_filter(np_arr, members_are_equal, footprint=erosion_window)
    return np_arr * mask

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--preserve-urban', action="store_true")
    args = parser.parse_args()

    # output file setup
    with rio.open(args.input) as input_ds:
        metadata = input_ds.profile
        metadata['dtype'] = 'uint8'
        metadata['count'] = 1  # bands
        data = input_ds.read(1)
        if not args.preserve_urban:
            # IGBP class 13 is urban and we don't want to use MODIS urban classifications
            not_urban = (data == 13) == 0
            data = data * not_urban

        with rio.open(args.output, 'w', **metadata) as output_tif:
            eroded = erode(data)
            output_tif.write(eroded, 1)
