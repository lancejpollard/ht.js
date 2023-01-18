///  <summary>
///  Class with some hackish methods for dealing with points projected to infinite.
///  </summary>
export class Infinity {
  static InfinityVector: Vector3D = new Vector3D(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  )

  static InfinityComplex: Complex = new Complex(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
  )

  static LargeFiniteVector: Vector3D = new Vector3D(
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
      input.Abs() > InfiniteScale
    )
  }

  static IsInfinite(input: Complex): boolean {
    return isInfinite(input.Real) || isInfinite(input.Imaginary)
  }

  static IsInfinite(input: number): boolean {
    return (
      Number.isNaN(input) ||
      number.IsInfinity(input) ||
      input >= InfiniteScale
    )
  }

  static InfinitySafe(input: Vector3D): Vector3D {
    if (isInfinite(input)) {
      return Infinity.LargeFiniteVector
    }

    return input
  }
}
