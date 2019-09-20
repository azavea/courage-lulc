#!/usr/bin/env python3

#!/usr/bin/env python3

import os
import sys
import argparse
import multiprocessing as mp
import time
from urllib.parse import urlparse

import rasterio as rio
import numpy as np
import h5py
import joblib
import boto3
import botocore

'''
To simplify prediction, we've avoided including a water class and leaned on
Jean-Francois Pekel, Andrew Cottam, Noel Gorelick, Alan S. Belward, High-resolution mapping of global surface water and its long-term changes. Nature 540, 418-422 (2016). (doi:10.1038/nature20584)

This is simple command-line utility for masking one raster by reference to another
Modify the '--keep-value' argument (default 0) to change which values from the
reference raster will be kept 
'''

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=True)
    parser.add_argument('--mask', required=True)
    # keep values covered by this value
    parser.add_argument('--keep-value', type=int, default=0)
    args = parser.parse_args()

    with rio.Env(CPL_DEBUG=True):
        with rio.open(args.image, 'r') as image_ds, rio.open(args.mask, 'r') as mask_ds:
            assert(image_ds.width == mask_ds.width)
            assert(image_ds.height == mask_ds.height)
            assert(image_ds.transform == mask_ds.transform)
            filename = os.path.basename(args.image)
            meta = image_ds.profile

            img = image_ds.read()
            mask = mask_ds.read()
            mask =  mask == args.keep_value

        with rio.open("masked-{}".format(filename), 'w', **meta) as out_ds:
            masked_data = img * mask
            out_ds.write(masked_data)

    exit(0)
