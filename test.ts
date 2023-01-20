import * as PIXI from 'pixi.js'
import { Tiling } from './src/Geometry/Tiling'
import { TilingConfig } from './src/Geometry/TilingConfig'

import './tst/Vector3D.test'
import './tst/Polygon.test'
import { Polygon } from './src/Geometry/Polygon'

const app = new PIXI.Application({
  width: 800,
  height: 600,
})

const sprites = {}

const config = new TilingConfig(7, 3, 1000)
const tiling = new Tiling(config)
tiling.Generate()
// console.log(tiling.m_tiles[0].Boundary)
// console.log('here', tiling)
const polygons = tiling.m_tiles.map(tile => tile.Boundary)
// SVG.WritePolygons('example.svg', polygons)

document.body.appendChild(app.view as HTMLCanvasElement)

// //create a texture

// tesselation.addEventListener('tile:attach', attachSprite)
// tesselation.addEventListener('tile:detach', detachSprite)

polygons.forEach(attachSprite)

// function detachSprite(tile) {
//   const sprite = sprites[tile.hash()]
//   if (sprite) {
//     app.stage.removeChild(sprite)
//   }
// }

function attachSprite(input: Polygon) {
  const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
  sprite.tint = 0xff0000

  // sprites[tile.hash()] = sprite

  const points: Array<PIXI.IPointData> = []
  input.Segments.forEach(seg => {
    const a = { x: seg.P1.X, y: seg.P1.Y }
    const b = { x: seg.P2.X, y: seg.P2.Y }
    points.push(a, b)
  })

  const polygon = new PIXI.Polygon(points)
  const mask = new PIXI.Graphics()
  mask.hitArea = polygon
  mask.interactive = true
  mask.beginFill(0xff0000)
  mask.drawPolygon(polygon)
  sprite.mask = mask

  sprite.onmouseover = () => {
    sprite.alpha = 0.5
  }

  sprite.onmouseout = () => {
    sprite.alpha = 1
  }

  app.stage.addChild(sprite)
}

// app.ticker.add(delta => {
//   // Add the time to our total elapsed time
//   // elapsed += delta
//   // // Update the sprite's X position based on the cosine of our elapsed time.  We divide
//   // // by 50 to slow the animation down a bit...
//   // sprite.x = 100.0 + Math.cos(elapsed / 50.0) * 100.0
// })

// // Geodesic(tile.Geometry, currentPosition, tile.VertexCircle.Center)
