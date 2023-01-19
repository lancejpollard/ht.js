// Class with some hackish methods for dealing with points projected to infinite.

import { Complex } from '@Geometry/Complex'
import { Vector3D } from '@Geometry/Vector3D'

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
    10000,
    10000,
    10000,
  )

  /* const */ static FiniteScale: number = 10000

  /* const */ static InfiniteScale: number = 500000

  static IsInfiniteVector3D(input: Vector3D): boolean {
    //  XXX - ugly hack I'd like to improve.
    return (
      UtilsInfinity.IsInfiniteNumber(input.X) ||
      UtilsInfinity.IsInfiniteNumber(input.Y) ||
      UtilsInfinity.IsInfiniteNumber(input.Z) ||
      UtilsInfinity.IsInfiniteNumber(input.W) ||
      input.Abs() > this.InfiniteScale
    )
  }

  static IsInfiniteComplex(input: Complex): boolean {
    return (
      UtilsInfinity.IsInfiniteNumber(input.Real) ||
      UtilsInfinity.IsInfiniteNumber(input.Imaginary)
    )
  }

  static IsInfiniteNumber(input: number): boolean {
    return (
      Number.isNaN(input) ||
      input == Number.POSITIVE_INFINITY ||
      input == Number.NEGATIVE_INFINITY ||
      input >= this.InfiniteScale
    )
  }

  static InfinitySafe(input: Vector3D): Vector3D {
    if (UtilsInfinity.IsInfiniteVector3D(input)) {
      return UtilsInfinity.LargeFiniteVector
    }

    return input
  }
}
