var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');
var iraqClip = countries.filter(ee.Filter.eq('country_na', 'Iraq'))
var iraqBounds = iraqClip.map(function(feat) {
    return feat.bounds()
  });
//Map.addLayer(iraqAdm2)
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
var cloudMaskL457 = function(image) {
  var qa = image.select('pixel_qa');
  var cloud = qa.bitwiseAnd(1 << 5)
                  .and(qa.bitwiseAnd(1 << 7))
                  .or(qa.bitwiseAnd(1 << 3));
  var mask2 = image.mask().reduce(ee.Reducer.min());
  return image.updateMask(cloud.not()).updateMask(mask2);
};
var waterMask = ee.Image("JRC/GSW1_1/GlobalSurfaceWater").select('seasonality').unmask(0).eq(0)
var bands = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7',
             'evi1', 'evi2', 'evi3', 'evi4', 'ndbi'];
function yearMosaicL7(year) {
  var l7 = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
    .filterDate(year+'-01-01', year+'-12-31')
    .filterBounds(iraqBounds)
    .map(cloudMaskL457)
    .median()
    .clip(iraqBounds)
  var evi1 = ee.ImageCollection('MODIS/006/MOD13Q1')
                    .filter(ee.Filter.date(year+'-01-01', year+'-03-31'))
                    .select('EVI')
                    .median()
                    .rename('evi1')
  var evi2 = ee.ImageCollection('MODIS/006/MOD13Q1')
                    .filter(ee.Filter.date(year+'-04-01', year+'-06-30'))
                    .select('EVI')
                    .median()
                    .rename('evi2')
  var evi3 = ee.ImageCollection('MODIS/006/MOD13Q1')
                    .filter(ee.Filter.date(year+'-07-01', year+'-09-30'))
                    .select('EVI')
                    .median()
                    .rename('evi3')
  var evi4 = ee.ImageCollection('MODIS/006/MOD13Q1')
                    .filter(ee.Filter.date(year+'-09-01', year+'-12-31'))
                    .select('EVI')
                    .median()
                    .rename('evi4')
  var ndbi = l7.normalizedDifference(['B5','B4']).rename('ndbi')
  return l7.addBands([ndbi, evi1, evi2, evi3, evi4]).mask(waterMask)
};
function yearMosaic(year) {
  var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
    .filterDate(year+'-01-01', year+'-12-31')
    .filterBounds(iraqBounds)
    .map(maskL8sr)
    .median()
    .clip(iraqBounds)
  var evi1 = ee.ImageCollection('MODIS/006/MOD13Q1')
                    .filter(ee.Filter.date(year+'-01-01', year+'-03-31'))
                    .select('EVI')
                    .median()
                    .rename('evi1')
  var evi2 = ee.ImageCollection('MODIS/006/MOD13Q1')
                    .filter(ee.Filter.date(year+'-04-01', year+'-06-30'))
                    .select('EVI')
                    .median()
                    .rename('evi2')
  var evi3 = ee.ImageCollection('MODIS/006/MOD13Q1')
                    .filter(ee.Filter.date(year+'-07-01', year+'-09-30'))
                    .select('EVI')
                    .median()
                    .rename('evi3')
  var evi4 = ee.ImageCollection('MODIS/006/MOD13Q1')
                    .filter(ee.Filter.date(year+'-09-01', year+'-12-31'))
                    .select('EVI')
                    .median()
                    .rename('evi4')
  var ndbi = l8.normalizedDifference(['B6','B5']).rename('ndbi')
  return l8.addBands([ndbi, evi1, evi2, evi3, evi4]).mask(waterMask)
}
function mosaic2019() {
  var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
    .filterDate('2018-07-01', '2019-06-30')
    .filterBounds(iraqBounds)
    .map(maskL8sr)
    .median()
    .clip(iraqBounds)
  var evi1 = ee.ImageCollection('MODIS/006/MOD13Q1')
                    .filter(ee.Filter.date('2019-01-01', '2019-03-31'))
                    .select('EVI')
                    .median()
                    .rename('evi1')
  var evi2 = ee.ImageCollection('MODIS/006/MOD13Q1')
                    .filter(ee.Filter.date('2019-04-01', '2019-06-30'))
                    .select('EVI')
                    .median()
                    .rename('evi2')
  var evi3 = ee.ImageCollection('MODIS/006/MOD13Q1')
                    .filter(ee.Filter.date('2018-07-01', '2018-09-30'))
                    .select('EVI')
                    .median()
                    .rename('evi3')
  var evi4 = ee.ImageCollection('MODIS/006/MOD13Q1')
                    .filter(ee.Filter.date('2018-09-01', '2018-12-31'))
                    .select('EVI')
                    .median()
                    .rename('evi4')
  var ndbi = l8.normalizedDifference(['B6','B5']).rename('ndbi')
  return l8.addBands([ndbi, evi1, evi2, evi3, evi4]).mask(waterMask)
}
function sampleYearL7(year, fc) {
  var l7 = yearMosaicL7(year)
  return l7.select(bands).sampleRegions({
    collection: fc,
    properties: ['landcover'],
    scale: 30
  });
}
function sampleYear(year, fc) {
  var l8 = yearMosaic(year)
  var rgbVis = {
    bands: ['B4', 'B3', 'B2'],
    min: 0,
    max: 3000,
    gamma: 1.4,
  };
  var eviVis = { min: -2000, max: 10000, opacity:0.16666 }
  //Map.addLayer(l8.clip(iraqClip).select('evi4'), eviVis, 'Iraq evi4 '+year, false);
  //Map.addLayer(l8.clip(iraqClip).select('evi3'), eviVis, 'Iraq evi3 '+year, false);
  //Map.addLayer(l8.clip(iraqClip).select('evi2'), eviVis, 'Iraq evi2 '+year, false);
  //Map.addLayer(l8.clip(iraqClip).select('evi1'), eviVis, 'Iraq evi1 '+year, false);
  Map.addLayer(l8.clip(iraqClip), rgbVis, 'Iraq rgb '+year, false);
  return l8.select(bands).sampleRegions({
    collection: fc,
    properties: ['landcover'],
    scale: 30
  });
}
function previewYear(clf, year, bounds) {
  var l8 = yearMosaic(year).clip(bounds)
  Map.addLayer(l8.classify(clf), {palette: ['000000', '00ff00'], min:0, max:1}, 'classified '+year, false)
}


