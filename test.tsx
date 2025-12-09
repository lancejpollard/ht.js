import * as PIXI from 'pixi.js'
import { Tiling } from './src/Geometry/Tiling'
import { TilingConfig } from './src/Geometry/TilingConfig'
import TilingDisplay from './tst/Tiling'
// import './tst/Vector3D.test'
// import './tst/Polygon.test'
import { Polygon } from './src/Geometry/Polygon'
import React from 'react'
import { createRoot } from 'react-dom/client'

const tilings: Array<React.ReactNode> = []
// let p = 3
// while (p < 10) {
//   let q = 3
//   while (q < 10) {
//     const config = new TilingConfig(p, q, 2000)
//     const tiling = new Tiling(config)
//     tiling.Generate()
//     tilings.push(
//       <TilingDisplay
//         key={`${p}-${q}`}
//         data={tiling}
//       />,
//     )
//     q++
//   }
//   p++
// }

const config = new TilingConfig(7, 3, 232)
const tiling = new Tiling(config)
tiling.Generate()
tilings.push(
  <TilingDisplay
    gap={2.4}
    data={tiling}
  />,
)

const reactDiv = document.querySelector('#react')
assertElement(reactDiv)
const reactBase = createRoot(reactDiv)

reactBase.render(
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '16px',
      padding: 64,
    }}
  >
    {tilings}
  </div>,
)

const pixiDiv = document.querySelector('#pixi')

const app = new PIXI.Application({
  width: 800,
  height: 600,
})

const sprites = {}

// // console.log(tiling.m_tiles[0].Boundary)
// // console.log('here', tiling)
// const polygons = tiling.m_tiles.map(tile => tile.Boundary)
// // SVG.WritePolygons('example.svg', polygons)

// pixiDiv.appendChild(app.view as HTMLCanvasElement)

// // //create a texture

// // tesselation.addEventListener('tile:attach', attachSprite)
// // tesselation.addEventListener('tile:detach', detachSprite)

// polygons.forEach(attachSprite)

// // function detachSprite(tile) {
// //   const sprite = sprites[tile.hash()]
// //   if (sprite) {
// //     app.stage.removeChild(sprite)
// //   }
// // }

// function attachSprite(input: Polygon) {
//   const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
//   sprite.tint = 0xff0000

//   let scaleFactor = 300
//   let offset = 0

//   // sprites[tile.hash()] = sprite

//   const points: Array<PIXI.IPointData> = []
//   input.Segments.forEach(seg => {
//     const a = {
//       x: offset + scaleFactor * seg.P1.X,
//       y: offset + scaleFactor * seg.P1.Y,
//     }
//     const b = {
//       x: offset + scaleFactor * seg.P2.X,
//       y: offset + scaleFactor * seg.P2.Y,
//     }
//     points.push(a, b)
//   })

//   console.log(points)

//   const polygon = new PIXI.Polygon(points)
//   const mask = new PIXI.Graphics()
//   mask.hitArea = polygon
//   mask.interactive = true
//   mask.beginFill(0xff0000)
//   mask.drawPolygon(polygon)
//   sprite.mask = mask

//   sprite.onmouseover = () => {
//     sprite.alpha = 0.5
//   }

//   sprite.onmouseout = () => {
//     sprite.alpha = 1
//   }

//   app.stage.addChild(sprite)
// }

// // app.ticker.add(delta => {
// //   // Add the time to our total elapsed time
// //   // elapsed += delta
// //   // // Update the sprite's X position based on the cosine of our elapsed time.  We divide
// //   // // by 50 to slow the animation down a bit...
// //   // sprite.x = 100.0 + Math.cos(elapsed / 50.0) * 100.0
// // })

// // // Geodesic(tile.Geometry, currentPosition, tile.VertexCircle.Center)

function assertElement(obj: object | null): asserts obj is HTMLElement {
  if (obj instanceof HTMLElement) {
    return
  }

  throw new Error('Not an HTML element')
}
