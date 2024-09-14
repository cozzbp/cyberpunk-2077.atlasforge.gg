'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter, usePathname } from 'next/navigation'
import ReactDOM from 'react-dom/client'
import Head from 'next/head'
import styles from './map.module.css'
import glitch from '@/styles/glitch.module.css'
import toast from 'react-hot-toast';
import * as _ from 'lodash'
import murmurHash3 from 'murmurhash3js'

import { Clipboard } from '@capacitor/clipboard'
import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'

import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

import * as THREE from 'three'
import { TGALoader } from 'three/addons/loaders/TGALoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

import markers from '@/data/mapmarkers.json'
import districts from '@/data/districts.json'
import subdistricts from '@/data/subdistricts.json'
import PopupLabel from '@/components/PopupLabel'
import Popup from '@/components/Popup'

import { ASSET_PREFIX } from '@/asset_prefix'
import { BiSearchAlt2 } from "react-icons/bi"
import Arrow from '@/components/icons/Arrow'
import TextInput from '@/components/TextInput'

import { MAP_ICONS, MAP_LABELS } from '@/data/mapdefinitions'
import QuestDisplay from '@/components/QuestDisplay'
import MapboxDraw from '@mapbox/mapbox-gl-draw'

let hoveredDistrictId
let hoveredSubdistrictId
let hoveredMarkers = []

