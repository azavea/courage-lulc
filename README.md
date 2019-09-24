# Scripts for Land Cover Classification

This repo contains scripts for the supervised classification of land
cover (forest, urban, agriculture) in Iraq, Lebanon, and Syria.

## modis-bootstrap
In [modis-bootstrap](modis-bootstrap), sources which enable bootstrapping
MODIS land cover classifications onto Landsat imagery are provided.
These follow a workflow derived from
https://doi.org/10.1016/j.rse.2017.05.024. The python scripts sitting at
the root of this directory clean, extract, and process data ready for
training. At the top of each script, a short description of its purport
is provided. The [gee-scripts](modis-bootstrap/gee-scripts) directory
contains javascript necessary to export all imagery from Google
Earth Engine which is required. The
[gridsearch](modis-bootstrap/gridsearch) contains helper functionality
for randomly traversing hyperparameter search spaces in a few popular
classifier algorithms.

## binary-classification
In [binary-classification](binary-classification), a series of Google Earth
Engine javascript files are provided (each, followed by a link to the script
in Google Earth Engine) which enable an interactive approach to land
classification that is a fair bit simpler than the bootstrapping
technique and can be iteratively improved through the Earth Engine
interface. Supplementary scripts, contained in the
[supplementary](binary-classification/supplementary) directory, support
export of EVI changes, night light changes, and deforestation estimates
