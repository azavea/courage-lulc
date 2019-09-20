
/*
  This script is for exporting a reasonable water mask to reduce the
  complexity of MODIS prediction by reducing the number of labels to be
  inferred (and a particularly difficult label, at that)
*/

/*
  Jean-Francois Pekel, Andrew Cottam, Noel Gorelick, Alan S. Belward, High-resolution
  mapping of global surface water and its long-term changes. Nature 540, 418-422 (2016).
  (doi:10.1038/nature20584)
*/
var img = ee.Image("JRC/GSW1_1/GlobalSurfaceWater");
var seasonality = img.select('seasonality').gte(1).byte()
print(seasonality.getInfo())

Map.addLayer(seasonality);
var aoi = ee.Geometry.Polygon([[32.9,27.8],[50.5,27.8],[50.5,38.1],[32.9,38.1],[32.9,27.8]]);

Export.image.toDrive({
  image: seasonality,
  description: "watermask",
  region: aoi,
  scale: 30,
  maxPixels: 1e13,
  crs: 'EPSG:3857'
});