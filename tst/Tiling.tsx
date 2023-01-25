import React, { useEffect, useState } from 'react'
import { Tiling } from '../src/Geometry/Tiling'
import Path from 'paths-js/path'

type TilingPropsType = {
  data: Tiling
}

const colors = {
  black: 'rgb(40, 40, 40)',
  blue: 'rgb(56, 201, 247)',
  green: 'hsl(165, 92%, 44%)',
  greenLight: 'hsl(165, 92%, 79%)',
  purple: 'rgb(121, 85, 243)',
  purpleLight: 'hsl(254, 87%, 70%)',
  red: 'rgb(238, 56, 96)',
  white: 'rgb(255, 255, 255)',
  white2: 'rgb(244, 244, 244)',
  white3: 'rgb(222, 222, 222)',
  yellow: 'rgb(246, 223, 104)',
}

export default function TilingDisplay({ data }: TilingPropsType) {
  const [tick, update] = useState(0)

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
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        width="1024px"
        height="1024px"
        viewBox="0 0 1024 1024"
        enableBackground="new 0 0 1024 1024"
        xmlSpace="preserve"
        onClick={() => {
          update(x => x + 1)
        }}
      >
        {paths.map(path => (
          <path
            stroke="white"
            strokeLinecap="round"
            strokeWidth={4}
            d={path}
            key={path}
            fill="#333"
          />
        ))}
      </svg>
    </>
  )
}
