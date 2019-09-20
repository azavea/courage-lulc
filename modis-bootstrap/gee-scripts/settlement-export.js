/**
 * This script aims to extract high quality settlement data (>20;50;80 percent confident)
 * from the GHSL (https://ghsl.jrc.ec.europa.eu/ghs_bu2019.php)
 */
// GHSL data
var dataset = ee.Image('JRC/GHSL/P2016/BUILT_LDSMT_GLOBE_V1');
var aoi = ee.Geometry.Polygon([[32.9,27.8],[50.5,27.8],[50.5,38.1],[32.9,38.1],[32.9,27.8]]);

/*
  Refer to https://developers.google.com/earth-engine/datasets/catalog/JRC_GHSL_P2016_BUILT_LDSMT_GLOBE_V1
  for a sense of the meaning of values in the `built` band
*/
var built = dataset.select('built').gt(2)
var confidence = dataset.select('cnfd')

var greenOnly = { palette: ['00ff00'] };

function confCutoff(confPct) { return Math.round(255 * (confPct * 0.01)) }
var built20 = built.updateMask(confidence.gte(confCutoff(20)))
var built50 = built.updateMask(confidence.gte(confCutoff(50)))
var built80 = built.updateMask(confidence.gte(confCutoff(80)))

// urban detection is difficult. Play around with different cutoffs and cf. the NDBI
Map.addLayer(built80, greenOnly, 'confidence>80');
Map.addLayer(built50, greenOnly, 'confidence>50');
Map.addLayer(built20, greenOnly, 'confidence>20');

Export.image.toDrive({
  image: built20,
  description: "GHS-BUILT_gte20cnfd",
  region: aoi,
  scale: 30,
  maxPixels: 1e13,
  crs: 'EPSG:3857'
});

Export.image.toDrive({
  image: built50,
  description: "GHS-BUILT_gte50cnfd",
  region: aoi,
  scale: 30,
  maxPixels: 1e13,
  crs: 'EPSG:3857'
});

Export.image.toDrive({
  image: built80,
  description: "GHS-BUILT_gte80cnfd",
  region: aoi,
  scale: 30,
  maxPixels: 1e13,
  crs: 'EPSG:3857'
});
