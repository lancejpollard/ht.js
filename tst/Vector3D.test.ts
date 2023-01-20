import { Vector3D } from '../src/Geometry/Vector3D'

function str(vec: Vector3D): string {
  return `${vec.X}:${vec.Y}:${vec.Z}:${vec.W}`
}

const v1 = Vector3D.construct()
eq(v1, '0:0:0:0')

// Abs
// Dist
// Dot
// Cross
// RotateXY
// RotateXYAtCenter
// RotateAboutAxis
//

function eq(a: Vector3D, s: string) {
  const x = str(a)
  if (x != s) {
    throw new Error(`${x} != ${s}`)
  }
}
