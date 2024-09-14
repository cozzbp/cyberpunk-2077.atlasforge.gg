import { readFile } from 'fs/promises';
import fs from 'fs'
import _ from 'lodash'
import sharp from 'sharp'

import mappin_icons from '../raw/mappin_icons.inkatlas.json' assert { type: "json" };

mappin_icons.Data.RootChunk.slots.Elements[0].parts.forEach(async part => {
    const image = await sharp('../raw/mappin_icons.png')
    const meta = await image.metadata()
    const width = meta.width
    const height = meta.height

    const left = Math.floor(part.clippingRectInUVCoords.Left*meta.width)
    const top = Math.floor(part.clippingRectInUVCoords.Top*meta.height)
    const right = part.clippingRectInUVCoords.Right*meta.width
    const bottom = part.clippingRectInUVCoords.Bottom*meta.height
    const subwidth = Math.floor(right - left)
    const subheight = Math.floor(bottom - top)
    console.log(meta.width)
    image.extract({left, top, width: subwidth, height: subheight}).toFile(`../../public/cyberpunk-2077/images/minimapicons/${part.partName.$value}.webp`)
})

sharp('../raw/mappin_icons.png').resize(200,165).toFile('../raw/output.png')
mappin_icons
