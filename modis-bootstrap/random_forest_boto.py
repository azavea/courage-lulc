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
If using S3, this script is an alternative way of running inference/prediction
which avoids some of the pitfalls of using VRTs (there appears to be a bug in GDAL
which causes vsis3 reads to fail). A tradeoff of this approach is that multiple tiffs
will be produced which it might be desirable to stitch together after inference
'''

def s3_ls(s3_url):
    bucket, prefix = split_s3_url(s3_url)
    s3client = boto3.client('s3')
    s3_objects = s3client.list_objects_v2(Bucket=bucket, Prefix=prefix )
    del s3client
    return ("s3://{}/{}".format(bucket, obj['Key']) for obj in s3_objects['Contents'])

def s3_exists(s3_url):
    bucket, key = split_s3_url(s3_url)
    s3 = boto3.resource('s3')
    try:
        s3.Object(bucket, key).load()
    except botocore.exceptions.ClientError as e:
        if e.response['Error']['Code'] == "404":
            exists = False
        else:
            raise
    else:
        exists = True
    return exists

# Break s3uris into bucket and prefix
def split_s3_url(s3_url):
    parsed = urlparse(s3_url, allow_fragments=False)
    return (parsed.netloc, parsed.path.lstrip('/'))

# actually run inference over a tif
def infer_tif(input_url_s3, output_url_s3, clf):
    # use process id for running multiple of these processes
    PID = os.getpid()
    LOCAL_FILE = '/tmp/' + str(PID) + '-working.tif'
    LOCAL_OUTPUT = '/tmp/' + str(PID) + '-output.tif'
    print("beginning inference over {}".format(input_url_s3))
    input_bucket, input_prefix = split_s3_url(input_url_s3)
    output_bucket, output_prefix = split_s3_url(output_url_s3)
    s3client = boto3.client('s3')
    try:
        s3client.download_file(input_bucket, input_prefix, LOCAL_FILE)
        tif_start_time = time.process_time()
        with rio.open(LOCAL_FILE) as working_tif:
            assert len(set(working_tif.block_shapes)) == 1
            output_meta = working_tif.profile
            output_meta['dtype'] = 'uint8'
            output_meta['count'] = 1  # bands
            output_meta['nodata'] = 0
            output_meta['driver'] = 'GTiff'

            with rio.open(LOCAL_OUTPUT, 'w', **output_meta) as output_tif:
                for ji, block_window in working_tif.block_windows(1):
                    # read it
                    block = working_tif.read(window=block_window)
                    block_shape2d = block.shape[1] * block.shape[2]
                    flattened_block = block.reshape((block.shape[0], block_shape2d)).swapaxes(0, 1)
                    # handle nodata
                    no_nodata = ~np.isnan(flattened_block).any(axis=1)
                    # generate empty array to stuff values into
                    block_data = flattened_block[no_nodata]
                    block_nodata = flattened_block[~no_nodata]

                    # empty output to be filled 
                    output_block = np.empty((flattened_block.shape[0],), dtype=np.uint8)
                    # infer for data
                    if block_data.shape[0] > 0:
                        output_block[no_nodata] = clf.predict(block_data)
                    # set to 0 for nodata
                    output_block[~no_nodata] = np.zeros((block_nodata.shape[0],), dtype=np.uint8)
                    # write results
                    output_tif.write(output_block.reshape((block.shape[1], block.shape[2])), 1, window=block_window)
            tif_end_time = time.process_time()
            elapsed = tif_end_time - tif_start_time
        print("processed {} in {} seconds".format(input_prefix, elapsed))

        print("uploading file to {}".format(output_url_s3))
        s3client.upload_file(LOCAL_OUTPUT, output_bucket, output_prefix)
    finally:
        # cleanup
        del s3client
        if os.path.exists(LOCAL_FILE): os.remove(LOCAL_FILE)
        if os.path.exists(LOCAL_OUTPUT): os.remove(LOCAL_OUTPUT)

# a convenience for running in parallel
def infer_tif_tupled(tupled_args):
    infer_tif(tupled_args[0], tupled_args[1], tupled_args[2])

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--classifier', required=True)
    parser.add_argument('--input-directory', required=True)
    parser.add_argument('--output-directory', required=True)
    parser.add_argument('--parallelism', type=int, default=1)
    args = parser.parse_args()

    # load up the classifier
    clf = joblib.load(args.classifier)

    with rio.Env(CPL_DEBUG=True):
        img_urls = filter(lambda url: url.endswith('.tif'), s3_ls(args.input_directory))

        io_urls = []
        for input_img_url in img_urls:
            output_img_url = args.output_directory.rstrip('/') + '/inferred-' + input_img_url.split('/')[-1]
            io_urls.append({ 'input': input_img_url, 'output': output_img_url })

        to_run = []
        for urls in io_urls:
            if s3_exists(urls['output']):
                print("file already located at {}, skipping".format(urls['output']))
            else:
                to_run.append((urls['input'], urls['output']))

        if args.parallelism == 1:
            print("Running in a single process")
            clf.n_jobs = mp.cpu_count()
            for urls in to_run:
                infer_tif(urls[0], urls[1], clf)
        else:
            print("Running in parallel mode with {} processes".format(args.parallelism))
            clf.n_jobs = 1
            process_pool = mp.Pool(args.parallelism)
            process_pool.map(infer_tif_tupled, ((urls[0], urls[1], clf) for urls in to_run))
            process_pool.close()
            process_pool.join()
        sys.stdout.flush()

    exit(0)
