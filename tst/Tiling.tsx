import React, { useState } from 'react'
import { Tiling } from '../src/Geometry/Tiling'
import Path from 'paths-js/path'

const CANVAS_SIZE = 1024

type TilingPropsType = {
  data: Tiling
  gap?: number
}

const colors = {
  black: 'oklch(0.274 0.006 286.033)',
  blue: 'rgb(56, 201, 247)',
  green: 'hsl(165, 92%, 44%)',
  greenLight: 'hsl(165, 92%, 79%)',
  purple: 'oklch(0.871 0.006 286.286)',
  purpleLight: 'hsl(254, 87%, 70%)',
  red: 'rgb(238, 56, 96)',
  white: 'rgb(255, 255, 255)',
  white2: 'rgb(244, 244, 244)',
  white3: 'rgb(222, 222, 222)',
  yellow: 'rgb(246, 223, 104)',
}

// Function to find the tessellation center
const findTessellationCenter = tiles => {
  let globalMinX = Infinity,
    globalMaxX = -Infinity
  let globalMinY = Infinity,
    globalMaxY = -Infinity

  tiles.forEach(tile => {
    tile.Drawn.Segments.forEach(seg => {
      globalMinX = Math.min(globalMinX, seg.P1.X, seg.P2.X)
      globalMaxX = Math.max(globalMaxX, seg.P1.X, seg.P2.X)
      globalMinY = Math.min(globalMinY, seg.P1.Y, seg.P2.Y)
      globalMaxY = Math.max(globalMaxY, seg.P1.Y, seg.P2.Y)
    })
  })

  return {
    x: (globalMinX + globalMaxX) / 2,
    y: (globalMinY + globalMaxY) / 2,
  }
}

// Find the center tile
const findCenterTile = (tiles, tessellationCenter) => {
  let centerTileIndex = 0
  let minDistance = Infinity

  tiles.forEach((tile, index) => {
    if (tile.Drawn.Segments.length === 0) return

    // Calculate average center of this tile
    let tileX = 0,
      tileY = 0,
      count = 0
    tile.Drawn.Segments.forEach(seg => {
      tileX += seg.P1.X
      tileY += seg.P1.Y
      count++
    })

    if (count > 0) {
      tileX /= count
      tileY /= count

      const distance = Math.sqrt(
        Math.pow(tileX - tessellationCenter.x, 2) +
          Math.pow(tileY - tessellationCenter.y, 2),
      )

      if (distance < minDistance) {
        minDistance = distance
        centerTileIndex = index
      }
    }
  })

  return { tile: tiles[centerTileIndex], index: centerTileIndex }
}

// Calculate radius of a polygon
const calculatePolygonRadius = vertices => {
  if (vertices.length === 0) return 0

  let centerX = 0,
    centerY = 0
  vertices.forEach(v => {
    centerX += v.screenX
    centerY += v.screenY
  })
  centerX /= vertices.length
  centerY /= vertices.length

  let totalDistance = 0
  vertices.forEach(v => {
    const dx = v.screenX - centerX
    const dy = v.screenY - centerY
    totalDistance += Math.sqrt(dx * dx + dy * dy)
  })

  return totalDistance / vertices.length
}

