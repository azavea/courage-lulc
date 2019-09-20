# modis bootstrapping

[Using the 500 m MODIS land cover product to derive a
consistent continental scale 30 m Landsat land cover
 classification](https://www.sciencedirect.com/science/article/pii/S0034425717302249)
[modis user guide](https://lpdaac.usgs.gov/documents/101/MCD12_User_Guide_V6.pdf)

differences from paper:
- better MODIS LC quality in version 6 (2016-2018 vs 2009-2011)
- No NLCD to fall back on for urban/developed land; instead, using  the [global human settlement layer](https://ghsl.jrc.ec.europa.eu/documents/GHSL_data_access.pdf)
- Added NDBI values

# on the use of variation vs time series
> Temporal metrics do not explicitly capture the timing but rather the amplitude of the reflectance variation and so are insensitive to phenological differences (DeFries et al., 1995, Friedl et al., 2010) where time series may exhibit different phenological variation at different locations for the same land cover class (Zhang et al., 2006). Temporal metrics are robust to missing data which is important because Landsat time series have gaps due to cloud cover (Kovalskyy and Roy, 2013), variable Landsat acquisition frequency (Wulder et al., 2016), and sensor issues (Markham et al., 2004).

# the metrics
> The metrics were similar to those used previously to classify 30m percent tree cover, bare ground and other vegetation for all the CONUS using WELD data (Hansen et al., 2011).
Specifically, the 20th, 50th (i.e., median) and 80th percentiles of Landsat NBAR bands 2, 3, 4, 5, 7, and of eight normalized NBAR band ratios 4 − 3/4 + 3 (i.e. NDVI), 5 − 2/5 + 2, 5 − 3/5 + 3, 5 − 4/5 + 4, 7 − 2/7 + 2, 7 − 3/7 + 3, 7 − 4/7 + 4, and 7 − 5/7 + 5, were used.
> The 20th and 80th percentiles were used, rather than minimum and maximum values, to reduce sensitivity to shadows and residual cloud and atmospheric contamination effects. This provided a total of 39 metrics for each 30 m GWELD pixel location.


# gdalinfo on the imagery sources

### L7 Training (2010 example)
Size is 65308, 47219
Coordinate System is:
PROJCS["WGS 84 / Pseudo-Mercator",
    GEOGCS["WGS 84",
        DATUM["WGS_1984",
            SPHEROID["WGS 84",6378137,298.257223563,
                AUTHORITY["EPSG","7030"]],
            AUTHORITY["EPSG","6326"]],
        PRIMEM["Greenwich",0,
            AUTHORITY["EPSG","8901"]],
        UNIT["degree",0.0174532925199433,
            AUTHORITY["EPSG","9122"]],
        AUTHORITY["EPSG","4326"]],
    PROJECTION["Mercator_1SP"],
    PARAMETER["central_meridian",0],
    PARAMETER["scale_factor",1],
    PARAMETER["false_easting",0],
    PARAMETER["false_northing",0],
    UNIT["metre",1,
        AUTHORITY["EPSG","9001"]],
    AXIS["X",EAST],
    AXIS["Y",NORTH],
    EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs"],
    AUTHORITY["EPSG","3857"]]
Origin = (3662400.000000000000000,4640340.000000000000000)
Pixel Size = (30.000000000000000,-30.000000000000000)
Corner Coordinates:
Upper Left  ( 3662400.000, 4640340.000) ( 32d53'59.64"E, 38d25'47.75"N)
Lower Left  ( 3662400.000, 3223770.000) ( 32d53'59.64"E, 27d47'59.67"N)
Upper Right ( 5621640.000, 4640340.000) ( 50d30' 0.18"E, 38d25'47.75"N)
Lower Right ( 5621640.000, 3223770.000) ( 50d30' 0.18"E, 27d47'59.67"N)
Center      ( 4642020.000, 3932055.000) ( 41d41'59.91"E, 33d16'35.20"N)
Band 1 Block=128x128 Type=Float32, ColorInterp=Gray
Band 2 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 3 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 4 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 5 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 6 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 7 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 8 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 9 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 10 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 11 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 12 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 13 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 14 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 15 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 16 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 17 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 18 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 19 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 20 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 21 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 22 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 23 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 24 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 25 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 26 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 27 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 28 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 29 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 30 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 31 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 32 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 33 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 34 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 35 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 36 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 37 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 38 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 39 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 40 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 41 Block=128x128 Type=Float32, ColorInterp=Undefined
Band 42 Block=128x128 Type=Float32, ColorInterp=Undefined

### MODIS classification output
[ec2-user@ip-172-31-8-247 ~]$ docker run -v $(pwd):/data geodata/gdal gdalinfo LABELS_POST_STABILIZED_MODIS-006-MCD12Q1-2016-2018.tif
Driver: GTiff/GeoTIFF
Files: LABELS_POST_STABILIZED_MODIS-006-MCD12Q1-2016-2018.tif
Size is 3920, 2834
Coordinate System is:
PROJCS["WGS 84 / Pseudo-Mercator",
    GEOGCS["WGS 84",
        DATUM["WGS_1984",
            SPHEROID["WGS 84",6378137,298.257223563,
                AUTHORITY["EPSG","7030"]],
            AUTHORITY["EPSG","6326"]],
        PRIMEM["Greenwich",0,
            AUTHORITY["EPSG","8901"]],
        UNIT["degree",0.0174532925199433,
            AUTHORITY["EPSG","9122"]],
        AUTHORITY["EPSG","4326"]],
    PROJECTION["Mercator_1SP"],
    PARAMETER["central_meridian",0],
    PARAMETER["scale_factor",1],
    PARAMETER["false_easting",0],
    PARAMETER["false_northing",0],
    UNIT["metre",1,
        AUTHORITY["EPSG","9001"]],
    AXIS["X",EAST],
    AXIS["Y",NORTH],
    EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs"],
    AUTHORITY["EPSG","3857"]]
Origin = (3662000.000000000000000,4640500.000000000000000)
Pixel Size = (500.000000000000000,-500.000000000000000)
Metadata:
  AREA_OR_POINT=Area
Image Structure Metadata:
  COMPRESSION=LZW
  INTERLEAVE=BAND
Corner Coordinates:
Upper Left  ( 3662000.000, 4640500.000) ( 32d53'46.70"E, 38d25'51.81"N)
Lower Left  ( 3662000.000, 3223500.000) ( 32d53'46.70"E, 27d47'51.94"N)
Upper Right ( 5622000.000, 4640500.000) ( 50d30'11.83"E, 38d25'51.81"N)
Lower Right ( 5622000.000, 3223500.000) ( 50d30'11.83"E, 27d47'51.94"N)
Center      ( 4642000.000, 3932000.000) ( 41d41'59.26"E, 33d16'33.71"N)
Band 1 Block=256x256 Type=Byte, ColorInterp=Gray


### Global Human Settlement Layer
Driver: GTiff/GeoTIFF
Files: ghsb/GHS-BUILT_gte50cnfd.tif
Size is 65308, 47219
Coordinate System is:
PROJCS["WGS 84 / Pseudo-Mercator",
    GEOGCS["WGS 84",
        DATUM["WGS_1984",
            SPHEROID["WGS 84",6378137,298.257223563,
                AUTHORITY["EPSG","7030"]],
            AUTHORITY["EPSG","6326"]],
        PRIMEM["Greenwich",0,
            AUTHORITY["EPSG","8901"]],
        UNIT["degree",0.0174532925199433,
            AUTHORITY["EPSG","9122"]],
        AUTHORITY["EPSG","4326"]],
    PROJECTION["Mercator_1SP"],
    PARAMETER["central_meridian",0],
    PARAMETER["scale_factor",1],
    PARAMETER["false_easting",0],
    PARAMETER["false_northing",0],
    UNIT["metre",1,
        AUTHORITY["EPSG","9001"]],
    AXIS["X",EAST],
    AXIS["Y",NORTH],
    EXTENSION["PROJ4","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs"],
    AUTHORITY["EPSG","3857"]]
Origin = (3662400.000000000000000,4640340.000000000000000)
Pixel Size = (30.000000000000000,-30.000000000000000)
Metadata:
  AREA_OR_POINT=Area
Image Structure Metadata:
  COMPRESSION=LZW
  INTERLEAVE=BAND
Corner Coordinates:
Upper Left  ( 3662400.000, 4640340.000) ( 32d53'59.64"E, 38d25'47.75"N)
Lower Left  ( 3662400.000, 3223770.000) ( 32d53'59.64"E, 27d47'59.67"N)
Upper Right ( 5621640.000, 4640340.000) ( 50d30' 0.18"E, 38d25'47.75"N)
Lower Right ( 5621640.000, 3223770.000) ( 50d30' 0.18"E, 27d47'59.67"N)
Center      ( 4642020.000, 3932055.000) ( 41d41'59.91"E, 33d16'35.20"N)
Band 1 Block=256x256 Type=Byte, ColorInterp=Gray
  Description = built



# Characteristic MODIS cell counts

### before processing (in this case, from 2018)
total pixels: 11109280  
NODATA (irrelevant): 1332306
(total - NODATA): 9776974 100%
01 - evergreen needle: 9156 0.1%
02 - evergreen broad: 289 ~0%
03 - deciduous needle: 0 0%
04 - deciduous broad: 19447 0.2%
05 - mixed forest: 3859 ~0%
06 - closed shrub: 190 ~0%
07 - open shrub: 856589 8.8%
08 - woody savanna: 20019 0.2%
09 - savanna: 83578 0.9%
10 - grassland: 2304593 23.6%
11 - wetland: 8594 0.1%
12 - cropland: 1185669 12.1%
13 - urban/built up (removed in favor of more precise training data): 33008 0.3%
14 - crop/natural mosaic: 12819 0.1%
15 - snow/ice 130 ~0%
16 - barren: 5235670 53.6%
17 - water: 3364 ~0%

### after processing (2016-2019)
[ 0,       1,   4,     5,  6,  7,      8,     9,    10,     11,    12,   14, 15,  16,     17]
[3663261, 1216, 6547, 347, 1, 326218, 1639, 8958, 1519107, 1580, 722651, 641, 8, 4856552, 554]))
[0.492,    0.   0.001, 0.  0. 0.044,   0.   0.001, 0.204,    0.   0.097,  0.  0.  0.652,   0.]
11109280 - 3663261 = 7446019

(obviously some of these categories have fewer representative cells than would be desirable)


### after correlating and extracting relevant landsat information
Note the loss of data in 16. It is possible that barren lands perform poorly in cloud detection.
Nevertheless, barren lands are overrepreseneted after processing
(array([ 1.,   4.,   5., 6.,  7.,     8.,   9.,    10.,    11.,   12.,  14., 15., 16.,     17.   ], dtype=float32),
 array([1216, 6547, 347, 1,  326216, 1639, 8958, 1519105, 1580, 722651, 641, 8,   4354737, 554  ])


### fairness for urban
Originally, we had ~33k points; sampling from ghsl has given us quite a bit more. to cut down on that, we will randomly sample:

```
python
In [27]: np.unique(ghsl[np.random.randint(0,urban.shape[0],30000)], axis=0).shape
Out[27]: (29951, 43)
```


### Cross validation notes

`forest = RandomForestClassifier(n_estimators=10, n_jobs=96)`
{'fit_time': array([449.54606962, 463.43665481, 471.68625784, 476.47681355,
        525.02835155]),
 'score_time': array([16.7295289 , 17.18933916, 17.51747227, 15.96680689, 15.44142962]),
 'test_precision_macro': array([0.22680161, 0.22569938, 0.21635082, 0.28216761, 0.2297061 ]),
 'train_precision_macro': array([0.99254467, 0.99332623, 0.99297611, 0.99163158, 0.99314764]),
 'test_recall_macro': array([0.20821111, 0.22952796, 0.25499353, 0.23638772, 0.21019067]),
 'train_recall_macro': array([0.94634779, 0.94750419, 0.95102595, 0.94710834, 0.93679057]),
 'test_precision_micro': array([0.85738077, 0.87611851, 0.83877472, 0.90706785, 0.87324036]),
 'train_precision_micro': array([0.99610171, 0.99633219, 0.99622768, 0.99595067, 0.99621628]),
 'test_recall_micro': array([0.85738077, 0.87611851, 0.83877472, 0.90706785, 0.87324036]),
 'train_recall_micro': array([0.99610171, 0.99633213, 0.99622773, 0.99595073, 0.99621622])}

`gnb = GaussianNB()`
{'fit_time': array([13.46019197, 13.37376618, 13.43931437, 13.38896942, 13.50682354]),
 'score_time': array([100.03660488,  99.59879541,  99.85891318,  99.42650366,
        100.1441505 ]),
 'test_precision_macro': array([0.19558938, 0.20299884, 0.20086653, 0.21664595, 0.1627633 ]),
 'train_precision_macro': array([0.18301194, 0.19506515, 0.20503685, 0.19875449, 0.21140429]),
 'test_recall_macro': array([0.23003517, 0.26325739, 0.32562171, 0.28455605, 0.24900773]),
 'train_recall_macro': array([0.30621927, 0.29676336, 0.28356851, 0.28476907, 0.29935628]),
 'test_precision_micro': array([0.65307033, 0.63586849, 0.62248402, 0.79877891, 0.55193711]),
 'train_precision_micro': array([0.67642196, 0.68461965, 0.67977124, 0.64668222, 0.70695749]),
 'test_recall_micro': array([0.65307033, 0.63586849, 0.62248402, 0.79877891, 0.55193711]),
 'train_recall_micro': array([0.67642196, 0.68461965, 0.67977124, 0.64668222, 0.70695749])}

### random forest with a union over forrests
`forest = RandomForestClassifier(n_estimators=10, n_jobs=96)`
 {'fit_time': array([271.86598229, 266.68094277, 256.71822929, 275.22228265,
        270.49822998]),
 'score_time': array([34.45563102, 37.23960781, 36.51685238, 34.10637856, 35.40221882]),
 'test_precision_macro': array([0.25359437, 0.22640648, 0.28887153, 0.34658938, 0.29405004]),
 'train_precision_macro': array([0.99829672, 0.9981257 , 0.99806751, 0.99779684, 0.99852409]),
 'test_recall_macro': array([0.21843378, 0.22882441, 0.26528826, 0.24435263, 0.22065864]),
 'train_recall_macro': array([0.99336333, 0.99512283, 0.99478123, 0.99391714, 0.9941623 ]),
 'test_f1_macro': array([0.21699748, 0.22498743, 0.26225454, 0.25703965, 0.22535106]),
 'train_f1_macro': array([0.99581504, 0.99661833, 0.99641845, 0.99584897, 0.99633188]),
 'test_precision_micro': array([0.71980339, 0.74430311, 0.82368777, 0.83979418, 0.77594554]),
 'train_precision_micro': array([0.99907193, 0.99921658, 0.99905921, 0.99894235, 0.99909183]),
 'test_recall_micro': array([0.71980339, 0.74430239, 0.82368849, 0.83979418, 0.77594554]),
 'train_recall_micro': array([0.99907193, 0.99921658, 0.99905921, 0.99894235, 0.99909183]),
 'test_f1_micro': array([0.71980339, 0.74430311, 0.82368705, 0.83979418, 0.77594554]),
 'train_f1_micro': array([0.99907193, 0.99921658, 0.99905921, 0.99894235, 0.99909183]),
 'test_f1_weighted': array([0.73155872, 0.7576198 , 0.81757421, 0.8263475 , 0.74337154]),
 'train_f1_weighted': array([0.99907173, 0.9992164 , 0.999059  , 0.9989421 , 0.9990916 ]),
 'test_balanced_accuracy': array([0.21843378, 0.22882504, 0.26528965, 0.24435263, 0.22065864]),
 'train_balanced_accuracy': array([0.9933508 , 0.99512319, 0.99478123, 0.99391706, 0.9941623 ]),
 'test_accuracy': array([0.71980339, 0.74430311, 0.82368777, 0.83979418, 0.77594554]),
 'train_accuracy': array([0.99907193, 0.99921658, 0.99905921, 0.99894235, 0.99909183])}

 # random forest w/ balanced weights
 {'fit_time': array([882.47669649, 877.65569258, 869.95466733]),
 'score_time': array([226.45323992, 210.99029684, 211.60954905]),
 'test_precision_macro': array([0.64171625, 0.64296782, 0.62647503]),
 'train_precision_macro': array([0.99249502, 0.99214555, 0.9924119 ]),
 'test_recall_macro': array([0.50636225, 0.50629126, 0.50617996]),
 'train_recall_macro': array([0.99916042, 0.99916039, 0.99920848]),
 'test_f1_macro': array([0.53306947, 0.53297144, 0.53252239]),
 'train_f1_macro': array([0.99580837, 0.99563146, 0.99578999]),
 'test_precision_micro': array([0.93695298, 0.93679539, 0.93689738]),
 'train_precision_micro': array([0.99875239, 0.99875793, 0.99877322]),
 'test_recall_micro': array([0.93695298, 0.93679539, 0.93689738]),
 'train_recall_micro': array([0.99875239, 0.99875793, 0.99877322]),
 'test_f1_micro': array([0.93695298, 0.93679539, 0.93689738]),
 'train_f1_micro': array([0.99875239, 0.99875793, 0.99877322]),
 'test_f1_weighted': array([0.93272092, 0.93255988, 0.93266336]),
 'train_f1_weighted': array([0.99875505, 0.9987606 , 0.99877583]),
 'test_balanced_accuracy': array([0.50636225, 0.50629126, 0.50617996]),
 'train_balanced_accuracy': array([0.99916042, 0.99916039, 0.99920848]),
 'test_accuracy': array([0.93695298, 0.93679539, 0.93689738]),
 'train_accuracy': array([0.99875239, 0.99875793, 0.99877322])}

calculated weights: [3.76658270e+02, 9.36400792e+00, 2.88260694e+02, 2.01085414e+00, 4.22332692e+00, 2.11532034e-01, 7.01465685e-01]

# random forest with custom balanced weights
In [142]: rfw = RandomForestClassifier(n_estimators=100, n_jobs=96, class_weight={5:10000, 7:20, 9:20, 10:10, 12:100, 13:5, 16:5}, max_depth=10)

In [143]: rfw.fit(xs_train, ys_train)
Out[143]:
RandomForestClassifier(bootstrap=True,
            class_weight={5: 10000, 7: 20, 9: 20, 10: 10, 12: 100, 13: 5, 16: 5},
            criterion='gini', max_depth=10, max_features='auto',
            max_leaf_nodes=None, min_impurity_decrease=0.0,
            min_impurity_split=None, min_samples_leaf=1,
            min_samples_split=2, min_weight_fraction_leaf=0.0,
            n_estimators=100, n_jobs=96, oob_score=False,
            random_state=None, verbose=0, warm_start=False)

In [144]: rfw.score(xs_test, ys_test)
Out[144]: 0.8239511434921409


### computing weights to favor rarer labels
https://scikit-learn.org/stable/modules/generated/sklearn.utils.class_weight.compute_class_weight.html

```
clf_export = RandomForestClassifier(n_estimators=100, n_jobs=96, class_weight={5:400, 7:9.36, 9:288, 10:2, 12:8, 13:0.2, 16:0.7}, max_depth=12)

In [230]: clf.score(xs_train, ys_train)
Out[230]: 0.8201842688242796

In [231]: clf.score(xs_train[ys_train==13], ys_train[ys_train==13])
Out[231]: 0.8621469552541645

In [232]: clf.score(xs_train[ys_train==16], ys_train[ys_train==16])
Out[232]: 0.8821884470566627

In [233]: clf.score(xs_train[ys_train==5], ys_train[ys_train==5])
Out[233]: 0.6092964824120602

In [234]: clf.score(xs_train[ys_train==12], ys_train[ys_train==12])
Out[234]: 0.6891914305459571
```


# artifacts

### scanline correction in l7
Landsat7 allows us to get sample the spectrum with multiple bandsback to 2010 but
suffers from unavoidable (you can make up data but that's risky) scan line correction
errors:
"Since June 2003, the sensor has acquired and delivered data with data gaps caused by the Scan Line Corrector (SLC) failure." https://www.usgs.gov/land-resources/nli/landsat/landsat-7

This is generally not considered a problem for statistical analyses and we likely couldn't
achieve the kind of fidelity we have without the bands L7 provides. The USGS did a survey
of experts in various domains and concluded that, "Anomalous Landsat 7 data products retain
significant and important utility for scientific applications. The presence of the anomaly
and associated missing pixels does degrade the usefulness of the imagery however the majority
of scientists who have examined these anomalous data concluded that the data were still quite
useful for their particular application."
https://landsat.usgs.gov/sites/default/files/documents/SLC_off_Scientific_Usability.pdf

### the black desert of jordan (mostly in syria)
The black desert is filled with ferrous and basaltic rock formations which the model appears
to confuse with urban build up (not entirely surprising given the spectral similarities). Unclear
how easily we can train the model to handle this strange case without also missing urban areas.
For instance, just southeast of Palmyra, there appears to be an area that is incorrectly marked
as built up. Zooming in through Google Maps, however, it becomes clear that this is actually a
camp of some kind (and thus, correctly marked as built up). At 30m resolution, *I* couldn't
tell it was a camp without higher resolution imagery so the tradeoff might well be worth it.
Luckily, this is mostly a problem in Syria rather than our study area.
https://en.wikipedia.org/wiki/Harrat_al-Shamah

### lack of water detection
Water isn't a simple on or off problem, but we have to draw some lines around likely bodies
to avoid including clearly invalid data. The simplest path to avoiding problems is to use
a trusted dataset as a mask

### underreporting of forest
Forest is a category that's difficult to separate from shrubland (in the IGBP classification,
the line is drawn based on % cover).  As a result, there's a good chance that some forest is
classified as shrub and vice versa