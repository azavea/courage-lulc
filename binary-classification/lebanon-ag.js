// Define a region of interest as a point.  Change the coordinates
// to get a classification of any place where there is imagery.
var roi = ag
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
  .filterDate(year+'-01-01', year+'-6-30')
  .filterBounds(ag)
  .map(maskL8sr)
  .median()
  
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

var newfc = ag.merge(other);
print(newfc, 'newfc')
var bands = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'evi1', 'evi2', 'evi3', 'evi4', 'ndbi'];
Export.table.toDrive({
  collection: newfc,
  description:'lebanon-ag-binary',
  fileFormat: 'KML'
});

// Define a palette for the Land Use classification.
var palette = [
  'ffffff', // other
  '00ff00' // ag (1) 
];
// Sample the input imagery to get a FeatureCollection of training data.
var training = landsat.select(bands).sampleRegions({
  collection: newfc,
  properties: ['landcover'],
  scale: 30
});
var classifier = ee.Classifier.randomForest(15, 0, 2).train({
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
var classified = landsat.select(bands).clip(lebanon).classify(classifier).rename('lc2014');

//Map.addLayer(landsat.clip(lebanon), visParams, 'Custom composite1');

// Display the classification result and the input image.
Map.addLayer(classified, {min: 0, max: 1, palette: palette}, 'Land Use Classification');

// Get a confusion matrix representing resubstitution accuracy.
print('RF error matrix: ', classifier.confusionMatrix());
print('RF accuracy: ', classifier.confusionMatrix().accuracy());

print(classified.getInfo())

//var reduction1 = classified.reduceRegions(lebadm2, ee.Reducer.sum(), 30)
var reduction = classified.reduceRegions(lebadm2, ee.Reducer.sum(), 30)
Export.table.toDrive({
  collection: reduction,
  description:'lebanon-ag-'+year,
  fileFormat: 'KML'
});

// https://code.earthengine.google.com/11bf3d022ccc74630e9cea757bb55d84