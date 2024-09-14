import { readFile } from 'fs/promises';
import fs from 'fs'
import _ from 'lodash'
import maplibregl from 'maplibre-gl'

import districts from '../../public/data/districts.json' assert { type: "json" };
import subdistricts from '../../public/data/subdistricts.json' assert { type: "json" };
import dogtown_outline from '../raw/dogtown_outline.json' assert { type: "json" };
import morro_rock_outline from '../raw/morro_rock_outline.json' assert { type: "json" };
import west_wind_estate_outline from '../raw/west_wind_estate_outline.json' assert { type: "json" };
import coastview_outline from '../raw/coastview_outline.json' assert { type: "json" };
import pacifica_outline from '../raw/coastview_outline.json' assert { type: "json" };


let newDistricts = districts
let newSubdistricts = subdistricts

let CURDIST = 'Pacifica'
newDistricts[CURDIST].latitude = undefined
newDistricts[CURDIST].longitude = undefined
newDistricts[CURDIST].position = {
  x: -2412.75,
  y: -2673.5,
  z: 107.61438,
}
newDistricts[CURDIST].geometry = dogtown_outline.map((item) => (
  [item.X, item.Y]
))
newDistricts[CURDIST].geometry.push(newDistricts[CURDIST].geometry[0])

/* let CURDIST = 'Dogtown'
newDistricts[CURDIST].latitude = undefined
newDistricts[CURDIST].longitude = undefined
newDistricts[CURDIST].position = {
  x: -2412.75,
  y: -2673.5,
  z: 107.61438,
}
newDistricts[CURDIST].geometry = dogtown_outline.map((item) => (
  [item.X, item.Y]
))
newDistricts[CURDIST].geometry.push(newDistricts[CURDIST].geometry[0])
newSubdistricts[CURDIST] = newDistricts[CURDIST]


CURDIST = 'Morro Rock'
newDistricts[CURDIST].latitude = undefined
newDistricts[CURDIST].longitude = undefined
newDistricts[CURDIST].position = {
  x: -3087.36011,
  y: 556.390015,
  z: 0,
}
newDistricts[CURDIST].geometry = morro_rock_outline.map((item) => (
  [item.X, item.Y]
))
newDistricts[CURDIST].geometry.push(newDistricts[CURDIST].geometry[0])
newSubdistricts[CURDIST] = newDistricts[CURDIST]


var rotateVector = function(vec, ang)
{
    ang = -ang * (Math.PI/180);
    var cos = Math.cos(ang);
    var sin = Math.sin(ang);
    return new Array(Math.round(10000*(vec[0] * cos - vec[1] * sin))/10000, Math.round(10000*(vec[0] * sin + vec[1] * cos))/10000);
};


let pacifica_data_transform = {
  position: {
    x: -2422.44092,
    y: -2368.15576,
  }
}
let rot_fix = -65
CURDIST = 'West Wind Estate'
newSubdistricts[CURDIST].latitude = undefined
newSubdistricts[CURDIST].longitude = undefined
newSubdistricts[CURDIST].position = {
  x: pacifica_data_transform.position.x - 521.5,
  y: pacifica_data_transform.position.y - 69.8,
  z: 0,
}
newSubdistricts[CURDIST].geometry = west_wind_estate_outline.map((item) => (
  rotateVector([item.X, item.Y], rot_fix)
))
newSubdistricts[CURDIST].geometry.push(newSubdistricts[CURDIST].geometry[0])

CURDIST = 'Coastview'
newSubdistricts[CURDIST].latitude = undefined
newSubdistricts[CURDIST].longitude = undefined
newSubdistricts[CURDIST].position = {
  x: pacifica_data_transform.position.x + 494.5,
  y: pacifica_data_transform.position.y - 28.5,
  z: 0,
}
newSubdistricts[CURDIST].geometry = coastview_outline.map((item) => (
  rotateVector([item.X, item.Y], rot_fix)
))
newSubdistricts[CURDIST].geometry.push(newSubdistricts[CURDIST].geometry[0])
 */




fs.writeFile(`../../public/data/districts.json`, JSON.stringify(newDistricts, null, '  '), err => {
  if (err) console.error(err)
})

fs.writeFile(`../../public/data/subdistricts.json`, JSON.stringify(newSubdistricts, null, '  '), err => {
  if (err) console.error(err)
})
