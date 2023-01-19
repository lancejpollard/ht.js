import { DonHatch } from '@Math/DonHatch'
import { Vector3D } from './Vector3D'

export class Hyperbolic2D {
  // Offsets a vector by a hyperbolic distance.

  static Offset(v: Vector3D, hDist: number): Vector3D {
    let mag: number = v.Abs()
    mag = DonHatch.h2eNorm(DonHatch.e2hNorm(mag) + hDist)
    v.Normalize()
    v = v.MultiplyWithNumber(mag)
    return v
  }
}
