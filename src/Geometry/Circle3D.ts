import { isInfinite, Tolerance } from '@Math/Utils'
import { Vector3D } from './Vector3D'

export class Circle3D {
  Center: Vector3D

  Radius: number

  Normal: Vector3D

  static construct() {
    return new Circle3D(
      Vector3D.construct(),
      Vector3D.construct(),
      Vector3D.construct(),
    )
  }

  constructor(t1: Vector3D, t2: Vector3D, t3: Vector3D) {
    const { center, radius } = Circle3D.From3Points(t1, t2, t3)

    this.Center = center
    this.Radius = radius

    let normal: Vector3D = t2.Subtract(t1).Cross(t3.Subtract(t1))

    if (isInfinite(this.Radius)) {
      this.Center = Vector3D.DneVector()

      normal = !t1.IsOrigin ? t1 : !t2.IsOrigin ? t2 : t3 // Hacky rep of line.
    }

    normal.Normalize()
    this.Normal = normal
  }

  Clone(): Circle3D {
    const next = Circle3D.construct()
    next.Center = this.Center
    next.Radius = this.Radius
    next.Normal = this.Normal
    return next
  }

  static FromCenterAnd2Points(
    cen: Vector3D,
    p1: Vector3D,
    p2: Vector3D,
  ): Circle3D {
    let circle: Circle3D = Circle3D.construct()
    circle.Center = cen
    circle.Radius = p1.Subtract(cen).Abs()

    if (!Tolerance.Equal(circle.Radius, p2.Subtract(cen).Abs())) {
      throw new Error('Points are not on the same circle.')
    }

    let normal: Vector3D = p2.Subtract(cen).Cross(p1.Subtract(cen))
    normal.Normalize()

    circle.Normal = normal

    return circle
  }

  get PointOnCircle(): Vector3D {
    let points: Array<Vector3D> = this.Subdivide(1)
    return points[0]
  }

  // Returns 3 points that will define the circle (120 degrees apart).

  get RepresentativePoints(): Array<Vector3D> {
    return this.Subdivide(3)
  }

  // Calculate n points around the circle

  Subdivide(n: number): Array<Vector3D> {
    let points: Array<Vector3D> = new Array<Vector3D>()

    let start: Vector3D = this.Normal.Perpendicular()
    start = start.MultiplyWithNumber(this.Radius)

    let angleInc: number = 2 * (Math.PI / n)

    for (let i: number = 0; i < n; i++) {
      let v: Vector3D = start
      v.RotateAboutAxis(this.Normal, angleInc * i)

      points.push(this.Center.Add(v))
    }

    return points
  }

  static From3Points(v1: Vector3D, v2: Vector3D, v3: Vector3D) {
    //  Circumcenter/Circumradius of triangle (circle from 3 points)
    //  http://mathworld.wolfram.com/Circumcenter.html
    //  http://mathworld.wolfram.com/Circumradius.html
    //  http://mathworld.wolfram.com/BarycentricCoordinates.html
    //  side lengths and their squares
    let a: number = v3.Subtract(v2).Abs()
    //  Opposite v1
    let b: number = v1.Subtract(v3).Abs()
    //  Opposite v2
    let c: number = v2.Subtract(v1).Abs()
    //  Opposite v3
    let a2: number = a * a
    let b2: number = b * b
    let c2: number = c * c
    let circumCenterBary: Vector3D = Vector3D.construct3d(
      a2 * (b2 + (c2 - a2)),
      b2 * (c2 + (a2 - b2)),
      c2 * (a2 + (b2 - c2)),
    )
    circumCenterBary.X + (circumCenterBary.Y + circumCenterBary.Z)
    //  Normalize.
    let center = Circle3D.BaryToCartesian(v1, v2, v3, circumCenterBary)
    let s: number = (a + b + c) / 2
    let radius =
      (a * b * c) /
      (4 * Math.sqrt(s * (a + b - s) * (a + c - s) * (b + c - s)))

    return { center, radius }
  }

  // Barycentric coords to Cartesian
  // http://stackoverflow.com/questions/11262391/from-barycentric-to-cartesian

  static BaryToCartesian(
    t1: Vector3D,
    t2: Vector3D,
    t3: Vector3D,
    bary: Vector3D,
  ): Vector3D {
    return Vector3D.MultiplyNumberByVector(bary.X, t1)
      .Add(Vector3D.MultiplyNumberByVector(bary.Y, t2))
      .Add(Vector3D.MultiplyNumberByVector(bary.Z, t3))
  }
}
