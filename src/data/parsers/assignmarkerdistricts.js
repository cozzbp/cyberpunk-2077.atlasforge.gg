

import { readFile } from 'fs/promises';
import fs from 'fs'
import _ from 'lodash'
import maplibregl from 'maplibre-gl'
import districts from '../districts.json' assert { type: "json" };
import subdistricts from '../subdistricts.json' assert { type: "json" };

import mapmarkers from '../mapmarkers.json' assert { type: "json" };


const modelOrigin = [0, 0];
const modelAltitude = 0;

const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
  modelOrigin,
  modelAltitude
);

modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()

function inside(point, vs) {
  // ray-casting algorithm based on
  // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html

  var x = point[0], y = point[1];

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i][0], yi = vs[i][1];
    var xj = vs[j][0], yj = vs[j][1];

    var intersect = ((yi > y) != (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
};

_.forEach(mapmarkers, (category, categoryName) => {
  _.forEach(category, (marker, index) => {

    let coords = new maplibregl.MercatorCoordinate(0.5 + modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * marker.position.x, 0.5 - modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * marker.position.y, 0);

    let district
    _.forEach(districts, (d) => {
      //console.log('inside?', )
      if (inside([coords.toLngLat().lng, coords.toLngLat().lat], d.geometry)) {
        mapmarkers[categoryName][index].district = d.name
      }
    })
    let subdistrict
    _.forEach(subdistricts, (d) => {
      //console.log('inside?', )
      if (inside([coords.toLngLat().lng, coords.toLngLat().lat], d.geometry)) {
        mapmarkers[categoryName][index].subdistrict = d.name
      }
    })
  })
})

fs.writeFileSync(`../mapmarkers.json`, JSON.stringify(mapmarkers, null, '  '), err => {
  if (err) console.error(err)
})