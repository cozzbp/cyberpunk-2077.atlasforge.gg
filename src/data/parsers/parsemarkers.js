import { readFile } from 'fs/promises';
import fs from 'fs'
import _ from 'lodash'
import maplibregl from 'maplibre-gl'

import poi from '../raw/03_night_city.poimappins.json' assert { type: "json" };
import mappins from '../raw/03_night_city.mappins.json' assert { type: "json" };
import hashpool from '../raw/pool2.json' assert { type: "json" };
import districts from '../districts.json' assert { type: "json" };
import subdistricts from '../subdistricts.json' assert { type: "json" };
import cooked_journal from '../raw/cooked_journal.journal.json' assert { type: "json" };
import ep1_cooked_journal from '../raw/ep1_cooked_journal.journal.json' assert { type: "json" };
import base_onscreens from '../raw/onscreens.json.json' assert { type: "json" };
import ep1_onscreens from '../raw/ep1_onscreens.json.json' assert { type: "json" };
import gems from '../raw/hidden_gems.json' assert { type: "json" };
import relics from '../raw/relics.json' assert { type: "json" };
import fast_travel_info from '../raw/fast_travel_info.json' assert { type: "json" };
import murmurHash3 from 'murmurhash3js'
import { flatten } from 'flat'

//console.log(murmurHash3.x86.hash32("points_of_interest/service_points/wat_lch_clothingshop_01", 0X5EEDBA5E))

let journalhashes = {}

cooked_journal.Data.RootChunk.entry.Data.entries.forEach((topEntry) => {
  const topEntryType = topEntry.Data.id
  topEntry.Data.entries.forEach((entry) => {
    const poitype = entry.Data.id
    //console.log()
    entry.Data.entries.forEach(subentry => {
      const poi_id = subentry.Data.id
      //console.log(`${topEntryType}/${poitype}/${poi_id}`, murmurHash3.x86.hash32(`${topEntryType}/${poitype}/${poi_id}`, 0X5EEDBA5E))
      journalhashes[murmurHash3.x86.hash32(`${topEntryType}/${poitype}/${poi_id}`, 0X5EEDBA5E)] = {
        type: subentry?.Data?.mappinData?.typedVariant?.Data?.variant,
        id: poi_id
      }
    })
  })
})

let ep1_journalhashes = {}
ep1_cooked_journal.Data.RootChunk.entry.Data.entries.forEach((topEntry) => {
  const topEntryType = topEntry.Data.id
  topEntry.Data.entries.forEach((entry) => {
    const poitype = entry.Data.id
    //console.log()
    entry.Data.entries.forEach(subentry => {
      const poi_id = subentry.Data.id
      //console.log(`${topEntryType}/${poitype}/${poi_id}`, murmurHash3.x86.hash32(`${topEntryType}/${poitype}/${poi_id}`, 0X5EEDBA5E))
      ep1_journalhashes[murmurHash3.x86.hash32(`ep1/${topEntryType}/${poitype}/${poi_id}`, 0X5EEDBA5E)] = {
        type: subentry?.Data?.mappinData?.typedVariant?.Data?.variant,
        id: poi_id
      }
    })
  })
})

const flat = { ...flatten(cooked_journal), ...flatten(ep1_cooked_journal) }

fs.writeFile(`../raw/flat_journal.json`, JSON.stringify(flat, null, '  '), err => {
  if (err) console.error(err)
})


function getKeyByValue(object, value) {
  return Object.keys(object).filter(key => object[key] === value);
}

