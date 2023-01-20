import React from 'react'
import { Tiling } from '../src/Geometry/Tiling'
import Path from 'paths-js/path'

type TilingPropsType = {
  data: Tiling
}

export default function TilingDisplay({ data }: TilingPropsType) {
  const paths: Array<string> = []
  const scalingFactor = 200
  const offset = 400

  data.m_tiles.forEach(tile => {
    let path = Path()

    tile.Drawn.Segments.forEach((seg, i) => {
      const a = {
        x: offset + scalingFactor * seg.P1.X,
        y: offset + scalingFactor * seg.P1.Y,
      }
      const b = {
        x: offset + scalingFactor * seg.P1.X,
        y: offset + scalingFactor * seg.P1.Y,
      }

      if (i === 0) {
        path = path.moveto(a.x, a.y).lineto(b.x, b.y)
      } else {
        path = path.lineto(a.x, a.y).lineto(b.x, b.y)
      }
    })

    path = path.closepath()

    paths.push(path.print())
  })

  return (
    <>
      <h1>Tiling Test</h1>
      <svg
        version="1.1"
        id="Ebene_1"
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        width="1024px"
        height="1024px"
        viewBox="0 0 1024 1024"
        enableBackground="new 0 0 1024 1024"
        xmlSpace="preserve"
      >
        {paths.map(path => (
          <path
            d={path}
            key={path}
            fill="#333"
          />
        ))}
      </svg>
    </>
  )
}
