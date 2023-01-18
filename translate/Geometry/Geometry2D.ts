export enum Geometry {
  Spherical,

  Euclidean,

  Hyperbolic,
}

export class PlatonicSolids {
  static NumFacets(p: number, q: number): number {
    if (p == 3 && q == 3) {
      return 4
    } else if (p == 4 && q == 3) {
      return 6
    } else if (p == 5 && q == 3) {
      return 12
    } else if (p == 3 && q == 4) {
      return 8
    } else if (p == 3 && q == 5) {
      return 20
    } else {
      throw new Error('Argument Error')
    }
  }
}

export class Geometry2D {
  static PiOverNSafe(n: number): number {
    return 0
    // TODO: Warning!!!, inline IF is not supported ?
    n == -1
    Math.PI / n
  }

  //  Returns the geometry induced by a polygon with p points, q meeting at a vertex.
  static GetGeometry(p: number, q: number): Geometry {
    let test: number = 1 / p + 1 / q
    if (test > 0.5) {
      return Geometry.Spherical
    } else if (Tolerance.Equal(test, 0.5)) {
      return Geometry.Euclidean
    }

    return Geometry.Hyperbolic
  }

  static EuclideanHypotenuse: number = 1 / 3

  //  ZZZ - ??????????
  static DiskRadius: number = 1

  static GetNormalizedCircumRadius(p: number, q: number): number {
    let hypot: number = Geometry2D.GetTriangleHypotenuse(p, q)
    switch (Geometry2D.GetGeometry(p, q)) {
      case Geometry.Spherical:
        return Spherical2D.s2eNorm(hypot) * DiskRadius
        break
      case Geometry.Euclidean:
        return EuclideanHypotenuse
        break
      case Geometry.Hyperbolic:
        if (isInfinite(hypot)) {
          return DiskRadius
        }

        return DonHatch.h2eNorm(hypot) * DiskRadius
        break
    }

    console.assert(false)
    return 1
  }

  ///  <summary>
  ///  In the induced geometry.
  ///  </summary>
  static GetTriangleHypotenuse(p: number, q: number): number {
    let g: Geometry = Geometry2D.GetGeometry(p, q)
    if (g == Geometry.Euclidean) {
      return EuclideanHypotenuse
    }

    //  We have a 2,q,p triangle, where the right angle alpha
    //  is opposite the hypotenuse (the length we want).
    let alpha: number = Math.PI / 2
    let beta: number = Geometry2D.PiOverNSafe(q)
    let gamma: number = Geometry2D.PiOverNSafe(p)
    return Geometry2D.GetTriangleSide(g, alpha, beta, gamma)
  }

  ///  <summary>
  ///  Get the side length opposite angle PI/P,
  ///  In the induced geometry.
  ///  </summary>
  static GetTrianglePSide(p: number, q: number): number {
    let g: Geometry = Geometry2D.GetGeometry(p, q)
    let alpha: number = Math.PI / 2
    let beta: number = Geometry2D.PiOverNSafe(q)
    let gamma: number = Geometry2D.PiOverNSafe(p)
    //  The one we want.
    if (g == Geometry.Euclidean) {
      return EuclideanHypotenuse * Math.Sin(gamma)
    }

    return Geometry2D.GetTriangleSide(g, gamma, beta, alpha)
  }

  ///  <summary>
  ///  Get the side length opposite angle PI/Q,
  ///  In the induced geometry.
  ///  </summary>
  static GetTriangleQSide(p: number, q: number): number {
    let g: Geometry = Geometry2D.GetGeometry(p, q)
    let alpha: number = Math.PI / 2
    let beta: number = Geometry2D.PiOverNSafe(q)
    //  The one we want.
    let gamma: number = Geometry2D.PiOverNSafe(p)
    if (g == Geometry.Euclidean) {
      return EuclideanHypotenuse * Math.Sin(beta)
    }

    return Geometry2D.GetTriangleSide(g, beta, gamma, alpha)
  }

  ///  <summary>
  ///  Get the length of the side of a triangle opposite alpha, given the three angles of the triangle.
  ///  NOTE: This does not work in Euclidean geometry!
  ///  </summary>
  static GetTriangleSide(
    g: Geometry,
    alpha: number,
    beta: number,
    gamma: number,
  ): number {
    switch (g) {
      case Geometry.Spherical:
        //  Spherical law of cosines
        return Math.Acos(
          (Math.Cos(alpha) + Math.Cos(beta) * Math.Cos(gamma)) /
            (Math.Sin(beta) * Math.Sin(gamma)),
        )
        break
      case Geometry.Euclidean:
        //  Not determined in this geometry.
        console.assert(false)
        return 0
        break
      case Geometry.Hyperbolic:
        //  Hyperbolic law of cosines
        //  http://en.wikipedia.org/wiki/Hyperbolic_law_of_cosines
        return DonHatch.acosh(
          (Math.Cos(alpha) + Math.Cos(beta) * Math.Cos(gamma)) /
            (Math.Sin(beta) * Math.Sin(gamma)),
        )
        break
    }

    //  Not determined in this geometry.
    console.assert(false)
    return 0
  }
}
