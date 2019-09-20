/*
  This script is specific to the export of 2019 data. Because we lack any data from the latter
  half of 2019, we've got to backfill with the latter half of 2018's data. This script is thus
  not useful except as a reference for understanding how missing data is to be dealt with.
*/
var aoi = ee.Geometry.Polygon([[32.9,27.8],[50.5,27.8],[50.5,38.1],[32.9,38.1],[32.9,27.8]]);

/**
 * Function to mask clouds based on the pixel_qa band of Landsat SR data.
 * @param {ee.Image} image Input Landsat SR image
 * @return {ee.Image} Cloudmasked Landsat image
 */
var cloudMaskL457 = function(image) {
  var qa = image.select('pixel_qa');
  // If the cloud bit (5) is set and the cloud confidence (7) is high
  // or the cloud shadow bit is set (3), then it's a bad pixel.
  var cloud = qa.bitwiseAnd(1 << 5)
                  .and(qa.bitwiseAnd(1 << 7))
                  .or(qa.bitwiseAnd(1 << 3));
  // Remove edge pixels that don't occur in all bands
  var mask2 = image.mask().reduce(ee.Reducer.min());
  return image.updateMask(cloud.not()).updateMask(mask2);
};


/*
  Temporal metrics, such as the median value, are insensitive to phenological
  differences and missing data. Temporal metrics do not explicitly capture the
  timing but rather the amplitude of the reflectance variation and so are
  insensitive to phenological differences

  (We're avoiding time series and just going with different percentiles as a proxy for variation)
*/
// the blue band is susceptible to atmospheric scattering so we won't use it
var preReduce = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
                  .filterDate(2018+'-08-04', 2019+'-08-03')
                  .filterBounds(aoi)
                  .map(cloudMaskL457)
                  .select(["B2", "B3", "B4", "B5", "B6", "B7"])
print(preReduce.getInfo())

// 4 − 3/4 + 3 (i.e. NDVI), 5 − 2/5 + 2, 5 − 3/5 + 3, 5 − 4/5 + 4, 7 − 2/7 + 2, 7 − 3/7 + 3, 7 − 4/7 + 4, and 7 − 5/7 + 5
var withNormalizedDiff = preReduce.map(function(img) {
  img = img.addBands(img.normalizedDifference(['B4','B3']).rename('nd43'))
  img = img.addBands(img.normalizedDifference(['B5','B2']).rename('nd52'))
  img = img.addBands(img.normalizedDifference(['B5','B3']).rename('nd53'))
  // The paper we're loosely following falls back on NLCD for urban classifications.
  // That's a luxury we don't have. instead, we'll include NDBI
  // It isn't perfect (especially in the desert) but it should help
  // see: https://is.muni.cz/el/1431/podzim2012/Z8114/um/35399132/35460312/ndbi.pdf
  img = img.addBands(img.normalizedDifference(['B5','B4']).rename('nd54'))
  img = img.addBands(img.normalizedDifference(['B7','B2']).rename('nd72'))
  img = img.addBands(img.normalizedDifference(['B7','B3']).rename('nd73'))
  img = img.addBands(img.normalizedDifference(['B7','B4']).rename('nd74'))
  img = img.addBands(img.normalizedDifference(['B7','B5']).rename('nd75'))
  return img
})

// With this much data, double precision means *way* too many bytes. floats should be fine.
var reduced = withNormalizedDiff.reduce(ee.Reducer.percentile([20, 50, 80])).float()

Export.image.toDrive({
  image: reduced,
  description: "L7-ME-2018-2019",
  region: aoi,
  scale: 30,
  maxPixels: 1e13,
  crs: 'EPSG:3857'
});

/*
var vis20 = {
  bands: ['B4_p20', 'B3_p20', 'B2_p20'],
  min: 0,
  max: 3000,
  gamma: 1.4,
};
Map.addLayer(reduced, vis20, '20');
*/

/*
var vis50 = {
  bands: ['B4_p50', 'B3_p50', 'B2_p50'],
  min: 0,
  max: 3000,
  gamma: 1.4,
};
Map.addLayer(reduced, vis50, '50');
*/

/*
var vis80 = {
  bands: ['B4_p80', 'B3_p80', 'B2_p80'],
  min: 0,
  max: 3000,
  gamma: 1.4,
};
Map.addLayer(reduced, vis80, '80');
*/

/*
var visNDVI20 = {
  bands: ['nd43_p20'],
  min: 0.0,
  max: 1.0,
  palette: [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'
  ],
};
Map.addLayer(reduced, visNDVI20, 'ndvi20')
*/

/*
var visNDVI50 = {
  bands: ['nd43_p50'],
  min: 0.0,
  max: 1.0,
  palette: [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'
  ],
};
Map.addLayer(reduced, visNDVI50, 'ndvi50')
*/

/*
var visNDVI80 = {
  bands: ['nd43_p80'],
  min: 0.0,
  max: 1.0,
  palette: [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'
  ],
};
Map.addLayer(reduced, visNDVI80, 'ndvi80')
*/