let mapmarkers = {}
Object.keys(markers).forEach(type => {
  mapmarkers[type] = []
  markers[type].forEach((marker, index) => {
    mapmarkers[type].push({ ...marker, label: MAP_LABELS[type] })
  })
})
let Draw
const filterProperties = ['label', 'type', 'latitude', 'longitude', 'description', 'reward', 'district', 'subdistrict', 'name', 'title', 'description']
let foundMarkers = {}
export default function Map() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const allDistricts = Object.keys(districts).map(district => district)
  let allTypes = Object.keys(mapmarkers).map(type => type)
  //allTypes = allTypes.filter(item => item != 'invalid')
  const [visibleTypes, setVisibleTypes] = useState(allTypes.filter(item => item != 'Unknown'))
  const [visibleDistricts, setVisibleDistricts] = useState(allDistricts)

  const isIframe = typeof window !== 'undefined' && window.self !== window.top
  const isLargeScreen = typeof window !== 'undefined' && window.innerWidth > 768



  const [filterBarOpen, setFilterBarOpen] = useState(false)

  useEffect(() => {
    setFilterBarOpen(!isIframe && isLargeScreen)
  }, [isIframe, isLargeScreen])
  //const [filterBarOpen, setFilterBarOpen] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')


  const startDraw = (e) => {
    Draw.changeMode('draw_polygon')
  }
  const deleteShape = (e) => {
    Draw.trash()
  }
  const showAllLayers = (e) => {
    map.current.setLayoutProperty('3d-model', 'visibility', 'visible');
  }

  const hideAllLayers = (e) => {
    map.current.setLayoutProperty('3d-model', 'visibility', 'none');
  }

  const onSearchChanged = (e) => {
    setSearchTerm(_.escapeRegExp(e?.target?.value))
  }

  const showAllMarkers = () => {
    setFilters(allTypes)
  }

  const hideAllMarkers = () => {
    setFilters([])
  }

  const setFilters = (newFilters) => {
    setVisibleTypes(newFilters)
    try {
      map.current.setFilter('mapmarkers', ['all', ['in', ['get', 'type'], ['literal', newFilters]], ['in', ['get', 'district'], ['literal', visibleDistricts]]])
    } catch (err) { }

    Preferences.set({
      key: `mapfilters-cyberpunk-2077`,
      value: JSON.stringify(newFilters),
    })
  }
  const toggleType = (type) => {
    if (_.includes(visibleTypes, type)) {
      const newTypes = _.without(visibleTypes, type)
      setFilters(newTypes)
    } else {
      const newTypes = _.concat(visibleTypes, type)
      setFilters(newTypes)
    }

  }

  const createMarkerPopup = (marker) => {
    const lngLat = getMarkerLngLat(marker)
    document.querySelectorAll('.maplibregl-popup').forEach(e => e.remove());

    popupClick?.remove()
    popupClick = new maplibregl.Popup({ offset: 25, closeButton: false, focusAfterOpen: window === window.parent })
    const popupNode = document.createElement("div")
    ReactDOM.createRoot(popupNode).render(
      <Popup marker={marker} onSaveMarker={(marker) => { popupClick?.remove(); onSaveMarker(marker) }} onSetFound={(newSetFound) => onSetFound(marker, newSetFound)} found={foundMarkers?.[marker?.id] === true} onCancel={() => { popupClick?.remove() }} edit={false} types={Object.keys(mapmarkers)} />,
    )
    popupClick.setLngLat(lngLat).setDOMContent(popupNode).addTo(map.current)
  }

  const focusType = (type) => {
    setFilters([type])
  }

  const showAllDistricts = () => {
    setDistricts(allDistricts)
  }

  const hideAllDistricts = () => {
    setDistricts([])
  }

  const setDistricts = (newDistricts) => {
    setVisibleDistricts(newDistricts)
    try {
      map.current.setFilter('mapmarkers', ['all', ['in', ['get', 'district'], ['literal', newDistricts]], ['in', ['get', 'type'], ['literal', visibleTypes]]])
    } catch (err) { }

    Preferences.set({
      key: `mapdistricts-cyberpunk-2077`,
      value: JSON.stringify(newDistricts),
    })
  }

  const toggleDistrict = (district) => {
    if (_.includes(visibleDistricts, district)) {
      const newDistricts = _.without(visibleDistricts, district)
      setDistricts(newDistricts)
    } else {
      const newDistricts = _.concat(visibleDistricts, district)
      setDistricts(newDistricts)
    }
  }

  const focusDistrict = (district) => {
    setDistricts([district])
  }

  const onSaveMarker = (marker) => {
    console.log(marker)
    const blob = new Blob([JSON.stringify(marker, null, '  ')], { type: "text/json" });
    const link = document.createElement("a");

    link.download = `${marker?.name || 'marker'}.json`;
    link.href = window.URL.createObjectURL(blob);
    link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

    const evt = new MouseEvent("click", {
      view: window,
      bubbles: true,
      cancelable: true,
    });

    link.dispatchEvent(evt);
    link.remove()
  }

  const loadCubesDistrict = async (scene, WorldPosTex, CubeSize, PointCloudTextureHeight, Offset, TransMin, TransMax, ScaleFactor, allowScale1 = false, allowScale0 = false) => {
    const dummy = new THREE.Object3D()
    const geometry = new THREE.BoxGeometry(CubeSize, CubeSize, CubeSize)



    const material = new THREE.MeshLambertMaterial({ color: 0xba1c1f, opacity: 0.95, transparent: true })

    const response = await fetch(WorldPosTex);
    const blob = await response.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = new Uint16Array(arrayBuffer)
    const width = buffer[8]
    const height = buffer[6]

    let buildings = []
    let row = 0
    let col = 0
    for (let i = 74; i < buffer.length; i += 4) {
      col++
      if (col >= width) {
        col = 0
        row++
      }
      if (col > height) continue
      if (col === 0) continue

      const position = {
        x: buffer[i] / 65536,
        y: buffer[i + 1] / 65536,
        z: buffer[i + 2] / 65536,
        w: buffer[i + 3] / 65536,
      }

      const orientation = {
        x: buffer[i + height * 1 * 4] / 65536 * 2 - 1,
        y: buffer[i + 1 + height * 1 * 4] / 65536 * 2 - 1,
        z: buffer[i + 2 + height * 1 * 4] / 65536 * 2 - 1,
        w: buffer[i + 3 + height * 1 * 4] / 65536 * 2 - 1,
      }

      const scale = {
        x: buffer[i + height * 2 * 4] / 65536,
        y: buffer[i + 1 + height * 2 * 4] / 65536,
        z: buffer[i + 2 + height * 2 * 4] / 65536,
        w: buffer[i + 3 + height * 2 * 4] / 65536,
      }

      buildings.push({ position, orientation, scale })
    }
    const mesh = new THREE.InstancedMesh(geometry, material, buildings.length)

    const DeltaTrans = new THREE.Vector4(TransMax.x - TransMin.x, TransMax.y - TransMin.y, TransMax.z - TransMin.z, TransMax.w - TransMin.w)
    const xRatio = DeltaTrans.x / DeltaTrans.z
    const yRatio = DeltaTrans.y / DeltaTrans.z
    const zFactor = ScaleFactor
    const yFactor = zFactor * yRatio
    const xFactor = zFactor * xRatio

    mesh.position.set(Offset.x + TransMin.x, TransMin.z, -Offset.y + -TransMin.y)
    scene.add(mesh)

    for (let i = 0; i < buildings.length; i++) {
      dummy.position.set(buildings[i].position.x * (TransMax.x - TransMin.x), buildings[i].position.z * (TransMax.z - TransMin.z), -buildings[i].position.y * (TransMax.y - TransMin.y))
      dummy.setRotationFromQuaternion(new THREE.Quaternion(buildings[i].orientation.x, buildings[i].orientation.z, -buildings[i].orientation.y, buildings[i].orientation.w))
      dummy.scale.set(buildings[i].scale.x * ScaleFactor, buildings[i].scale.z * ScaleFactor, buildings[i].scale.y * ScaleFactor)
      dummy.updateMatrix()

      mesh.setMatrixAt(i, dummy.matrix)
    }
  }

  const modelOrigin = [0, 0];
  const modelAltitude = 0;
  const modelRotate = [Math.PI / 2, 0, 0];

  const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
    modelOrigin,
    modelAltitude
  );
  modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()

  var popupLabel = new maplibregl.Popup({ offset: 25, closeButton: false })
  var popupClick = new maplibregl.Popup({ offset: 25, closeButton: false })

  const getMarkerLngLat = (marker) => {

    let coords = new maplibregl.MercatorCoordinate(0.5 + modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * marker.position.x, 0.5 - modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * marker.position.y, 0);
    return coords.toLngLat()
  }

  const getTransformedDistrict = (district) => {
    if (!district.position) return district
    let distCoords = new maplibregl.MercatorCoordinate(0.5 + modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * district.position.x, 0.5 - modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * district.position.y, 0);

    const geometry = district.geometry.map((geo) => {
      let transGeo = [geo[0] + district.position.x, geo[1] + district.position.y]
      let coords = new maplibregl.MercatorCoordinate(0.5 + modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * transGeo[0], 0.5 - modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * transGeo[1], 0);
      return [coords.toLngLat().lng, coords.toLngLat().lat]
    })
    return {
      ...district,
      geometry: geometry,
      latitude: distCoords.toLngLat().lat,
      longitude: distCoords.toLngLat().lng,
    }
  }

  const onSetFound = async (marker, newFound) => {
    let newFoundMarkers
    if (newFound) {
      newFoundMarkers = { [marker?.id]: true, ...foundMarkers }
      await Preferences.set({
        key: `cyberpunk-markers;${marker.id}`,
        value: 'true',
      })

    } else {
      newFoundMarkers = _.without(foundMarkers, marker?.id)
      await Preferences.remove({ key: `cyberpunk-markers;${marker.id}` })
    }
    
    foundMarkers = newFoundMarkers

    console.log('foundmarkers', foundMarkers, searchTerm)
    map.current.setFeatureState(
      { source: 'mapmarkers', id: murmurHash3.x86.hash32(marker?.id, 0X5EEDBA5E) },
      { found: newFound }
    )
  }

  useEffect(() => {
    if (map.current) return

    let popupLabels = {}
    let popups = {}
    let zoom = 13
    let center = [0, 0]
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    if (lat && lng) {
      center = [lng, lat]
      zoom = 16
    }
    let lngLat
    const markerParam = searchParams.get('marker')
    let markerParamObj
    if (markerParam) {
      Object.keys(mapmarkers).forEach(type => {
        mapmarkers[type].forEach((marker, index) => {
          if (marker?.id === markerParam) {
            zoom = 16
            lngLat = getMarkerLngLat(marker)
            center = lngLat
            markerParamObj = marker
          }
        })
      })
    }
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        'version': 8,
        glyphs: `${ASSET_PREFIX}/fonts/pbf/{fontstack}/{range}.pbf`,
        sources: {
          'raster-tiles': {
            'type': 'raster',
            'tiles': [
              '/images/map/{z}/{x}/{y}.jpg'
            ],
            'tileSize': 256,
          }
        },
        layers: [

        ]
      },
      zoom: zoom,
      //maxZoom: 22,
      //minZoom: 12,
      //maxZoom: 800,
      center: center,
      pitch: 0,
      //maxBounds: [[-179, -89], [179, 89]],
      antialias: true, // create the gl context with MSAA antialiasing, so custom layers are antialiased
      renderWorldCopies: false,
    })

    if (markerParamObj) {
      createMarkerPopup(markerParamObj)
    }





    map.current.on('load', () => {

      //SUBDISTRICTS
      let sourceSubdistrictGeo = {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      }
      let sourceSubdistrictLabel = {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      }

      Object.keys(subdistricts).forEach((subdistrictname, index) => {
        const subdistrict = getTransformedDistrict(subdistricts[subdistrictname])
        //console.log('getTransformedDistrict', subdistrict)

        sourceSubdistrictGeo.data.features.push({
          type: 'Feature',
          properties: {
            name: subdistrictname,
            color: subdistrict?.color ?? '#33C9EB',
            geometry: subdistrict.geometry
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              subdistrict.geometry
            ]
          },
          id: index + 1
        })
        sourceSubdistrictLabel.data.features.push({
          type: 'Feature',
          properties: {
            name: subdistrict.name
          },
          geometry: {
            type: 'Point',
            coordinates: [subdistrict.longitude, subdistrict.latitude]
          },
          id: index + 1
        })
      })
      map.current.addSource('subdistricts', sourceSubdistrictGeo);
      map.current.addSource('subdistrict-labels', sourceSubdistrictLabel);
      map.current.addLayer({
        id: 'subdistricts-fills',
        type: 'fill',
        source: 'subdistricts',
        layout: {},
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.1,
            0
          ]
        },
        minzoom: 14,
      });
      map.current.addLayer({
        id: 'subdistricts-lines',
        type: 'line',
        source: 'subdistricts',
        layout: {},
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 3,
          'line-opacity': 0.7

        },
        minzoom: 14,
      });

      map.current.addLayer({
        id: 'subdistrict-labels',
        type: 'symbol',
        source: 'subdistrict-labels',
        layout: {
          'text-field': ['get', 'name'],
          "text-font": [
            "Play-Bold"
          ],
          'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
          'text-radial-offset': 2.0,
          'text-transform': 'uppercase',
          'text-justify': 'auto',
          'icon-image': ['concat', ['get', 'icon'], '_15'],
          "text-size": 16
        },
        paint: {
          'text-color': '#58e8f0',
          'text-opacity': 0.7,
          "text-halo-width": .5,
          "text-halo-color": "#000000",
          "text-halo-blur": .5
        },
        minzoom: 14,
      });

      map.current.on('mousemove', 'subdistricts-fills', function (e) {
        e.features.forEach((feature) => {
          if (hoveredSubdistrictId) {
            map.current.setFeatureState(
              { source: 'subdistricts', id: hoveredSubdistrictId },
              { hover: false }
            );
          }
          hoveredSubdistrictId = feature.id
          map.current.setFeatureState(
            { source: 'subdistricts', id: hoveredSubdistrictId },
            { hover: true }
          );
        })

      });

      map.current.on('mouseleave', 'subdistricts-fills', function () {
        if (hoveredSubdistrictId) {
          map.current.setFeatureState(
            { source: 'subdistricts', id: hoveredSubdistrictId },
            { hover: false }
          );
        }
        hoveredSubdistrictId = null
      });


      //DISTRICTS
      Promise.all(
        Object.keys(districts).map(district => new Promise((resolve, reject) => {

          map.current.loadImage(`${ASSET_PREFIX}/images/districticons/${district.replace(/\s/g, '')}.webp`, function (error, res) {
            //console.log('image res', res)
            map.current.addImage(district, res)
            resolve();
          })
        }))
      ).then(() => {
        let sourceDistrictGeo = {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        }
        let sourceDistrictLabel = {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        }

        Object.keys(districts).forEach((districtname, index) => {
          const district = getTransformedDistrict(districts[districtname])
          //console.log('getTransformedDistrict', district)

          sourceDistrictGeo.data.features.push({
            type: 'Feature',
            properties: {
              name: districtname,
              color: district?.color ?? '#33C9EB'
            },
            geometry: {
              type: 'Polygon',
              coordinates: [
                district.geometry
              ]
            },
            id: index + 1
          })
          sourceDistrictLabel.data.features.push({
            type: 'Feature',
            properties: {
              name: district.name,
              icon: district.name
            },
            geometry: {
              type: 'Point',
              coordinates: [district.longitude, district.latitude]
            },
            id: index + 1
          })
        })
        map.current.addSource('districts', sourceDistrictGeo);
        map.current.addSource('district-labels', sourceDistrictLabel);
        map.current.addLayer({
          id: 'districts-fills',
          type: 'fill',
          source: 'districts',
          layout: {},
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              0.1,
              0
            ]
          },
          maxzoom: 14,
        });
        map.current.addLayer({
          id: 'districts-lines',
          type: 'line',
          source: 'districts',
          layout: {},
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 4,
            'line-opacity': 0.7

          },
          maxzoom: 14,
        });
        map.current.addLayer({
          'id': 'districts-icons',
          'type': 'symbol',
          'source': 'district-labels',
          'layout': {
            'icon-image': ['get', 'icon'],
            'icon-size': 0.5,
            'icon-ignore-placement': true,
            'icon-allow-overlap': true,

          },
          paint: {
            'icon-opacity': 0.5,
          },
          maxzoom: 14,
        });
        map.current.addLayer({
          id: 'district-labels',
          type: 'symbol',
          source: 'district-labels',
          layout: {
            'text-field': ['get', 'name'],
            "text-font": [
              "Play-Bold"
            ],
            'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
            'text-radial-offset': 2.0,
            'text-transform': 'uppercase',
            'text-justify': 'auto',
            'icon-image': ['concat', ['get', 'icon'], '_15'],
            "text-size": 20
          },
          paint: {
            'text-color': '#58e8f0',
            'text-opacity': 0.7,
            "text-halo-width": .5,
            "text-halo-color": "#000000",
            "text-halo-blur": .5
          },
          minzoom: 0,
          maxzoom: 14,
        });
      })

      map.current.on('mousemove', 'districts-fills', function (e) {
        e.features.forEach((feature) => {
          if (hoveredDistrictId) {
            map.current.setFeatureState(
              { source: 'districts', id: hoveredDistrictId },
              { hover: false }
            );
          }
          hoveredDistrictId = feature.id
          map.current.setFeatureState(
            { source: 'districts', id: hoveredDistrictId },
            { hover: true }
          );
        })

      });

      map.current.on('mouseleave', 'districts-fills', function () {
        if (hoveredDistrictId) {
          map.current.setFeatureState(
            { source: 'districts', id: hoveredDistrictId },
            { hover: false }
          );
        }
        hoveredDistrictId = null
      });


      //MAP PINS
      let source = {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        tolerance: 0,
        clusterRadius: 0
      }
      Promise.all(
        Object.keys(mapmarkers).map(type => new Promise((resolve, reject) => {

          map.current.loadImage(`${ASSET_PREFIX}/images/minimapicons/${MAP_ICONS[type] ?? 'invalid'}.webp`, function (error, res) {
            map.current.addImage(type, res)
            resolve();
          })
        }))
      ).then(async () => {
        const legacyMarkerStorage = await Preferences.get({ key: 'cyberpunk-markers' })
        const legacyCurrentFoundMarkers = await JSON.parse(legacyMarkerStorage?.value)
        let foundMarkers = {}
        for(const legacyFoundMarker in legacyCurrentFoundMarkers) {
          await Preferences.set({
            key: `cyberpunk-markers;${legacyFoundMarker}`,
            value: 'true',
          })
        }
        await Preferences.remove({ key: 'cyberpunk-markers' })
        //foundMarkers = currentFoundMarkers

        Object.keys(mapmarkers).forEach(type => {
          mapmarkers[type].forEach((marker, index) => {

            const lngLat = getMarkerLngLat(marker)
            const key = marker.id
            const filtertext = JSON.stringify(_.pick(marker, filterProperties)).toLowerCase()
            //console.log('id', marker.id)
            source.data.features.push({
              type: 'Feature',
              properties: {
                name: marker.name,
                icon: 'none',
                type: type,
                key: `${type}:${index}`,
                index: index,
                district: marker.district ?? 'Badlands',
                subdistrict: marker.subdistrict,
                filtertext: filtertext,
              },
              geometry: {
                type: 'Point',
                coordinates: [lngLat.lng, lngLat.lat]
              },
              id: murmurHash3.x86.hash32(marker.id, 0X5EEDBA5E)
            })
          })
        })

        map.current.addSource('mapmarkers', source)


        for(const type in mapmarkers) {
          for(const marker of mapmarkers[type]) {
            let foundValue = await Preferences.get({ key: `cyberpunk-markers;${marker.id}` })
            if(foundValue?.value) foundMarkers[marker?.id] = true
            //console.log('foundvalue!', marker.id, foundValue)
            map.current.setFeatureState(
              { source: 'mapmarkers', id: murmurHash3.x86.hash32(marker?.id, 0X5EEDBA5E) },
              { found: foundValue?.value === 'true' }
            )
          }
        }

        console.log('foundmarkers', foundMarkers)
        map.current.addLayer({
          'id': 'mapmarkers',
          'type': 'symbol',
          'source': 'mapmarkers',
          'layout': {
            'icon-image': ['get', 'type'],
            "icon-size": ['match', ['get', 'key'], 0, 0.65, 0.5],
            'icon-ignore-placement': true,
            'icon-allow-overlap': true,
          },
          paint: {
            //if hovered, opacity 1, else if found opacity 0.2, else if not found opacity 0.8
            'icon-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              ['case', ['boolean', ['feature-state', 'found'], false], 0.6, 1.0],
              ['case', ['boolean', ['feature-state', 'found'], false], 0.2, 0.8]
            ]
          },
          //minzoom: 13.8,
        });

        let tempVisibleTypes
        let tempVisibleDistricts
        const queryFilters = searchParams.get('filters')?.split(',')
        if (queryFilters) {
          setFilters(queryFilters)
          tempVisibleTypes = queryFilters
        } else {
          const getFilters = async () => {
            const foundValue = await Preferences.get({ key: 'mapfilters-cyberpunk-2077' })
            const value = JSON.parse(foundValue?.value)
            console.log('got filters!')
            setFilters(value || allTypes)
            tempVisibleTypes = value || allTypes
          }
          await getFilters()
          
        }

        const queryDistricts = searchParams.get('districts')?.split(',')
        if (queryDistricts) {
          setDistricts(queryDistricts)
          tempVisibleDistricts = queryDistricts
        } else {
          const getDistricts = async () => {
            const foundValue = await Preferences.get({ key: 'mapdistricts-cyberpunk-2077' })
            const value = JSON.parse(foundValue?.value)
            setDistricts(value || allDistricts)
            tempVisibleDistricts = value || allDistricts
          }
          await getDistricts()
        }

        console.log('mapmarkers!')
        map.current.setFilter('mapmarkers', [
          'all',
          ['in', ['get', 'district'], ['literal', tempVisibleDistricts]],
          ['in', ['get', 'type'], ['literal', tempVisibleTypes]]
        ])

        map.current.on('mousemove', function (e) {
          if (e?.originalEvent?.sourceCapabilities?.firesTouchEvents === true) return
          var features = map.current.queryRenderedFeatures(e.point, { layers: ['mapmarkers'] });

          hoveredMarkers.forEach((hoveredMarker) => {
            if (hoveredMarker === features?.[0]?.id) return

            map.current.setFeatureState({ source: 'mapmarkers', id: hoveredMarker }, { hover: false })
          })
          if (!features.length) {
            map.current.getCanvas().style.cursor = '';
            popupLabel?.remove()
            popupLabel.key = undefined
            map.current.setLayoutProperty('mapmarkers', 'icon-size', ['match', ['get', 'key'], 0, 0.65, 0.5]);

            return
          }



          // Change the cursor style as a UI indicator.
          map.current.getCanvas().style.cursor = 'pointer';

          var coordinates = features[0].geometry.coordinates.slice();
          var key = features[0].properties.key;
          var type = features[0].properties.type;
          var index = features[0].properties.index;
          var marker = mapmarkers[type][index]
          map.current.setLayoutProperty('mapmarkers', 'icon-size', ['match', ['get', 'key'], features[0].properties.key, 0.65, 0.5])
          map.current.setFeatureState({ source: 'mapmarkers', id: features[0].id }, { hover: true })
          hoveredMarkers.push(features[0].id)

          // Ensure that if the map is zoomed out such that multiple
          // copies of the feature are visible, the popup appears
          // over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }
          if (key !== popupLabel.key) {
            const popupLabelNode = document.createElement("div")
            ReactDOM.createRoot(popupLabelNode).render(
              <PopupLabel marker={marker} />,
            )
            popupLabel.setLngLat(coordinates).setDOMContent(popupLabelNode).addTo(map.current)
            popupLabel.key = key
          }
        });

        map.current.on('click', 'mapmarkers', function (e) {
          e?.preventDefault()
          var coordinates = e.features[0].geometry.coordinates.slice();
          var key = e.features[0].properties.key;
          var type = e.features[0].properties.type;
          var index = e.features[0].properties.index;
          var marker = mapmarkers[type][index]
          // Ensure that if the map is zoomed out such that multiple
          // copies of the feature are visible, the popup appears
          // over the copy being pointed to.
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }
          popupClick?.remove()
          popupLabel?.remove()
          popupClick = new maplibregl.Popup({ offset: 25, closeButton: false, focusAfterOpen: window === window.parent })
          const popupNode = document.createElement("div")
          ReactDOM.createRoot(popupNode).render(
            <Popup marker={marker} onSaveMarker={(marker) => { popupClick?.remove(); onSaveMarker(marker) }} onSetFound={(newSetFound) => onSetFound(marker, newSetFound)} found={foundMarkers?.[marker?.id] === true} onCancel={() => { popupClick?.remove() }} edit={false} types={Object.keys(mapmarkers)} />,
          )
          popupClick.setLngLat(coordinates).setDOMContent(popupNode).addTo(map.current)
        })


        map.current.on('contextmenu', async function (e) {
          const coord = maplibregl.MercatorCoordinate.fromLngLat(e.lngLat);

          Object.keys(subdistricts).forEach((subdistrictName) => {
            const subdistrict = getTransformedDistrict(subdistricts[subdistrictName])
            console.log(subdistrict)
            let geometry = subdistrict?.geometry
            let closestDist = Infinity
            let closestPoint
            geometry.forEach((geo) => {

              const dist = e.lngLat.distanceTo(new maplibregl.LngLat(geo[0], geo[1]))
              if (dist < closestDist) {
                closestDist = dist
                closestPoint = geo
              }
            })

            const merc = maplibregl.MercatorCoordinate.fromLngLat(new maplibregl.LngLat(closestPoint[0], closestPoint[1]))

            //let coords = new maplibregl.MercatorCoordinate(0.5 + modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * marker.position.x, 0.5 - modelAsMercatorCoordinate.meterInMercatorCoordinateUnits() * marker.position.y, 0);
            console.log(subdistrictName, 'closest point: ', (merc.x - 0.5) / modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(), (merc.y - 0.5) / modelAsMercatorCoordinate.meterInMercatorCoordinateUnits())
          })

          console.log('coord', [e.lngLat.lng, e.lngLat.lat])
          console.log('zoom', map.current.getZoom())

          popupClick?.remove()
          const popupNode = document.createElement("div")

          const merc = maplibregl.MercatorCoordinate.fromLngLat(e.lngLat)
          const marker = {
            position: {
              x: (merc.x - 0.5) / modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
              y: (merc.y - 0.5) / modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
              z: 0,
            }
          }
          ReactDOM.createRoot(popupNode).render(
            <Popup onSaveMarker={(marker) => { popupClick?.remove(); onSaveMarker(marker) }} onSetFound={(newSetFound) => onSetFound(marker, newSetFound)} found={foundMarkers?.[marker?.id] === true} onCancel={() => { popupClick?.remove() }} edit={true} marker={marker} types={Object.keys(mapmarkers)} />,
          )
          popupClick.setLngLat(e.lngLat).setDOMContent(popupNode).addTo(map.current)

          router.push(`${pathname}?lat=${e.lngLat.lat}&lng=${e.lngLat.lng}`, { shallow: true })
          //searchParams.set({ lat: e.lngLat.lat, lon: e.lngLat.lng })

          const Host = 'https://atlasforge.gg/cyberpunk/map'
          const value = `${Host}/map?lat=${e.lngLat.lat}&lon=${e.lngLat.lng}`
          if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
            await Share.share({
              title: 'cyberpunkmap.app Map Link',
              text: 'Check out this Cyberpunk 2077 Map Location',
              url: value,
              diaglogTitle: 'Share Cyberpunk 2077 Map Location',
            })
          } else {
            await Clipboard.write({
              string: value
            });
            toast.success('Link copied to clipboard')
          }
        })
      })

    })


    const customLayer = {
      id: '3d-model',
      type: 'custom',
      renderingMode: '3d',
      onAdd(map, gl) {
        this.camera = new THREE.Camera();
        this.scene = new THREE.Scene();

        // create two three.js lights to illuminate the model
        const directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(0, -70, 100).normalize();
        this.scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff);
        directionalLight2.position.set(0, 70, 100).normalize();
        this.scene.add(directionalLight2);

        // use the three.js GLTF loader to add the 3D model to the three.js scene
        const loader = new DRACOLoader()
        loader.setDecoderPath(`${ASSET_PREFIX}/jsm/libs/draco/`)
        loader.preload()


        loader.load(
          `${ASSET_PREFIX}/data/models/3dmap_roads.drc`,
          (geometry) => {
            const material = new THREE.MeshLambertMaterial({ color: 0x09b3f9, opacity: 0.5, transparent: true })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.rotateY(Math.PI)
            //mesh.renderOrder = 999;
            //mesh.material.depthTest = false;
            this.scene.add(mesh);
          }
        )
        loader.load(
          `${ASSET_PREFIX}/data/models/3dmap_metro.drc`,
          (geometry) => {
            const material = new THREE.MeshLambertMaterial({ color: 0x7acbec, opacity: 0.5, transparent: true })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.rotateY(Math.PI)
            this.scene.add(mesh);
          }
        )
        loader.load(
          `${ASSET_PREFIX}/data/models/3dmap_roads_borders.drc`,
          (geometry) => {
            const material = new THREE.MeshLambertMaterial({ color: 0x09b3f9, opacity: 0.8, transparent: true })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.rotateY(Math.PI)
            this.scene.add(mesh);
          }
        )
        loader.load(
          `${ASSET_PREFIX}/data/models/3dmap_terrain.drc`,
          (geometry) => {
            const material = new THREE.MeshLambertMaterial({ color: 0x051b2f, opacity: 0.99, transparent: false })
            const mesh = new THREE.Mesh(geometry, material)

            this.scene.add(mesh);
          }
        )
        loader.load(
          `${ASSET_PREFIX}/data/models/3dmap_cliffs.drc`,
          (geometry) => {
            const material = new THREE.MeshLambertMaterial({ color: 0x051b2f, opacity: 0.99, transparent: false })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.set(-2255, 0, 3050)
            this.scene.add(mesh);
          }
        )
        loader.load(
          `${ASSET_PREFIX}/data/models/3dmap_water.drc`,
          (geometry) => {
            const material = new THREE.MeshLambertMaterial({ color: 0x12599a, opacity: 0.5, transparent: false })
            const mesh = new THREE.Mesh(geometry, material)

            this.scene.add(mesh);
          }
        )
        loader.load(
          `${ASSET_PREFIX}/data/models/northoak_sign_a.drc`,
          (geometry) => {
            const material = new THREE.MeshLambertMaterial({ color: 0xba1c1f, opacity: 0.95, transparent: true })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.set(196.895233, 152.76178, -873.713013)
            mesh.setRotationFromQuaternion(new THREE.Quaternion(-0.020025, 0.286366999, -0.0668200031, 0.955577016))
            this.scene.add(mesh);
          }
        )
        loader.load(
          `${ASSET_PREFIX}/data/models/monument_ave_pyramid.drc`,
          (geometry) => {
            const material = new THREE.MeshLambertMaterial({ color: 0xba1c1f, opacity: 0.95, transparent: true })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.set(-1595.17004, 55.7399979, 2344.3103)
            this.scene.add(mesh);
          }
        )
        loader.load(
          `${ASSET_PREFIX}/data/models/3dmap_obelisk.drc`,
          (geometry) => {
            const material = new THREE.MeshLambertMaterial({ color: 0xba1c1f, opacity: 0.95, transparent: true })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.set(-1714.50903, 35.6829758, 2331.2688)
            mesh.setRotationFromQuaternion(new THREE.Quaternion(-0.0435770005, 0.998097003, 0.00190100004, 0.0435770005))
            this.scene.add(mesh);
          }
        )
        loader.load(
          `${ASSET_PREFIX}/data/models/cz_cz_building_h_icosphere.drc`,
          (geometry) => {
            const material = new THREE.MeshLambertMaterial({ color: 0xba1c1f, opacity: 0.95, transparent: true })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.set(-1974.80518, 102.700317, 2700.99243)
            mesh.setRotationFromQuaternion(new THREE.Quaternion(0.481983989, -0.84108597, -0.0920530036, 0.227580994))
            this.scene.add(mesh);
          }
        )
        loader.load(
          `${ASSET_PREFIX}/data/models/3dmap_statue_splash_a.drc`,
          (geometry) => {
            const material = new THREE.MeshLambertMaterial({ color: 0xba1c1f, opacity: 0.95, transparent: true })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.set(-1673.81726, 43.1975479, 2466.06299)
            mesh.setRotationFromQuaternion(new THREE.Quaternion(0, -0.948323667, 0, 0.317304879))
            this.scene.add(mesh);
          }
        )




        loadCubesDistrict(this.scene, `${ASSET_PREFIX}/data/buildings/watson_data.dds`, 237.175003, 206, new THREE.Vector3(-1979.37183, 1873.95068, 0), new THREE.Vector4(-1254.46997, -1258.68469, -24.7028503, 0), new THREE.Vector4(1988.5448, 2032.52405, 475.268005, 1), 2)
        //loadCubesDistrictOld(this.scene, `${ASSET_PREFIX}/data/watson_data.tga`, 237.175003, 206, new THREE.Vector3(-3230, -24.703, -615), new THREE.Vector4(-1254.46997, -1258.68469, -24.7028503, 0), new THREE.Vector4(1988.5448, 2032.52405, 475.268005, 1), 1.958, true, true)
        loadCubesDistrict(this.scene, `${ASSET_PREFIX}/data/buildings/westbrook_data.dds`, 197, 197, new THREE.Vector3(-97.2086182, 590.849365, 0), new THREE.Vector4(-1078.94739, -1148.69434, -18.4205875, 0), new THREE.Vector4(1155.12, 1562.87903, 507.894714, 1), 2)



        loadCubesDistrict(this.scene, `${ASSET_PREFIX}/data/buildings/city_center_data.dds`, 168.289993, 204, new THREE.Vector3(-2116.63721, 106.507599, 0), new THREE.Vector4(-770.609192, -530.549133, -40.6581497, 0), new THREE.Vector4(1316.82483, 649.75531, 642.893127, 1), 2)
        loadCubesDistrict(this.scene, `${ASSET_PREFIX}/data/buildings/heywood_data.dds`, 197.236832, 205, new THREE.Vector3(-1576.73218, -1002.81116, 0), new THREE.Vector4(-1080.35107, -418.153046, -38.4002304, 0), new THREE.Vector4(1136.94556, 1372.15979, 374.181305, 1), 2)
        loadCubesDistrict(this.scene, `${ASSET_PREFIX}/data/buildings/santo_domingo_data.dds`, 139.342102, 195, new THREE.Vector3(-15.9443359, -1610.07971, 0), new THREE.Vector4(-1328.95288, -1880.02502, -37.5960007, 0), new THREE.Vector4(1555.26318, 1369.01294, 332.348328, 1), 2)
        loadCubesDistrict(this.scene, `${ASSET_PREFIX}/data/buildings/pacifica_data.dds`, 305.600006, 153, new THREE.Vector3(-2422.44092, -2368.15576, 0), new THREE.Vector4(-4008.396, -4575.14941, -51.9539986, 0), new THREE.Vector4(8258.31641, 7254.10059, 264.306946, 1), 2)
        loadCubesDistrict(this.scene, `${ASSET_PREFIX}/data/buildings/ep1_dogtown_data.dds`, 198.020691, 148, new THREE.Vector3(0.00000762939453, 0, 0), new THREE.Vector4(-2650, -3126.6084, -0.750015974, 0), new THREE.Vector4(-1025.51855, -1803.58118, 493.576111, 1), 2.0, true, true)
        loadCubesDistrict(this.scene, `${ASSET_PREFIX}/data/buildings/ep1_spaceport_data.dds`, 115.298218, 94, new THREE.Vector3(-4200, 200, 0), new THREE.Vector4(-1168.5874, -765.104614, -41.4592323, 0), new THREE.Vector4(1219.45483, 1018.70129, 296.498138, 1), 2)

        this.map = map;

        // use the MapLibre GL JS map canvas for three.js
        this.renderer = new THREE.WebGLRenderer({
          canvas: map.getCanvas(),
          context: gl,
          antialias: true
        });

        this.renderer.autoClear = false;
      },

      render(gl, matrix) {
        const modelTransform = {
          translateX: modelAsMercatorCoordinate.x,
          translateY: modelAsMercatorCoordinate.y,
          translateZ: modelAsMercatorCoordinate.z,
          rotateX: modelRotate[0],
          rotateY: modelRotate[1],
          rotateZ: modelRotate[2],
          scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
        };
        const rotationX = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(1, 0, 0),
          modelTransform.rotateX
        );
        const rotationY = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 1, 0),
          modelTransform.rotateY
        );
        const rotationZ = new THREE.Matrix4().makeRotationAxis(
          new THREE.Vector3(0, 0, 1),
          modelTransform.rotateZ
        );

        const m = new THREE.Matrix4().fromArray(matrix);
        const l = new THREE.Matrix4()
          .makeTranslation(
            modelTransform.translateX,
            modelTransform.translateY,
            modelTransform.translateZ
          )
          .scale(
            new THREE.Vector3(
              modelTransform.scale,
              -modelTransform.scale,
              modelTransform.scale
            )
          )
          .multiply(rotationX)
          .multiply(rotationY)
          .multiply(rotationZ);

        this.camera.projectionMatrix = m.multiply(l);

        this.renderer.resetState();
        this.renderer.render(this.scene, this.camera);
        this.map.triggerRepaint();
      }
    };

    map.current.on('style.load', () => {
      map.current.addLayer(customLayer)
    })

  })

  let searchResults = []

  const clickSearchLocation = (marker) => {
    const lngLat = getMarkerLngLat(marker)
    map.current.flyTo({
      center: lngLat,
      zoom: 17
    })

    createMarkerPopup(marker)
  }

  if (!_.isEmpty(searchTerm)) {
    let i = 0
    _.forEach(mapmarkers, (markers, type) => {
      if (!visibleTypes.includes(type)) return
      _.forEach(markers, (marker, index) => {
        if (!visibleDistricts.includes(marker.district)) return
        const reg = new RegExp(searchTerm, "i")
        const isMatched = JSON.stringify(_.pick(marker, filterProperties)).match(reg)
        if (isMatched) {
          searchResults.push(
            <div className={`${styles.searchResult}`} key={i} onClick={() => clickSearchLocation(marker)}>
              <QuestDisplay marker={marker} />
            </div>
          )
          searchResults.push(<hr className={styles.searchDivider} key={`${i}-divider`} />)
        }
        i++
      })
    })
  }

  React.useEffect(() => {
    try {
      map.current.setFilter('mapmarkers', [
        'all',
        ['in', searchTerm.toLowerCase(), ['get', 'filtertext']],
        ['in', ['get', 'district'], ['literal', visibleDistricts]],
        ['in', ['get', 'type'], ['literal', visibleTypes]]
      ])
    } catch (err) {

    }

  }, [searchTerm])

  const districtFilters = Object.keys(districts).sort().map((district) => {
    return (
      <div className={styles.filterWrapper} key={district} onClick={() => toggleDistrict(district)} data-visible={_.includes(visibleDistricts, district)} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); focusDistrict(district); return false }}>
        <div className={styles.filterGroup}>
          <img className={styles.filterIcon} src={`${ASSET_PREFIX}/images/districticons/${district.replace(/\s/g, '')}.webp`} />
          <div className={styles.filterName}>{district}</div>
        </div>
      </div>
    )
  })

  const filterTypes = Object.keys(mapmarkers).sort().map((type) => {
    const markers = mapmarkers[type]
    return (
      <div className={styles.filterWrapper} key={type} onClick={() => toggleType(type)} data-visible={_.includes(visibleTypes, type)} onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); focusType(type); return false }}>
        <div className={styles.filterGroup}>
          <img className={styles.filterIcon} src={`${ASSET_PREFIX}/images/minimapicons/${MAP_ICONS[type]}.webp`} />
          <div className={styles.filterName}>{MAP_LABELS[type]}</div>
        </div>

        <div className={styles.filterCount}>{_.size(markers)}</div>
      </div>
    )
  })

  return (
    <>
      <Head>
        <title>Cyberpunk 2077 Phantom Liberty Interactive Map</title>
        <meta name="description"
          content="Interactive 3D Map for Cyberpunk 2077 Phantom Liberty"
          key="desc"
        />
      </Head>

      <main className={styles.main}>
        <div className={styles.center}>
          <div className={`${styles.mapFilterBar} ${filterBarOpen && styles.filterBarOpen}`}>
            <div className={`${styles.filterToggleButton} ${filterBarOpen && styles.filterToggleButtonOpen}`} onClick={() => setFilterBarOpen((prev) => !prev)}><Arrow className={`${styles.arrow}`} /></div>
            <span><h1 className={`${styles.title} ${glitch.glitch} ${glitch.layers}`} data-text={'Cyberpunk 2077 Phantom Liberty Interactive Map'}>Cyberpunk 2077 Phantom Liberty Interactive Map</h1></span>
            <TextInput className={styles.searchBar} placeholder="Search" icon={<BiSearchAlt2 />} onInputChanged={onSearchChanged} />
            <div className={styles.scrollSection}>
              {searchResults.length > 0 &&
                <div className={styles.searchResults}>
                  {searchResults}
                </div>
              }
              <div className={styles.filterControlBar}>
                <div className={styles.filterControl} onClick={showAllLayers}>SHOW 3D</div>
                <div className={styles.filterControl} onClick={hideAllLayers}>HIDE 3D</div>
              </div>
              <div className={styles.filters}>
                {/* layerFilters */}
              </div>
              <div className={styles.filterControlBar}>
                <div className={styles.filterControl} onClick={showAllDistricts}>SHOW ALL</div>
                <div className={styles.filterControl} onClick={hideAllDistricts}>HIDE ALL</div>
              </div>
              <div className={styles.filters}>
                {districtFilters}
              </div>
              <div className={styles.filterControlBar}>
                <div className={styles.filterControl} onClick={showAllMarkers}>SHOW ALL</div>
                <div className={styles.filterControl} onClick={hideAllMarkers}>HIDE ALL</div>
              </div>
              <div className={styles.filters}>
                {filterTypes}
              </div>
              {/* <div className={styles.filterControlBar}>
              <div className={styles.filterControl} onClick={startDraw}>CREATE SHAPE</div>
              <div className={styles.filterControl} onClick={deleteShape}>DELETE SHAPE</div>
            </div> */}
              <div className={styles.copyright}>
                <p>ATLASFORGE.gg is not affiliated with CD Projekt S.A.</p>
                <p>CD PROJEKT®, Cyberpunk®, Cyberpunk 2077® are registered trademarks of CD PROJEKT S.A. © 2022 CD PROJEKT S.A. All rights reserved. All other copyrights and trademarks are the property of their respective owners.</p>
              </div>
            </div>
          </div>
          <div className={styles.map} ref={mapContainer}></div>
        </div>
      </main>
    </>
  )
}
