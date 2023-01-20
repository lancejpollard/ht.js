import { Polygon } from '../src/Geometry/Polygon'
import * as jsondiffpatch from 'jsondiffpatch'
import j_a from './Polygon/1.json'
import _ from 'lodash'
import JSONSelect from 'JSONSelect'
import { Geometry2D } from '../src/Geometry/Geometry2D'
import { Geometry } from '../src/Geometry/Geometry'
import { DonHatch } from '../src/Math/DonHatch'

const difftool = jsondiffpatch.create()

const p = new Polygon()
p.CreateRegular(7, 3)

console.log()
eq(Geometry.Hyperbolic, Geometry2D.GetGeometry(7, 3))
eq(24154951.7535753, DonHatch.expm1(17))
eq(0.9866142981514303, DonHatch.h2eNorm(5))
eq(0.6206717375563867, Geometry2D.GetTriangleHypotenuse(7, 3))
eq(0.30074261874637903, Geometry2D.GetNormalizedCircumRadius(7, 3))

eq(p.Segments.length, j_a.Segments.length)
eq(
  JSONSelect.match(':root > * > .Center .X', p.Segments).join(':'),
  JSONSelect.match(':root > * > .Center .X', j_a.Segments).join(':'),
)
// )
// eq(
//   j(p.Segments[0].Center),
//   j(_.pick(j_a.Segments[0].Center, ['X', 'Y', 'Z', 'W'])),
// )
// function str(vec: Polygon): string {
//   return `${vec.X}:${vec.Y}:${vec.Z}:${vec.W}`
// }

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

function eq(a: any, s: any) {
  if (a != s) {
    console.log(j(a), j(s))
    throw new Error('Mismatch')
  }
}
