var modis = ee.ImageCollection("MODIS/006/MOD13Q1")
function purgeBadPixels(img) {
  var qa = img.select('SummaryQA').neq(0)
  return img.updateMask(img)
}
var waterMask = ee.Image("JRC/GSW1_1/GlobalSurfaceWater").select('seasonality').unmask(0).lte(4)
function yearCompare(after) {
  var before = after - 1
  before = ''+before
  after = ''+after
  var beforeMean = modis.filterDate(before+"-01-01", before+"-12-31").map(purgeBadPixels).select('EVI').mean().rename(before)
  var afterMean = modis.filterDate(after+"-01-01", after+"-12-31").map(purgeBadPixels).select('EVI').mean().rename(after)
  var joined = beforeMean.addBands([afterMean])
  var diff = afterMean.subtract(beforeMean).rename('diff')
  var normdiff = joined.normalizedDifference([after, before]).rename('normDiff')
  return joined.addBands([diff, normdiff])
}
function compare2019() {
  var beforeMean = modis.filterDate("2017-07-01", "2018-06-30").map(purgeBadPixels).select('EVI').mean().rename('2018')
  var afterMean = modis.filterDate("2018-07-01", "2019-06-30").map(purgeBadPixels).select('EVI').mean().rename('2019')
  var joined = beforeMean.addBands([afterMean])
  var diff = afterMean.subtract(beforeMean).rename('diff')
  var normdiff = joined.normalizedDifference(["2019", "2018"]).rename('normDiff')
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

for (var year = 2010; year < 2019; year++) {
  var evi = yearCompare(year).mask(waterMask).float()
  var jordan = evi.clip(jordanClip)
  Export.image.toDrive({
    image: jordan,
    description: "jordan-evichange-"+year,
    region: jordanBounds,
    scale: 250,
    maxPixels: 1e13
  });
  var iraq = evi.clip(iraqClip)
  Export.image.toDrive({
    image: iraq,
    description: "iraq-evichange-"+year,
    region: iraqBounds,
    scale: 250,
    maxPixels: 1e13
  });
  var lebanon = evi.clip(lebanonClip)
  Export.image.toDrive({
    image: lebanon,
    description: "lebanon-evichange-"+year,
    region: lebanonBounds,
    scale: 250,
    maxPixels: 1e13
  });
  Map.addLayer(evi.select('normDiff'), {min: -1, max: 1, palette: ['FF0000', '000000', '00FF00']}, "evi"+year, false)
}
var evi = compare2019().mask(waterMask).float()
var jordan = evi.clip(jordanClip)
Export.image.toDrive({
  image: jordan,
  description: "jordan-evichange-"+year,
  region: jordanBounds,
  scale: 250,
  maxPixels: 1e13
});
var iraq = evi.clip(iraqClip)
Export.image.toDrive({
  image: iraq,
  description: "iraq-evichange-"+year,
  region: iraqBounds,
  scale: 250,
  maxPixels: 1e13
});fl
var lebanon = evi.clip(lebanonClip)
Export.image.toDrive({
  image: lebanon,
  description: "lebanon-evichange-"+year,
  region: lebanonBounds,
  scale: 250,
  maxPixels: 1e13
});
Map.addLayer(evi.select('normDiff'), {min: -1, max: 1, palette: ['FF0000', '000000', '00FF00']}, "evi2019", false)

// https://code.earthengine.google.com/405659004b3a051fe373ec53835a9b1c