// ====================================================================
var mergedFC = forest.merge(other);
//print(mergedFC, 'mergedFC')
Export.table.toDrive({
  collection: mergedFC,
  description:'iraq-forest-binary',
  fileFormat: 'KML'
});

// ====================================================================
var classifier = ee.Classifier.randomForest(30, 0, 2)
var fc2013 = sampleYear(2013, mergedFC)
var fc2014 = sampleYear(2014, mergedFC)
var fc2015 = sampleYear(2015, mergedFC)
var fc2016 = sampleYear(2016, mergedFC)
var fc2017 = sampleYear(2017, mergedFC)
var fc2018 = sampleYear(2018, mergedFC)
var training = fc2013.merge(fc2014).merge(fc2015).merge(fc2016).merge(fc2017).merge(fc2018)

var withRandom = training.randomColumn('random');

var split = 0.8;  // Roughly 70% training, 30% testing.
var trainingPartition = withRandom.filter(ee.Filter.lt('random', split));
var testingPartition = withRandom.filter(ee.Filter.gte('random', split));
print(trainingPartition.getInfo())
print(testingPartition.getInfo())

var trained = classifier.train({
  features: trainingPartition,
  classProperty: 'landcover',
  inputProperties: bands
});

// Classify the test FeatureCollection.
var test = testingPartition.classify(trained);

// Print the confusion matrix.
var confusionMatrix = test.errorMatrix('landcover', 'classification');
print('Confusion Matrix', confusionMatrix);
print('Validation overall accuracy: ', confusionMatrix.accuracy());

previewYear(trained, 2018, iraqClip)
previewYear(trained, 2017, iraqClip)
previewYear(trained, 2016, iraqClip)
previewYear(trained, 2015, iraqClip)
previewYear(trained, 2014, iraqClip)
previewYear(trained, 2013, iraqClip)

// L7 classifier
var fc2010 = sampleYearL7(2010, mergedFC)
var fc2011 = sampleYearL7(2011, mergedFC)
var fc2012 = sampleYearL7(2012, mergedFC)
var trainingL7 = fc2010.merge(fc2011).merge(fc2012)
var trainedL7 = classifier.train({
  features: trainingPartition,
  classProperty: 'landcover',
  inputProperties: bands
});


var sums = []
// classify 2010 - 2012 (L7)
for (var i = 2010; i <= 2012; i++) {
  var l7classified = yearMosaicL7(i).clip(iraqClip).classify(trainedL7).byte();
  Export.image.toDrive({
    image: l7classified,
    description: "iraq-forest-"+i,
    region: iraqBounds,
    scale: 30,
    maxPixels: 1e13
  });
  var summation = l7classified.reduceRegions({
    collection: iraqAdm2,
    reducer: ee.Reducer.sum().setOutputs(['count_'+i]),
    scale: 30,
    tileScale: 16
  })
  sums = sums.concat(summation)
}
// classify 2013 - 2018
for (var i = 2013; i <= 2018; i++) {
  var l8classified = yearMosaic(i).clip(iraqClip).classify(trained).byte();
  Export.image.toDrive({
    image: l8classified,
    description: "iraq-forest-"+i,
    region: iraqBounds,
    scale: 30,
    maxPixels: 1e13
  });
  var summation = l8classified.reduceRegions({
    collection: iraqAdm2,
    reducer: ee.Reducer.sum().setOutputs(['count_'+i]),
    scale: 30,
    tileScale: 16
  })
  sums = sums.concat(summation)
}
// classify 2019
var classified2019 = mosaic2019().clip(iraqClip).classify(trained).byte();
Export.image.toDrive({
  image: classified2019,
  description: "iraq-forest-"+2019,
  region: iraqBounds,
  scale: 30,
  maxPixels: 1e13
});
var summation2019 = classified2019.reduceRegions({
  collection: iraqAdm2,
  reducer: ee.Reducer.sum().setOutputs(['count_'+i]),
  scale: 30,
  tileScale: 16
})
sums = sums.concat(summation2019)
for (var i = 0; i < sums.length; i++) {
  var years = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019]
  Export.table.toDrive({
    collection: sums[i],
    description:'iraq-forest-'+years[i],
    fileFormat: 'CSV'
  });
}

// https://code.earthengine.google.com/d101d517c5c2fb31c73947526959a692