var h2018 = ee.Image("UMD/hansen/global_forest_change_2018_v1_6")


var treeCover = h2018.select(['treecover2000']);
var areaImage = treeCover.multiply(ee.Image.pixelArea()).divide(100);

var coverageLebanon = areaImage.reduceRegions({
  reducer: ee.Reducer.sum(),
  collection: lebadm2,
  scale: 30
});
Export.table.toDrive({
  collection: coverageLebanon,
  description:'lebanon-forestcoverage2',
  fileFormat: 'CSV'
});
var coverageJordan = areaImage.reduceRegions({
  reducer: ee.Reducer.sum(),
  collection: jAdm2,
  scale: 30
});
Export.table.toDrive({
  collection: coverageJordan,
  description:'jordan-forestcoverage2',
  fileFormat: 'CSV'
});
var coverageIraq = areaImage.reduceRegions({
  reducer: ee.Reducer.sum(),
  collection: iraqAdm2,
  scale: 30
});
Export.table.toDrive({
  collection: coverageIraq,
  description:'iraq-forestcoverage2',
  fileFormat: 'CSV'
});

for (var i = 10; i <= 19; i++) {
  var lossImage = h2018.select(['lossyear']).eq(i);
  var areaImageLost = lossImage.multiply(ee.Image.pixelArea());
  var coverageLost = areaImageLost.multiply(treeCover)
  coverageLost = coverageLost.divide(100)

  var coverageLossLebanon = coverageLost.reduceRegions({
    reducer: ee.Reducer.sum(),
    collection: lebadm2,
    scale: 30
  });
  Export.table.toDrive({
    collection: coverageLossLebanon,
    description:'lebanon-forestloss2-20'+i,
    fileFormat: 'CSV'
  });
  var coverageLossIraq = coverageLost.reduceRegions({
    reducer: ee.Reducer.sum(),
    collection: iraqAdm2,
    scale: 30
  });
  Export.table.toDrive({
    collection: coverageLossIraq,
    description:'iraq-forestloss2-20'+i,
    fileFormat: 'CSV'
  });
  var coverageLossJordan = coverageLost.reduceRegions({
    reducer: ee.Reducer.sum(),
    collection: jAdm2,
    scale: 30
  });
  Export.table.toDrive({
    collection: coverageLossJordan,
    description:'jordan-forestloss2-20'+i,
    fileFormat: 'CSV'
  });
}

// https://code.earthengine.google.com/ca44dd9b0112a5304199b05459cb6ba5