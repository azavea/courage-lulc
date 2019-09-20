// Define a region of interest as a point.  Change the coordinates
// to get a classification of any place where there is imagery.
function maskL8sr(image) {
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = (1 << 3);
  var cloudsBitMask = (1 << 5);
  // Get the pixel QA band.
  var qa = image.select('pixel_qa');
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                 .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
}

var year = 2014
// Load Landsat 5 input imagery.
var landsat = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
  // Filter to get only one year of images.
  .filterDate(year+'-01-01', year+'-12-31')
  .filterBounds(geometry)
  .map(maskL8sr)
  .median();

var s1 = ee.ImageCollection('MODIS/006/MOD13Q1')
                  .filter(ee.Filter.date(year+'-01-01', year+'-03-31'))
                  .select('EVI')
                  .max()
                  .rename('evi1')
var s2 = ee.ImageCollection('MODIS/006/MOD13Q1')
                  .filter(ee.Filter.date(year+'-04-01', year+'-06-30'))
                  .select('EVI')
                  .max()
                  .rename('evi2')
var s3 = ee.ImageCollection('MODIS/006/MOD13Q1')
                  .filter(ee.Filter.date(year+'-07-01', year+'-09-30'))
                  .select('EVI')
                  .max()
                  .rename('evi3')
var s4 = ee.ImageCollection('MODIS/006/MOD13Q1')
                  .filter(ee.Filter.date(year+'-09-01', year+'-12-31'))
                  .select('EVI')
                  .max()
                  .rename('evi4')

var ndbi = landsat.normalizedDifference(['B6','B5']).rename('ndbi')
landsat = landsat.addBands([s1, s2, s3, s4, ndbi])

/*
Map.addLayer(modis, {palette: igbpPalette, min: 0, max: 17}, 'modis');
*/
var visParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000,
  gamma: 1.4,
};

var fc = urban.merge(other);
var bands = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'evi1', 'evi2', 'evi3', 'evi4', 'ndbi'];
Export.table.toDrive({
  collection: fc,
  description:'lebanon-urban-binary',
  fileFormat: 'KML'
});

// Define a palette for the Land Use classification.
var palette = [
  'ffffff', // other
  '00ff00' // built up
];

// Sample the input imagery to get a FeatureCollection of training data.
var training = landsat.select(bands).sampleRegions({
  collection: fc,
  properties: ['landcover'],
  scale: 30
});
var classifier = ee.Classifier.randomForest(20, 0, 2).train({
  features: training,
  classProperty: 'landcover',
  inputProperties: bands
});

// Load country features from Large Scale International Boundary (LSIB) dataset.
var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');
// Subset the Congo Republic feature from countries.
var lebanon = countries.filter(ee.Filter.eq('country_na', 'Lebanon'))
  .map(function(feat){
    return feat.bounds()
  });


// Classify the input imagery.
var classified = landsat.select(bands).clip(lebanon).classify(classifier);

//Map.addLayer(landsat.clip(lebanon), visParams, 'Custom composite1');
Map.addLayer(landsat.clip(lebanon), visParams, 'Custom composite');

// Display the classification result and the input image.
Map.addLayer(classified.mask(classified.eq(1)), {palette: ['000000']}, 'Land Use Classification1');

// Get a confusion matrix representing resubstitution accuracy.
print('RF error matrix (training): ', classifier.confusionMatrix());
print('RF accuracy (training): ', classifier.confusionMatrix().accuracy());

var sums = classified.reduceRegions(lebadm2, ee.Reducer.sum(), 30);
sums = sums.map(function(f) {
  return ee.Feature(null, f.properties)
});
Export.table.toDrive({
  collection: sums,
  description:'lebanon-urban-'+year,
  fileFormat: 'CSV'
});

var counts =  classified.reduceRegions(lebadm2, ee.Reducer.count(), 30);
counts = counts.map(function(f) {
  return ee.Feature(null, f.properties);
});
Export.table.toAsset({
  collection: counts,
  description:'lebanon-urban-sums-'+year,
  assetId: 'leb-urb-sum-'+year,
});


// https://code.earthengine.google.com/3d52b54f8875008b5f86959f669cf361