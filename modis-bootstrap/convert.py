#!/usr/bin/env python3

import argparse
import os
from multiprocessing import Pool
from urllib.parse import urlparse

import boto3

import numpy as np
import rasterio as rio

'''
Classification is generally a more difficult task, the more classes there are.
This script can either be used on the MODIS data which is input prior to collecting
30m pixels via the `gather_modis_training.py` script or after inference/prediction
via the `random_forest.py`/`random_forest_boto.py`. The effect will be to relabel
according to the CONVERSION_DICT below.

The keys of CONVERSION_DICT refer to IGBP classifications, which can be found here:
http://www.eomf.ou.edu/static/IGBP.pdf
'''

# The study area dramatically underrepresents various classes. As a result, subcategories can be lumped together.
# 1 other
# 2 developed
# 3 forest
# 4 agriculture
CONVERSION_DICT = {1:3,2:3,3:3,4:3,5:1,6:1,7:1,8:1,9:1,10:1,11:1,12:4,13:2,14:4,15:1,16:1,17:1}

# quickly replace contents of a np_arr with mappings provided by replacement_dict
# used primarily to map mask labels to the (assuming N training labels) 0 to N-1 categories expected
def numpy_replace(np_arr, replacement_dict):
    b = np.copy(np_arr)
    for k, v in replacement_dict.items():
        b[np_arr == k] = v
    return b

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()

    # input datasource
    img_ds = rio.open(args.input)

    # set up output file
    metadata = img_ds.profile
    output_tif = rio.open(args.output, 'w', **metadata)

    data = img_ds.read(1)
    converted = numpy_replace(data, CONVERSION_DICT)

    output_tif.write(converted, 1)
    img_ds.close()
    output_tif.close()
