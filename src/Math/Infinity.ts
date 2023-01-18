// Class with some hackish methods for dealing with points projected to infinite.

import { Vector3D } from '@Geometry/Vector3D'
import { isInfinite } from './Utils'

export class UtilsInfinity {
  static InfinityVector: Vector3D = Vector3D.construct3d(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  )

  static InfinityComplex: Complex = new Complex(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  )

  static LargeFiniteVector: Vector3D = Vector3D.construct3d(
    FiniteScale,
    FiniteScale,
    FiniteScale,
  )

  /* const */ static FiniteScale: number = 10000

  /* const */ static InfiniteScale: number = 500000

  static IsInfinite(input: Vector3D): boolean {
    //  XXX - ugly hack I'd like to improve.
    return (
      isInfinite(input.X) ||
      isInfinite(input.Y) ||
      isInfinite(input.Z) ||
      isInfinite(input.W) ||
      input.Abs() > this.InfiniteScale
    )
  }

  static IsInfinite(input: Complex): boolean {
    return isInfinite(input.Real) || isInfinite(input.Imaginary)
  }

  static IsInfinite(input: number): boolean {
    return (
      Number.isNaN(input) ||
      isInfinite(input) ||
      input >= this.InfiniteScale
    )
  }

  static InfinitySafe(input: Vector3D): Vector3D {
    if (isInfinite(input)) {
      return Infinity.LargeFiniteVector
    }

    return input
  }
}
