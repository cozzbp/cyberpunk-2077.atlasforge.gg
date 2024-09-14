import { readFile } from 'fs/promises';
import fs from 'fs'
import _ from 'lodash'
import maplibregl from 'maplibre-gl'

import hidden_gems from '../raw/hidden_gems.json' assert { type: "json" };

let final_gems = []
const modelOrigin = [0, 0];
const modelAltitude = 0;
const modelRotate = [Math.PI / 2, 0, 0];

const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
  modelOrigin,
  modelAltitude
);

hidden_gems.forEach(gem => {
  //console.log(gem)
  //mercx = 0.5 + modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * marker.position.x

  //markerpos = mercx/(0.5 + modelAsMercatorCoordinate.meterInMercatorCoordinateUnits())
  const coord = maplibregl.MercatorCoordinate.fromLngLat({ lng: gem.longitude, lat: gem.latitude }, 0);
  const scale = 0.078
  const newX = 0.5 + (coord.x - 0.49813) * scale
  const newY = 0.5 + (coord.y - 0.49753) * scale

  

  final_gems.push(
    [(newX - 0.5)/(modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()), (newY - 0.5)/(modelAsMercatorCoordinate.meterInMercatorCoordinateUnits())]
  )
/*   for (let i = 0; i < district.geometry.length; i++) {
    const lnglat = district.geometry[i]
    const scale = 0.078
    const coord = maplibregl.MercatorCoordinate.fromLngLat({ lng: lnglat[0], lat: lnglat[1] }, 0);
    const newX = 0.5 + (coord.x - 0.49813) * scale
    const newY = 0.5 + (coord.y - 0.49753) * scale
    const merc = new maplibregl.MercatorCoordinate(newX, newY);
    sumX += newX
    sumY += newY

    geo.push([merc.toLngLat().lng, merc.toLngLat().lat])
  } */

})

final_gems.sort((a, b) => {
  if (a[0] == b[0]) {
    return a[1] - b[1];
  }
  return b[0] - a[0];
})

fs.writeFile(`../raw/hidden_gems_transformed.json`, JSON.stringify(final_gems, null, '  '), err => {
  if (err) console.error(err)
})
