#!/usr/bin/env python3

import argparse

import rasterio as rio

'''
This script reads in three MODIS files and spits out the stable (unchanging)
classifications as part of the preprocessing steps outlined here:
https://www.sciencedirect.com/science/article/pii/S0034425717302249#bb0385
'''

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--input1', required=True)
    parser.add_argument('--input2', required=True)
    parser.add_argument('--input3', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()

    # set up output file
    with rio.open(args.input1) as input_ds1, rio.open(args.input2) as input_ds2, rio.open(args.input3) as input_ds3:
        metadata = input_ds1.profile
        metadata['dtype'] = 'uint8'
        metadata['count'] = 1  # bands

        data1 = input_ds1.read(1) 
        data2 = input_ds2.read(1) 
        data3 = input_ds3.read(1) 
        unchanging1 = data1 == data2
        unchanging2 = data2 == data3
        all_unchanging = unchanging1 * unchanging2
        data = data1 * all_unchanging 
        with rio.open(args.output, 'w', **metadata) as output_tif:
            output_tif.write(data, 1)
