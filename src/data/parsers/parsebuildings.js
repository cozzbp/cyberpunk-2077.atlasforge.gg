import { readFile } from 'fs/promises';
import fs from 'fs'
import _ from 'lodash'
import TGA from 'tga'

import buildings from '../raw/3dmap_coll_buildings.mesh.json' assert { type: "json" };


var watson_data = new TGA(fs.readFileSync('../raw/watson_data.tga'), { dontFixAlpha: true })
let buildingShapes = []

function imageProcess(image_data) {
  let image_matrix = []
  const height = image_data.height
  const width = image_data.width
  let k = 0
  for (let i = 0; i < height; i++) {
    image_matrix[i] = []
    for (let j = 0; j < width; j++) {
      image_matrix[i][j] = [image_data.pixels[k], image_data.pixels[k + 1], image_data.pixels[k + 2], image_data.pixels[k + 3]]
      k += 4
    }
  }

  let shapes = []
  for (let i = 1; i < height; i++) {
    for (let j = 0; j < height; j++) {
      //console.log(image_matrix[j][i])
      if(image_matrix[j][height*2 + i][3] === 0) continue
      const shape = {
        position: {
          x: image_matrix[j][i][0],
          y: image_matrix[j][i][1],
          z: image_matrix[j][i][2],
        },
        orientation: {
          x: image_matrix[j][height + i][0]/128 - 1,
          y: image_matrix[j][height + i][1]/128 - 1,
          z: image_matrix[j][height + i][2]/128 - 1,
          w: image_matrix[j][height + i][3]/128 - 1,
        },
        scale: {
          x: image_matrix[j][height*2 + i][0],
          y: image_matrix[j][height*2 + i][1],
          z: image_matrix[j][height*2 + i][2],
        },
      }
      if(shape.scale.x < 1 || shape.scale.y < 1 || shape.scale.z < 1) continue
      shapes.push(shape)
    }
  }
  return shapes
}


const shapes = imageProcess(watson_data)

fs.writeFile(`../../public/data/buildingShapes.json`, JSON.stringify(shapes, null, '  '), err => {
    if (err) console.error(err)
})

