import { readFile } from 'fs/promises';
import fs from 'fs'
import _ from 'lodash'
import maplibregl from 'maplibre-gl'

import cooked_journal from '../raw/cooked_journal.journal.json' assert { type: "json" };
import murmurHash3 from 'murmurhash3js'

console.log(murmurHash3.x86.hash32("ep1/points_of_interest/tarot_collectibles/mq033_ep1_king_of_the_cups", 0X5EEDBA5E))

/* let journalhashes = {}
cooked_journal.Data.RootChunk.entry.Data.entries[6].Data.entries.forEach((entry) => {
  const poitype = entry.Data.id
  console.log()
  entry.Data.entries.forEach(subentry => {
    const poi_id = subentry.Data.id
    console.log(poi_id, subentry.Data.mappinData.typedVariant.Data.variant)
    journalhashes[murmurHash3.x86.hash32(`points_of_interest/${poitype}/${poi_id}`, 0X5EEDBA5E)] = {
      type: subentry.Data.mappinData.typedVariant.Data.variant,
      id: poi_id
    }
  })
})



fs.writeFile(`../raw/journalhashes.json`, JSON.stringify(journalhashes, null, '  '), err => {
  if (err) console.error(err)
})
 */
