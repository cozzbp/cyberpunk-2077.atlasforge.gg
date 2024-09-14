import { readFile } from 'fs/promises';
import fs from 'fs'
import _ from 'lodash'

import { glob, globSync, globStream, globStreamSync, Glob } from 'glob'

const StreamingSectors = await glob('Z:/Cyberpunk/Mods/locations/source/raw/base/worlds/03_night_city/_compiled/default/**.streamingsector.json', { ignore: 'node_modules/**' })

import fast_travel_ids from '../raw/fasttravelids.json' assert { type: "json" };
import fast_travel_names from '../raw/fast_travel_names.json' assert { type: "json" }
import base_onscreens from '../raw/onscreens.json.json' assert { type: "json" };
import ep1_onscreens from '../raw/ep1_onscreens.json.json' assert { type: "json" };


let fastTravelPoints = {}
StreamingSectors.forEach(sector => {
  const data = fs.readFileSync(sector, 'utf8')
  if(!data) return
  const json = JSON.parse(data)
  json?.Data?.RootChunk?.nodeData?.Data.forEach(datum => {
    fast_travel_ids.forEach(id => {
      if (datum?.QuestPrefabRefHash?.$value.length > 1 && datum?.QuestPrefabRefHash?.$value.includes(id)) {

        fastTravelPoints[id] = {
          Name: _.find(base_onscreens.Data.RootChunk.root.Data.entries, { primaryKey: fast_travel_names[id].toString() })?.femaleVariant || _.find(ep1_onscreens.Data.RootChunk.root.Data.entries, { primaryKey: fast_travel_names[id].toString()  })?.femaleVariant,
          Position: datum?.Position
        }
        console.log(fast_travel_names[id], _.find(base_onscreens.Data.RootChunk.root.Data.entries, { primaryKey: fast_travel_names[id].toString() })?.femaleVariant || _.find(ep1_onscreens.Data.RootChunk.root.Data.entries, { primaryKey: fast_travel_names[id].toString()  })?.femaleVariant,)
      }
    })

  })


})
console.log('finished!')
fs.writeFile(`../raw/fast_travel_info.json`, JSON.stringify(fastTravelPoints, null, '  '), err => {
  if (err) console.error(err)
})


/* console.log(StreamingSectors)
fast_travel_ids.forEach((id) => {
  //console.log(id)
  fs.readdirSync(streaming_sector_directory).forEach((file) => {
    //console.log(file)
    
  })
}) */

