// This script grabs the training data and masks out everything but quality band 0
var modis_lc = ee.ImageCollection('MODIS/006/MCD12Q1')
                  .filter(ee.Filter.date('2016-01-01', '2020-01-01'));

var modis_imgs = modis_lc.getInfo()['features']

var aoi = ee.Geometry.Polygon([[32.9,27.8],[50.5,27.8],[50.5,38.1],[32.9,38.1],[32.9,27.8]])

for (var i = 0; i < modis_imgs.length; i = i + 1) {
  var img = ee.Image(modis_imgs[i]["id"]).select(['LC_Type1']);
  var quality_band = ee.Image(modis_imgs[i]["id"]).select(['QC']);
  /**
   * 0 means "Has a classification label and is land according to the water mask."
   * It also removes any backfilled classifications (changes in classification which were thrown out)
   * see p.15 of the modis MCD12C1 user guide
   * https://lpdaac.usgs.gov/documents/101/MCD12_User_Guide_V6.pdf
   */
  var mask = quality_band.eq(0);
  img = img.updateMask(mask)
  print(img.getInfo())
  Map.addLayer(mask, {'palette': ['ff0000','00ff00']}, "mask" + i)
  Map.addLayer(img, {}, modis_imgs[i]["id"])
  Export.image.toDrive({
    image: img,
    description: modis_imgs[i]["id"].replace(/\//g, "-"),
    region: aoi,
    scale: 30,
    crs: 'EPSG:3857'
  });
}