let questData = {}
const questDescriptions = getKeyByValue(flat, 'gameJournalQuestDescription')
questDescriptions.forEach(questDesc => {
  const id = flat[questDesc.replace(/\.entries\.\d+\.Data\.\$type/, '') + '.id']
  const titleKey = flat[questDesc.replace(/\.entries\.\d+\.Data\.\$type/, '') + '.title.value']
  const descKey = flat[`${questDesc.replace('.$type', '')}.description.value`]
  let title
  let desc
  if (titleKey) {
    title = _.find(base_onscreens.Data.RootChunk.root.Data.entries, { primaryKey: titleKey.replace(/LocKey\#/, '') })?.femaleVariant ||
      _.find(ep1_onscreens.Data.RootChunk.root.Data.entries, { primaryKey: titleKey.replace(/LocKey\#/, '') })?.femaleVariant
  }
  if (descKey) {
    desc = _.find(base_onscreens.Data.RootChunk.root.Data.entries, { primaryKey: descKey.replace(/LocKey\#/, '') })?.femaleVariant ||
      _.find(ep1_onscreens.Data.RootChunk.root.Data.entries, { primaryKey: descKey.replace(/LocKey\#/, '') })?.femaleVariant

    desc = desc?.replaceAll(`\\n`, '\n')
  }

  questData[id] = {
    title: title,
    desc: desc,
  }
})

const tarotDescriptions = getKeyByValue(flat, 'gameJournalTarot')
tarotDescriptions.forEach(tarotDesc => {
  const id = flat[tarotDesc.replace('.$type', '.id')]
  const titleKey = flat[tarotDesc.replace('.$type', '.name.value')]
  const descKey = flat[tarotDesc.replace('.$type', '.description.value')]

  let title
  let desc
  if (titleKey) {
    title = _.find(base_onscreens.Data.RootChunk.root.Data.entries, { primaryKey: titleKey.replace(/LocKey\#/, '') })?.femaleVariant ||
      _.find(ep1_onscreens.Data.RootChunk.root.Data.entries, { primaryKey: titleKey.replace(/LocKey\#/, '') })?.femaleVariant
  }
  if (descKey) {
    desc = _.find(base_onscreens.Data.RootChunk.root.Data.entries, { primaryKey: descKey.replace(/LocKey\#/, '') })?.femaleVariant ||
      _.find(ep1_onscreens.Data.RootChunk.root.Data.entries, { primaryKey: descKey.replace(/LocKey\#/, '') })?.femaleVariant


    desc = desc?.replaceAll(`\\n`, '\n')
  }

  questData[id] = {
    title: title,
    desc: desc,
  }
})

let codexData = {}
const codexEntries = getKeyByValue(flat, 'gameJournalCodexEntry')
codexEntries.forEach(codex => {
  const id = flat[codex.replace('.$type', '.id')]
  const titleKey = flat[codex.replace('.$type', '.title.value')]
  const descKey = flat[codex.replace('.$type', '.entries.0.Data.textContent.value')]

  let title
  let desc
  if (titleKey) {
    title = _.find(base_onscreens.Data.RootChunk.root.Data.entries, { primaryKey: titleKey.replace(/LocKey\#/, '') })?.femaleVariant ||
      _.find(ep1_onscreens.Data.RootChunk.root.Data.entries, { primaryKey: titleKey.replace(/LocKey\#/, '') })?.femaleVariant
  }
  if (descKey) {
    desc = _.find(base_onscreens.Data.RootChunk.root.Data.entries, { primaryKey: descKey.replace(/LocKey\#/, '') })?.femaleVariant ||
      _.find(ep1_onscreens.Data.RootChunk.root.Data.entries, { primaryKey: descKey.replace(/LocKey\#/, '') })?.femaleVariant

    desc = desc?.replaceAll(`\\n`, '\n')
  }
  codexData[id] = {
    title: title,
    desc: desc,
  }
})
//console.log(codexData)

const dynEntites = getKeyByValue(flat, 'gameJournalPointOfInterestMappin')
let dynData = {}
dynEntites.forEach(dyn => {
  const id = flat[dyn.replace('.$type', '.id')]
  const codexKey = flat[dyn.replace('.$type', '.dynamicEntityRef.slotName.$value')]
  //console.log('id', id, codexKey)
  dynData[id] = codexKey
})
//console.log(dynEntites)

//console.log(questData)

//.description.value







let mapmarkers = {}

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

const modelOrigin = [0, 0];
const modelAltitude = 0;

const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
  modelOrigin,
  modelAltitude
);

modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()

poi.Data.RootChunk.cookedData.forEach((element) => {
  //let name = hashpool[element.entityID?.hash || element.entityID?.journalPathHash]
  let type = 'Unknown'
  let journalMappinData = journalhashes[element.journalPathHash]
  if (!journalMappinData) {
    //console.log('missing for!', element)
    journalMappinData = ep1_journalhashes[element.journalPathHash]
    // console.log('ep1!', journalMappinData)
  }
  type = journalMappinData?.type?.replace(/Variant/g, '')?.replace(/Zzz\d+_/, '')
  if (type === 'Default' || type === 'QuestionMark') return
  let id = journalMappinData?.id ?? element.journalPathHash

  //console.log(type)


  let coords = new maplibregl.MercatorCoordinate(0.5 + modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * element.position.X, 0.5 - modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * element.position.Y, 0);

  let district
  _.forEach(districts, (d) => {
    //console.log('inside?', )
    if (inside([coords.toLngLat().lng, coords.toLngLat().lat], d.geometry)) {
      district = d.name
    }
  })
  let subdistrict
  _.forEach(subdistricts, (d) => {
    //console.log('inside?', )
    if (inside([coords.toLngLat().lng, coords.toLngLat().lat], d.geometry)) {
      subdistrict = d.name
    }
  })


  const codexEntry = codexData[dynData[id]]

  if (!district) district = 'Badlands'

  if (!mapmarkers[type]) mapmarkers[type] = []
  mapmarkers[type].push({
    id: id,
    type: type,
    district: district,
    subdistrict: subdistrict,
    position: {
      x: element?.position?.X ?? element?.positions?.[0]?.X,
      y: element?.position?.Y ?? element?.positions?.[0]?.Y,
      z: element?.position?.Z ?? element?.positions?.[0]?.Z,
    },
    title: codexEntry?.title || questData[id]?.title,
    description: codexEntry?.desc || questData[id]?.desc
  })
})


//HIDDEN GEMS
mapmarkers['HiddenGem'] = []
gems.forEach((fullgem, index) => {
  const coord = maplibregl.MercatorCoordinate.fromLngLat({ lng: fullgem.longitude, lat: fullgem.latitude }, 0);
  const scale = 0.07770
  const newX = 0.5 + (coord.x - 0.498124994) * scale
  const newY = 0.5 + (coord.y - 0.4975225) * scale

  const gem = [(newX - 0.5)/(modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()), -(newY - 0.5)/(modelAsMercatorCoordinate.meterInMercatorCoordinateUnits())]

  let coords = new maplibregl.MercatorCoordinate(0.5 + modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * gem[0], 0.5 - modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * gem[1], 0);

  let district
  _.forEach(districts, (d) => {
    //console.log('inside?', )
    if (inside([coords.toLngLat().lng, coords.toLngLat().lat], d.geometry)) {
      district = d.name
    }
  })
  let subdistrict
  _.forEach(subdistricts, (d) => {
    //console.log('inside?', )
    if (inside([coords.toLngLat().lng, coords.toLngLat().lat], d.geometry)) {
      subdistrict = d.name
    }
  })

  mapmarkers['HiddenGem'].push({
    id: 'hidden_gem_' + index,
    type: 'HiddenGem',
    district: district,
    subdistrict: subdistrict,
    position: {
      x: gem[0],
      y: gem[1],
      z: 0,
    }
  })
})

//Relics
mapmarkers['RelicTerminal'] = []
relics.forEach((relic, index) => {

  let coords = new maplibregl.MercatorCoordinate(0.5 + modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * relic.x, 0.5 - modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * relic.y, 0);

  let district
  _.forEach(districts, (d) => {
    //console.log('inside?', )
    if (inside([coords.toLngLat().lng, -coords.toLngLat().lat], d.geometry)) {
      district = d.name
    }
  })
  let subdistrict
  _.forEach(subdistricts, (d) => {
    //console.log('inside?', )
    if (inside([coords.toLngLat().lng, -coords.toLngLat().lat], d.geometry)) {
      subdistrict = d.name
    }
  })

  if (!district) district = 'Badlands'

  mapmarkers['RelicTerminal'].push({
    id: 'relic_terminal' + index,
    type: 'RelicTerminal',
    district: district,
    subdistrict: subdistrict,
    position: {
      x: relic.x,
      y: -relic.y,
      z: relic.z,
    }
  })
})

mapmarkers['FastTravel'] = []
_.forEach(fast_travel_info, (info, id) => {
  let coords = new maplibregl.MercatorCoordinate(0.5 + modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * info.Position.X, 0.5 - modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * info.Position.Y, 0);

  let district
  _.forEach(districts, (d) => {
    //console.log('inside?', )
    if (inside([coords.toLngLat().lng, -coords.toLngLat().lat], d.geometry)) {
      district = d.name
    }
  })
  let subdistrict
  _.forEach(subdistricts, (d) => {
    //console.log('inside?', )
    if (inside([coords.toLngLat().lng, -coords.toLngLat().lat], d.geometry)) {
      subdistrict = d.name
    }
  })

  if (!district) district = 'Badlands'

  mapmarkers['FastTravel'].push({
    id: id,
    type: 'FastTravel',
    title: info.Name,
    district: district,
    subdistrict: subdistrict,
    position: {
      x: info.Position.X,
      y: info.Position.Y,
      z: info.Position.Z,
    }
  })
})


fs.writeFile(`../../src/app/cyberpunk-2077/data/mapmarkers.json`, JSON.stringify(mapmarkers, null, '  '), err => {
  if (err) console.error(err)
})

