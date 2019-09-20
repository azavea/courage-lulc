#!/usr/bin/env python3

import argparse

import h5py

import numpy as np

from IPython import embed

from sklearn.model_selection import cross_validate
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import SVC, LinearSVC, NuSVC
from sklearn.ensemble import AdaBoostClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, AdaBoostClassifier, GradientBoostingClassifier, BaggingClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis
from sklearn.model_selection import KFold
from sklearn.metrics import confusion_matrix

'''
This script should set up some useful imports for exploring and playing with training data
produced via `gather_modis_training.py` and `gather_ghsl_training.py`.

A number of slices of the data are provided ahead of time as well as various classifiers
which are suitable and commonly used for supervised land use/cover classification
'''

# functions for getting appropriate numpy indices
def all_evergreens(np_arr):
    return (np_arr[:,0] == 1) | (np_arr[:,0] == 2)

def all_deciduous(np_arr):
    return (np_arr[:,0] == 3) | (np_arr[:,0] == 4)

def all_forest(np_arr):
    return (np_arr[:,0] == 1) | (np_arr[:,0] == 2) | (np_arr[:,0] == 3) | (np_arr[:,0] == 4) | (np_arr[:,0] == 5)

def all_shrubland(np_arr):
    return (np_arr[:,0] == 6) | (np_arr[:,0] == 7)

def all_savannah(np_arr):
    return (np_arr[:,0] == 8) | (np_arr[:,0] == 9)

def all_grassland(np_arr):
    return np_arr[:,0] == 10

def all_wetlands(np_arr):
    return np_arr[:,0] == 11

def all_crops(np_arr):
    return (np_arr[:,0] == 12) | (np_arr[:,0] == 14)

def all_barren(np_arr):
    return (np_arr[:,0] == 16)

def all_water(np_arr):
    return np_arr[:,0] == 17

def split_labels(np_arr):
    xs = np_arr[:,1:]
    ys = np_arr[:,0].astype(np.uint8)
    return (xs, ys)

def random_sample2d(np_arr, samples):
    if samples < 0:
        return np_arr
    else:
        assert(np_arr.shape[0] > samples)

        return np_arr[np.random.randint(0, np_arr.shape[0], samples)]

def quick_cv(np_arr, clf, folds=5):
    scoring = ['precision_macro', 'recall_macro', 'f1_macro', 'precision_micro', 'recall_micro', 'f1_micro', 'f1_weighted', 'balanced_accuracy', 'accuracy']
    xs, ys = split_labels(np_arr)
    return cross_validate(clf, xs, ys, scoring=scoring, cv=folds)

def conf_matrix(np_arr, clf, folds=5):
    xs, ys = split_labels(np_arr)
    kf = KFold(n_splits=folds)
    for train_index, test_index in kf.split(xs):
        print("TRAIN:", train_index, "TEST:", test_index)
        X_train, X_test = xs[train_index], xs[test_index]
        y_train, y_test = ys[train_index], ys[test_index]

        clf.fit(X_train, y_train)
        print(confusion_matrix(y_test, clf.predict(X_test)))

# a helper function to randomly sample various categories using the quantity specified
# in the `sample_arr`
def subsampled(np_arrs, sample_arr):
    sampled = []
    for i, np_arr in enumerate(np_arrs):
        sampled.append(random_sample2d(np_arr, sample_arr[i]))
    return np.concatenate(sampled, axis=0)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--hdf5-file', required=True)
    args = parser.parse_args()

    with h5py.File(args.hdf5_file, 'r') as h5:
        ghsl = np.array(h5['ghsl_training'])
        modis = np.array(h5['modis_training'])

    # throw out really small categories and merge underrepresented
    # 15 = snow/ice
    # 17 = water (we can probably include this if we upsample)
    modis = modis[(modis[:,0] != 15) & (modis[:,0] != 17)]

    # combine forests into mixed forest (seasons aren't as pronounced in the aoi and we lack adequate samples)
    modis[all_forest(modis), 0] = 5 

    # there are no closed shrublands. but, for the sake of consistency:
    modis[all_shrubland(modis), 0] = 7

    # combine savannahs (the vast majority are non-woody)
    modis[all_savannah(modis), 0] = 9

    # combine croplands (not enough mosaics to trust)
    modis[all_crops(modis), 0] = 12

    forest = modis[all_forest(modis)]
    shrublands = modis[all_shrubland(modis)]
    savannahs = modis[all_savannah(modis)]
    grasslands = modis[all_grassland(modis)]
    crops = modis[all_crops(modis)]
    urban = ghsl
    barren = modis[all_barren(modis)]
    all_biomes = [forest, shrublands, savannahs, grasslands, crops, urban, barren]

    # np.unique(data[:,0]):
    # (array([ 5.,   7.,     9.,    10.,     12.,    13.,      16.], dtype=float32),
    #  array([ 8110, 326217, 10597, 1519105, 723292, 14440832, 4354737]))
    data = np.concatenate(all_biomes, axis=0)
    data_proportional = np.concatenate([modis, random_sample2d(ghsl, 30000)])
    np.random.shuffle(data)
    np.random.shuffle(data_proportional)

    # used along with the `subsampled` function above
    undersample_urban_and_barren = [-1, -1, -1, -1, -1, 20000, 20000]

    embed(colors="neutral")
