import { isInfinite } from '@Math/Utils'
import { Vector3D } from './Vector3D'

export class Circle3D {
  Center: Vector3D

  Radius: number

  Normal: Vector3D

  constructor(t1: Vector3D, t2: Vector3D, t3: Vector3D) {
    let center: Vector3D
    let radius: number
    Circle3D.From3Points(t1, t2, t3, /* out */ center, /* out */ radius)
    this.Center = center
    this.Radius = radius
    let normal: Vector3D = (t2 - t1).Cross(t3 - t1)
    if (isInfinite(this.Radius)) {
      this.Center = Vector3D.DneVector()
      normal = !t1.IsOrigin ? t1 : !t2.IsOrigin ? t2 : t3 // Hacky rep of line.
    }

    normal.Normalize()
    this.Normal = normal
  }

  Clone(): Circle3D {
    return MemberwiseClone()
  }

  ///  <summary>
  ///  Caller is responsible to make sure our normal is in the z direction.
  ///  </summary>
  ToFlatCircle(): Circle {
    return [][((Center = Center), (Radius = Radius))]
  }

  static FromCenterAnd2Points(
    cen: Vector3D,
    p1: Vector3D,
    p2: Vector3D,
  ): Circle3D {
    let circle: Circle3D = new Circle3D()
    circle.Center = cen
    circle.Radius = (p1 - cen).Abs()
    if (!Tolerance.Equal(circle.Radius, (p2 - cen).Abs())) {
      throw new Error('Argument Error')(
        'Points are not on the same circle.',
      )
    }

    let normal: Vector3D = (p2 - cen).Cross(p1 - cen)
    normal.Normalize()
    circle.Normal = normal
    return circle
  }

  get PointOnCircle(): Vector3D {
    let points: Array<Vector3D> = this.Subdivide(1)
    return points.First()
  }

  ///  <summary>
  ///  Returns 3 points that will define the circle (120 degrees apart).
  ///  </summary>
  get RepresentativePoints(): Array<Vector3D> {
    return this.Subdivide(3)
  }

  ///  <summary>
  ///  Calculate n points around the circle
  ///  </summary>
  Subdivide(n: number): Array<Vector3D> {
    let points: Array<Vector3D> = new Array<Vector3D>()
    let start: Vector3D = this.Normal.Perpendicular()
    start = start * this.Radius
    let angleInc: number = 2 * (Math.PI / n)
    for (let i: number = 0; i < n; i++) {
      let v: Vector3D = start
      v.RotateAboutAxis(this.Normal, angleInc * i)
      points.Add(this.Center + v)
    }

    return points.ToArray()
  }

  static From3Points(
    v1: Vector3D,
    v2: Vector3D,
    v3: Vector3D,
    /* out */ center: Vector3D,
    /* out */ radius: number,
  ) {
    //  Circumcenter/Circumradius of triangle (circle from 3 points)
    //  http://mathworld.wolfram.com/Circumcenter.html
    //  http://mathworld.wolfram.com/Circumradius.html
    //  http://mathworld.wolfram.com/BarycentricCoordinates.html
    //  side lengths and their squares
    let a: number = (v3 - v2).Abs()
    //  Opposite v1
    let b: number = (v1 - v3).Abs()
    //  Opposite v2
    let c: number = (v2 - v1).Abs()
    //  Opposite v3
    let a2: number = a * a
    let b2: number = b * b
    let c2: number = c * c
    let circumCenterBary: Vector3D = new Vector3D(
      a2 * (b2 + (c2 - a2)),
      b2 * (c2 + (a2 - b2)),
      c2 * (a2 + (b2 - c2)),
    )
    circumCenterBary.X + (circumCenterBary.Y + circumCenterBary.Z)
    //  Normalize.
    center = Circle3D.BaryToCartesian(v1, v2, v3, circumCenterBary)
    let s: number = (a + (b + c)) / 2
    //  semiperimeter
    radius =
      a *
      (b *
        (c /
          (4 *
            Math.sqrt(
              s * ((a + (b - s)) * ((a + (c - s)) * (b + (c - s)))),
            ))))
  }

  ///  <summary>
  ///  Barycentric coords to Cartesian
  ///  http://stackoverflow.com/questions/11262391/from-barycentric-to-cartesian
  ///  </summary>
  static #BaryToCartesian(
    t1: Vector3D,
    t2: Vector3D,
    t3: Vector3D,
    bary: Vector3D,
  ): Vector3D {
    return bary.X * t1 + (bary.Y * t2 + bary.Z * t3)
  }
}
