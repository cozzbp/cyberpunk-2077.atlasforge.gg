import { readFile } from 'fs/promises';
import fs from 'fs'
import _ from 'lodash'

import buildings from '../raw/3dmap_coll_buildings.mesh.json' assert { type: "json" };
import buildings2 from '../raw/3dmap_coll_buildings2.mesh.json' assert { type: "json" };
import buildings3 from '../raw/3dmap_coll_buildings3.mesh.json' assert { type: "json" };
import santo from '../raw/3dmap_coll_santo.mesh.json' assert { type: "json" };



let buildingShapes = []

buildings.Data.RootChunk.parameters[0].Data.physicsData.Data.bodies[0].Data.collisionShapes.forEach((element) => {
    console.log(element.Data.localToBody.position)
    buildingShapes.push({
        position: {
            x: element.Data.localToBody.position.X,
            y: element.Data.localToBody.position.Y,
            z: element.Data.localToBody.position.Z,
        },
        halfExtents: {
            x: element.Data.halfExtents.X,
            y: element.Data.halfExtents.Y,
            z: element.Data.halfExtents.Z,
        },
        orientation: {
            x: element.Data.localToBody.orientation.i,
            y: element.Data.localToBody.orientation.j,
            z: element.Data.localToBody.orientation.k,
            w: element.Data.localToBody.orientation.r,
        }
    })

})

buildings2.Data.RootChunk.parameters[0].Data.physicsData.Data.bodies[0].Data.collisionShapes.forEach((element) => {
    console.log(element.Data.localToBody.position)
    buildingShapes.push({
        position: {
            x: element.Data.localToBody.position.X,
            y: element.Data.localToBody.position.Y,
            z: element.Data.localToBody.position.Z,
        },
        halfExtents: {
            x: element.Data.halfExtents.X,
            y: element.Data.halfExtents.Y,
            z: element.Data.halfExtents.Z,
        },
        orientation: {
            x: element.Data.localToBody.orientation.i,
            y: element.Data.localToBody.orientation.j,
            z: element.Data.localToBody.orientation.k,
            w: element.Data.localToBody.orientation.r,
        }
    })

})

buildings3.Data.RootChunk.parameters[0].Data.physicsData.Data.bodies[0].Data.collisionShapes.forEach((element) => {
    console.log(element.Data.localToBody.position)
    buildingShapes.push({
        position: {
            x: element.Data.localToBody.position.X,
            y: element.Data.localToBody.position.Y,
            z: element.Data.localToBody.position.Z,
        },
        halfExtents: {
            x: element.Data.halfExtents.X,
            y: element.Data.halfExtents.Y,
            z: element.Data.halfExtents.Z,
        },
        orientation: {
            x: element.Data.localToBody.orientation.i,
            y: element.Data.localToBody.orientation.j,
            z: element.Data.localToBody.orientation.k,
            w: element.Data.localToBody.orientation.r,
        }
    })

})

santo.Data.RootChunk.parameters[0].Data.physicsData.Data.bodies[0].Data.collisionShapes.forEach((element) => {
    console.log(element.Data.localToBody.position)
    buildingShapes.push({
        position: {
            x: element.Data.localToBody.position.X,
            y: element.Data.localToBody.position.Y,
            z: element.Data.localToBody.position.Z,
        },
        halfExtents: {
            x: element.Data.halfExtents.X,
            y: element.Data.halfExtents.Y,
            z: element.Data.halfExtents.Z,
        },
        orientation: {
            x: element.Data.localToBody.orientation.i,
            y: element.Data.localToBody.orientation.j,
            z: element.Data.localToBody.orientation.k,
            w: element.Data.localToBody.orientation.r,
        }
    })

})

fs.writeFile(`../../public/data/buildingShapes.json`, JSON.stringify(buildingShapes, null, '  '), err => {
    if (err) console.error(err)
})

