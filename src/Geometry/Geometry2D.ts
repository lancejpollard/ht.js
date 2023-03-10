import { DonHatch } from '@Math/DonHatch'
import { isInfinite, Tolerance } from '@Math/Utils'
import { Geometry } from './Geometry'
import { Spherical2D } from './Spherical2D'

export class Geometry2D {
  static PiOverNSafe(n: number): number {
    return n == -1 ? 0 : Math.PI / n
  }

  //  Returns the geometry induced by a polygon with p points, q meeting at a vertex.
  static GetGeometry(p: number, q: number): Geometry {
    let test: number = 1 / p + 1 / q
    if (test > 0.5) {
      return Geometry.Spherical
    } else if (test === 0.5) {
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
        return Spherical2D.s2eNorm(hypot) * this.DiskRadius
      case Geometry.Euclidean:
        return this.EuclideanHypotenuse
      case Geometry.Hyperbolic:
        return DonHatch.h2eNorm(hypot) * this.DiskRadius
      default:
        break
    }

    console.assert(false)
    return 1
  }

  // In the induced geometry.

  static GetTriangleHypotenuse(p: number, q: number): number {
    let g: Geometry = Geometry2D.GetGeometry(p, q)
    if (g == Geometry.Euclidean) {
      return this.EuclideanHypotenuse
    }

    //  We have a 2,q,p triangle, where the right angle alpha
    //  is opposite the hypotenuse (the length we want).
    let alpha: number = Math.PI / 2
    let beta: number = Geometry2D.PiOverNSafe(q)
    let gamma: number = Geometry2D.PiOverNSafe(p)
    return Geometry2D.GetTriangleSide(g, alpha, beta, gamma)
  }

  // Get the side length opposite angle PI/P,
  // In the induced geometry.

  static GetTrianglePSide(p: number, q: number): number {
    let g: Geometry = Geometry2D.GetGeometry(p, q)
    let alpha: number = Math.PI / 2
    let beta: number = Geometry2D.PiOverNSafe(q)
    let gamma: number = Geometry2D.PiOverNSafe(p)
    //  The one we want.
    if (g == Geometry.Euclidean) {
      return this.EuclideanHypotenuse * Math.sin(gamma)
    }

    return Geometry2D.GetTriangleSide(g, gamma, beta, alpha)
  }

  // Get the side length opposite angle PI/Q,
  // In the induced geometry.

  static GetTriangleQSide(p: number, q: number): number {
    let g: Geometry = Geometry2D.GetGeometry(p, q)
    let alpha: number = Math.PI / 2
    let beta: number = Geometry2D.PiOverNSafe(q)
    //  The one we want.
    let gamma: number = Geometry2D.PiOverNSafe(p)
    if (g == Geometry.Euclidean) {
      return this.EuclideanHypotenuse * Math.sin(beta)
    }

    return Geometry2D.GetTriangleSide(g, beta, gamma, alpha)
  }

  // Get the length of the side of a triangle opposite alpha, given the three angles of the triangle.
  // NOTE: This does not work in Euclidean geometry!

  static GetTriangleSide(
    g: Geometry,
    alpha: number,
    beta: number,
    gamma: number,
  ): number {
    switch (g) {
      case Geometry.Spherical:
        //  Spherical law of cosines
        return Math.acos(
          (Math.cos(alpha) + Math.cos(beta) * Math.cos(gamma)) /
            (Math.sin(beta) * Math.sin(gamma)),
        )
      case Geometry.Euclidean:
        //  Not determined in this geometry.
        console.assert(false)
        return 0
      case Geometry.Hyperbolic:
        //  Hyperbolic law of cosines
        //  http://en.wikipedia.org/wiki/Hyperbolic_law_of_cosines
        return DonHatch.acosh(
          (Math.cos(alpha) + Math.cos(beta) * Math.cos(gamma)) /
            (Math.sin(beta) * Math.sin(gamma)),
        )
      default:
        break
    }

    //  Not determined in this geometry.
    console.assert(false)
    return 0
  }
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
