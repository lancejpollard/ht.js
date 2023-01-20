import { Polygon } from '../src/Geometry/Polygon'
import * as jsondiffpatch from 'jsondiffpatch'
import j_a from './fixtures/1.json'
import tilingData from './fixtures/tiling.tile.Drawn.json'
import hypMobius from './fixtures/hyperbolic.mobius.json'
import hypMobIso from './fixtures/hyp.mob.iso.json'
import _ from 'lodash'
import JSONSelect from 'JSONSelect'
import { Geometry2D } from '../src/Geometry/Geometry2D'
import { Geometry } from '../src/Geometry/Geometry'
import { DonHatch } from '../src/Math/DonHatch'
import { Utils } from '../src/Math/Utils'
import { Mobius } from '../src/Math/Mobius'
import { Tiling } from '../src/Geometry/Tiling'
import { TilingConfig } from '../src/Geometry/TilingConfig'
import { Vector3D } from '../src/Geometry/Vector3D'
import { Complex } from '../src/Geometry/Complex'

const difftool = jsondiffpatch.create()

const p = new Polygon()
p.CreateRegular(7, 3)

const c = new TilingConfig(7, 3, 1000)
const t = new Tiling(c)
t.Generate()

var m2 = new Mobius()
m2.Isometry(Geometry.Hyperbolic, 0, new Complex(1.0, 0))

var m = new Mobius()
m.Hyperbolic(Geometry.Hyperbolic, Vector3D.construct().ToComplex(), 1.0)

console.log()
eq(Geometry.Hyperbolic, Geometry2D.GetGeometry(7, 3))
eq(24154951.7535753, DonHatch.expm1(17))
eq(0.9866142981514303, DonHatch.h2eNorm(5))
eq(0.6206717375563867, Geometry2D.GetTriangleHypotenuse(7, 3))
eq(0.30074261874637903, Geometry2D.GetNormalizedCircumRadius(7, 3))

eq(p.Segments.length, j_a.Segments.length)
eq(
  JSONSelect.match(':root > * > .Center .X', p.Segments)
    .map(round)
    .join(' : '),
  JSONSelect.match(':root > * > .Center .X', j_a.Segments)
    .map(round)
    .join(' : '),
)
eq(
  JSONSelect.match(':root > * > .Center .Y', p.Segments)
    .map(round)
    .join(' : '),
  JSONSelect.match(':root > * > .Center .Y', j_a.Segments)
    .map(round)
    .join(' : '),
)

eq(
  JSONSelect.match('.m_real', m).slice(0, 3).join(' : '),
  JSONSelect.match('.Real', hypMobius).slice(0, 3).join(' : '),
)

eq(t.Tiles[0].Drawn.Segments.length, tilingData.Segments.length)

console.log(t.Tiles[0].Drawn, tilingData)
eq(
  JSONSelect.match(
    ':root > .Center > .X, :root > .Center > .Y',
    t.Tiles[0].Drawn,
  ).join(' : '),
  JSONSelect.match(
    ':root > .Center > .X, :root > .Center > .Y',
    tilingData,
  ).join(' : '),
  ':root > .Center > .X, :root > .Center > .Y',
)
eq(
  JSONSelect.match(
    ':root > .Segments > .P1, :root > .Segments > .P2',
    t.Tiles[0].Drawn,
  ).join(' : '),
  JSONSelect.match(
    ':root > .Segments > .P1, :root > .Segments > .P2',
    tilingData,
  ).join(' : '),
  ':root > .Segments > .P1, :root > .Segments > .P2',
)

eq(
  JSONSelect.match(':root > .Segments > * > .Center > .X', tilingData)
    .map(round)
    .join(' : '),
  JSONSelect.match(
    ':root > .Segments  > * > .Center > .X',
    t.Tiles[0].Drawn,
  )
    .map(round)
    .join(' : '),
)

function round(n: number): number {
  return Utils.Round(n, 8)
}

// CreateRegular

// const v1 = Polygon.construct()
// eq(v1, '0:0:0:0')

// function eq(a: Polygon, s: string) {
//   const x = str(a)
//   if (x != s) {
//     throw new Error(`${x} != ${s}`)
//   }
// }

function j(o: object) {
  return JSON.stringify(o, null, 2)
}

function eq(a: any, s: any, x?: string) {
  if (a != s) {
    console.log(x)
    console.log(j(a))
    console.log()
    console.log(j(s))
    throw new Error('Mismatch')
  }
}