export default function TilingDisplay({
  data,
  gap = 1.5,
}: TilingPropsType) {
  const [tick, update] = useState(0)

  const canvasSize = CANVAS_SIZE
  const canvasCenter = { x: canvasSize / 2, y: canvasSize / 2 }
  const scalingFactor = canvasSize / 2

  // Find tessellation center and center tile
  const tessellationCenter = findTessellationCenter(data.m_tiles)
  const centerTileInfo = findCenterTile(
    data.m_tiles,
    tessellationCenter,
  )

  // Find rotation angle needed to make the bottom edge of center tile horizontal
  let rotationAngle = 0
  if (
    centerTileInfo.tile &&
    centerTileInfo.tile.Drawn.Segments.length > 0
  ) {
    const centerTile = centerTileInfo.tile

    // Find the "bottom" edge - looking for a horizontal edge
    // For a regular polygon, we can find the two vertices with maximum Y values
    const segments = centerTile.Drawn.Segments

    // Extract all vertices
    const vertices = []
    segments.forEach(seg => {
      vertices.push({ x: seg.P1.X, y: seg.P1.Y })
    })
    if (segments.length > 0) {
      const lastSeg = segments[segments.length - 1]
      vertices.push({ x: lastSeg.P2.X, y: lastSeg.P2.Y })
    }

    // Sort vertices by y-coordinate (descending)
    vertices.sort((a, b) => b.y - a.y)

    // The "bottom" edge connects the two vertices with largest y values
    if (vertices.length >= 2) {
      const bottomVertex1 = vertices[0]
      const bottomVertex2 = vertices[1]

      // Calculate angle of this edge with horizontal
      const dx = bottomVertex2.x - bottomVertex1.x
      const dy = bottomVertex2.y - bottomVertex1.y

      rotationAngle = -Math.atan2(dy, dx) * (180 / Math.PI)

      // Ensure this is a bottom edge by checking if angle is in correct quadrant
      if (rotationAngle > 90) rotationAngle -= 180
      if (rotationAngle < -90) rotationAngle += 180
    }
  }

  // Rotation matrix for transforming points
  const rotatePoint = (x, y) => {
    const radians = rotationAngle * (Math.PI / 180)
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)

    // Translate to origin, rotate, translate back
    const dx = x - canvasCenter.x
    const dy = y - canvasCenter.y
    const newX = cos * dx - sin * dy + canvasCenter.x
    const newY = sin * dx + cos * dy + canvasCenter.y

    return { x: newX, y: newY }
  }

  const fixedGapSize = gap
  const minRadiusThreshold = 1.5
  const paths = []

  data.m_tiles.forEach(tile => {
    if (tile.Drawn.Segments.length === 0) return

    // Extract vertices
    const vertices = []
    tile.Drawn.Segments.forEach(seg => {
      // Convert to screen coordinates
      const screenX =
        canvasCenter.x +
        scalingFactor * (seg.P1.X - tessellationCenter.x)
      const screenY =
        canvasCenter.y +
        scalingFactor * (seg.P1.Y - tessellationCenter.y)

      // Apply rotation
      const rotated = rotatePoint(screenX, screenY)

      vertices.push({
        modelX: seg.P1.X,
        modelY: seg.P1.Y,
        screenX: rotated.x,
        screenY: rotated.y,
      })
    })

    // Add last vertex if needed
    const lastSeg = tile.Drawn.Segments[tile.Drawn.Segments.length - 1]
    if (
      Math.abs(lastSeg.P2.X - tile.Drawn.Segments[0].P1.X) > 0.0001 ||
      Math.abs(lastSeg.P2.Y - tile.Drawn.Segments[0].P1.Y) > 0.0001
    ) {
      const screenX =
        canvasCenter.x +
        scalingFactor * (lastSeg.P2.X - tessellationCenter.x)
      const screenY =
        canvasCenter.y +
        scalingFactor * (lastSeg.P2.Y - tessellationCenter.y)

      const rotated = rotatePoint(screenX, screenY)

      vertices.push({
        modelX: lastSeg.P2.X,
        modelY: lastSeg.P2.Y,
        screenX: rotated.x,
        screenY: rotated.y,
      })
    }

    // Check radius threshold
    const polygonRadius = calculatePolygonRadius(vertices)
    if (polygonRadius <= minRadiusThreshold) {
      return
    }

    // Find polygon center
    let centerX = 0,
      centerY = 0
    vertices.forEach(v => {
      centerX += v.screenX
      centerY += v.screenY
    })
    centerX /= vertices.length
    centerY /= vertices.length

    // Create inset vertices with gaps
    const insetVertices = vertices.map(v => {
      const dx = v.screenX - centerX
      const dy = v.screenY - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)

      const ndx = dx / distance
      const ndy = dy / distance

      const distanceFromOrigin = Math.sqrt(
        centerX * centerX + centerY * centerY,
      )
      const distanceFactor = Math.min(
        1,
        300 / Math.max(1, distanceFromOrigin),
      )
      const effectiveGap =
        fixedGapSize * (1 + (1 - distanceFactor) * 0.5)

      return {
        x: v.screenX - ndx * effectiveGap,
        y: v.screenY - ndy * effectiveGap,
      }
    })

    // Create path
    let path = Path()
    if (insetVertices.length > 0) {
      path = path.moveto(insetVertices[0].x, insetVertices[0].y)

      for (let i = 1; i < insetVertices.length; i++) {
        path = path.lineto(insetVertices[i].x, insetVertices[i].y)
      }

      path = path.closepath()
      paths.push(path.print())
    }
  })

  return (
    <div style={{ width: canvasSize, height: canvasSize }}>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        width="100%"
        height="100%"
        viewBox={`0 0 ${canvasSize} ${canvasSize}`}
        enableBackground={`new 0 0 ${canvasSize} ${canvasSize}`}
        xmlSpace="preserve"
        onClick={() => {
          update(x => x + 1)
        }}
      >
        {paths.map(path => (
          <path
            d={path}
            key={path}
            fill={colors.black}
          />
        ))}
      </svg>
    </div>
  )
}
