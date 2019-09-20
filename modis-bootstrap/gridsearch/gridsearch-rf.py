#!/usr/bin/env python3

import sys
import os
import argparse
import math
import multiprocessing as mp

import numpy as np
import rasterio as rio
import h5py
from sklearn.model_selection import RandomizedSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.utils.class_weight import compute_class_weight

'''
Randomly search through the parameter space to evaluate random forest performance under
various conditions
'''

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--h5-file', required=True)
    parser.add_argument('--n-jobs', type=int, default=-1)
    parser.add_argument('--n-iter', type=int, default=20)
    parser.add_argument('--no-water', action='store_true')
    args = parser.parse_args()

    def all_water(np_arr):
        return np_arr[:,0] == 17
    
    def all_urban(np_arr):
        return np_arr[:,0] == 13

    def all_ag(np_arr):
        return (np_arr[:,0] == 12)

    with h5py.File(args.h5_file, 'r') as h5:
        data = np.array(h5['modis_training'])
    np.random.shuffle(data)

    # urban and ag vs all
    data[~(all_urban(data) | all_ag(data)), 0] = 0

    if args.no_water:
        data = data[~all_water(data)]

    half = data[:data.shape[0] // 2].copy()
    print(half.shape)
    del data
    xs = half[:,1:]
    ys = half[:,0].astype(np.uint8)
    unique_ys = np.unique(ys)
    weights = compute_class_weight('balanced', unique_ys, ys)

    weight_dict = {}
    for i in range(weights.size):
        weight_dict[unique_ys[i]] = weights[i]



    # Number of trees in random forest
    n_estimators = [int(x) for x in np.linspace(start = 200, stop = 1000, num = 5)]
    # Number of features to consider at every split
    max_features = ['auto']
    # Maximum number of levels in tree
    max_depth = [int(x) for x in np.linspace(80, 200, num = 5)]
    #max_depth.append(None)
    # Minimum number of samples required to split a node
    min_samples_split = [2, 5, 10]
    # Minimum number of samples required at each leaf node
    min_samples_leaf = [2, 4, 6]
    # Method of selecting samples for training each tree
    bootstrap = [True]
    # Create the random grid

    random_grid = {'n_estimators': n_estimators,
                'max_features': max_features,
                'max_depth': max_depth,
                'min_samples_split': min_samples_split,
                'min_samples_leaf': min_samples_leaf,
                'bootstrap': bootstrap,
                'class_weight': ['balanced', 'balanced_subsample'],
                'n_jobs': [args.n_jobs]
                }
    print(random_grid)

    # Use the random grid to search for best hyperparameters
    # First create the base model to tune
    rf = RandomForestClassifier()
    # Random search of parameters, using 3 fold cross validation, 
    # search across 100 different combinations, and use all available cores
    rf_random = RandomizedSearchCV(scoring = 'f1_macro', estimator = rf, param_distributions = random_grid, n_iter = args.n_iter, cv = 2, verbose=10, random_state=42, n_jobs=1)
    # Fit the random search model
    rf_random.fit(xs, ys)

    print("FINISHING")
    print(rf_random.cv_results_)

    print("BEST PARAMS")
    print(rf_random.best_params_)