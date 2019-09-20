//var lights = ee.ImageCollection("NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG")
var lights = ee.ImageCollection('NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG')
function maskBadData(img) {
  var mask = img.select('cf_cvg')
  return img.updateMask(mask)
}
var waterMask = ee.Image("JRC/GSW1_1/GlobalSurfaceWater").select('seasonality').unmask(0).lte(4)
function yearCompareTest(before,after) {
  before = ''+before
  after = ''+after
  var lightsBefore = lights.filterDate(before+"-01-01", (before+1)+"-7-01")
  var lightsAfter = lights.filterDate((after-1)+"-6-30", after+"-12-31")
  //print(lightsBefore.getInfo(), lightsAfter.getInfo())
  var beforeMean = lightsBefore.map(maskBadData).select('avg_rad').mean().rename(before+'-mean')
  var afterMean = lightsAfter.map(maskBadData).select('avg_rad').mean().rename(after+'-mean')
  var joined = beforeMean.addBands([afterMean])
  var diff = afterMean.subtract(beforeMean).rename('diff')
  var normdiff = joined.normalizedDifference([after+'-mean', before+'-mean']).rename('normDiff')
  return joined.addBands([diff, normdiff])
}
function yearCompare2019() {
  var lightsBefore = lights.filterDate("2017-07-01", "2018-6-30")
  var lightsAfter = lights.filterDate("2018-07-01", "2019-6-30")
  //print(lightsBefore.getInfo(), lightsAfter.getInfo())
  var beforeMean = lightsBefore.map(maskBadData).select('avg_rad').mean().rename('2017_2018-mean')
  var afterMean = lightsAfter.map(maskBadData).select('avg_rad').mean().rename('2018_2019-mean')
  var joined = beforeMean.addBands([afterMean])
  var diff = afterMean.subtract(beforeMean).rename('diff')
  var normdiff = joined.normalizedDifference(['2017_2018-mean', '2018_2019-mean']).rename('normDiff')
  return joined.addBands([diff, normdiff])
}
function yearCompare(after) {
  var before = after - 1
  return yearCompareTest(before, after)
}
var lightsOld = ee.ImageCollection("NOAA/DMSP-OLS/CALIBRATED_LIGHTS_V4")
function yearCompareOld(before, after) {
  before = ''+before
  after = ''+after
  var lightsBefore = lightsOld.filterDate(before+"-01-01", before+"-12-31")
  var lightsAfter = lightsOld.filterDate(after+"-01-01", after+"-12-31")
  var beforeMean = lightsBefore.select('avg_vis').mean().rename(before+'-mean')
  var afterMean = lightsAfter.select('avg_vis').mean().rename(after+'-mean')
  var joined = beforeMean.addBands([afterMean])
  var diff = afterMean.subtract(beforeMean).rename('diff')
  var normdiff = joined.normalizedDifference([after+'-mean', before+'-mean']).rename('normDiff')
  return joined.addBands([diff, normdiff])
}
var countries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');
var jordanClip = countries.filter(ee.Filter.eq('country_na', 'Jordan'))
var jordanBounds = jordanClip.map(function(feat) {
    return feat.bounds()
  });
var iraqClip = countries.filter(ee.Filter.eq('country_na', 'Iraq'))
var iraqBounds = iraqClip.map(function(feat) {
    return feat.bounds()
  });
var lebanonClip = countries.filter(ee.Filter.eq('country_na', 'Lebanon'))
var lebanonBounds = lebanonClip.map(function(feat) {
    return feat.bounds()
  });
  

for (var year = 2015; year < 2019; year++) {
  var yearLights = yearCompare(year).updateMask(waterMask)
  Export.image.toDrive({
    image: yearLights,
    description: "jordan-lightchange-"+year,
    region: jordanBounds,
    scale: 250,
    maxPixels: 1e13
  });
  Export.image.toDrive({
    image: yearLights,
    description: "iraq-lightchange-"+year,
    region: iraqBounds,
    scale: 250,
    maxPixels: 1e13
  });
  Export.image.toDrive({
    image: yearLights,
    description: "lebanon-lightchange-"+year,
    region: lebanonBounds,
    scale: 250,
    maxPixels: 1e13
  });
  Map.addLayer(yearLights.select('diff'), {min: -40, max: 40, palette: ['FF0000', '000000', '00FF00']}, "yearLights"+year, false)
}
var y2010 = yearCompareOld(2005, 2010)
Export.image.toDrive({
  image: y2010,
  description: "jordan-lightchange_2005-2010",
  region: jordanBounds,
  scale: 500,
  maxPixels: 1e13
});
Export.image.toDrive({
  image: y2010,
  description: "iraq-lightchange_2005-2010",
  region: iraqBounds,
  scale: 500,
  maxPixels: 1e13
});
Export.image.toDrive({
  image: y2010,
  description: "lebanon-lightchange_2005-2010",
  region: lebanonBounds,
  scale: 500,
  maxPixels: 1e13
});
Map.addLayer(y2010.select('diff'), {min: -40, max: 40, palette: ['FF0000', '000000', '00FF00']}, "yearLights-"+(2011), false)
  
var y2019 = yearCompare2019()
Export.image.toDrive({
  image: y2019,
  description: "jordan-lightchange_2019",
  region: jordanBounds,
  scale: 250,
  maxPixels: 1e13
});
Export.image.toDrive({
  image: y2019,
  description: "iraq-lightchange_2019",
  region: iraqBounds,
  scale: 250,
  maxPixels: 1e13
});
Export.image.toDrive({
  image: y2019,
  description: "lebanon-lightchange_2019",
  region: lebanonBounds,
  scale: 250,
  maxPixels: 1e13
});
Map.addLayer(y2019.select('diff'), {min: -40, max: 40, palette: ['FF0000', '000000', '00FF00']}, "yearLights-2019", false)

function yearCompare2019b() {
  var lightsBefore = lights.filterDate("2014-01-01", "2014-12-31")
  var lightsAfter = lights.filterDate("2018-07-01", "2019-6-30")
  //print(lightsBefore.getInfo(), lightsAfter.getInfo())
  var beforeMean = lightsBefore.map(maskBadData).select('avg_rad').mean().rename('2017_2018-mean')
  var afterMean = lightsAfter.map(maskBadData).select('avg_rad').mean().rename('2018_2019-mean')
  var joined = beforeMean.addBands([afterMean])
  var diff = afterMean.subtract(beforeMean).rename('diff')
  var normdiff = joined.normalizedDifference(['2017_2018-mean', '2018_2019-mean']).rename('normDiff')
  return joined.addBands([diff, normdiff])
}
Map.addLayer(yearCompare2019b().select('diff'), {min: -40, max: 40, palette: ['FF0000', '000000', '00FF00']}, "yearLights-2019", true)


// https://code.earthengine.google.com/b6d3e0b7928b0a0d022ca837abf2c59d