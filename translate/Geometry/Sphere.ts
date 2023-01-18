export class Circle3D {
  get Center(): Vector3D {}
  set Center(value: Vector3D) {}

  get Radius(): number {}
  set Radius(value: number) {}

  get Normal(): Vector3D {}
  set Normal(value: Vector3D) {}

  get Color(): System.Drawing.Color {}
  set Color(value: System.Drawing.Color) {}

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
    let points: Vector3D[] = this.Subdivide(1)
    return points.First()
  }

  ///  <summary>
  ///  Returns 3 points that will define the circle (120 degrees apart).
  ///  </summary>
  get RepresentativePoints(): Vector3D[] {
    return this.Subdivide(3)
  }

  ///  <summary>
  ///  Calculate n points around the circle
  ///  </summary>
  Subdivide(n: number): Vector3D[] {
    let points: List<Vector3D> = new List<Vector3D>()
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

  static #From3Points(
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
            Math.Sqrt(
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

export class Sphere {
  constructor() {
    this.Reset()
  }

  constructor(center: Vector3D, radius: number) {
    this.Reset()
    Center = center
    Radius = radius
  }

  static Plane(normal: Vector3D): Sphere {
    return Sphere.Plane(new Vector3D(), normal)
  }

  static Plane(offset: Vector3D, normal: Vector3D): Sphere {
    let result: Sphere = new Sphere()
    result.Center = normal
    result.Offset = offset
    result.Radius = Number.POSITIVE_INFINITY
    return result
  }

  #Reset() {
    Center = new Vector3D()
    Radius = 1
    Offset = new Vector3D()
    Invert = false
  }

  ///  <summary>
  ///  Our Center.
  ///  </summary>
  get Center(): Vector3D {
    return m_center
  }
  set Center(value: Vector3D) {
    m_center = value
    this.CalcNormal()
  }

  #m_center: Vector3D

  ///  <summary>
  ///  Our Radius. As a limiting case, we support infinite radii.
  ///  The sphere is then a plane with a normal equal to the center, and an optional offset.
  ///  </summary>
  get Radius(): number {
    return m_radius
  }
  set Radius(value: number) {
    m_radius = value
    this.IsPlane = isInfinite(m_radius)
    this.CalcNormal()
  }

  #m_radius: number

  get Color(): System.Drawing.Color {}
  set Color(value: System.Drawing.Color) {}

  ///  <summary>
  ///  Required for planes which do not go through the origin.
  ///  This can be any point on the plane.
  ///  XXX - A vector is not required...We could use a double.
  ///  </summary>
  get Offset(): Vector3D {}
  set Offset(value: Vector3D) {}

  ///  <summary>
  ///  Used to track which part of the sphere is "inside".
  ///  </summary>
  get Invert(): boolean {}
  set Invert(value: boolean) {}

  ///  <summary>
  ///  For planes, the normal.
  ///  </summary>
  get Normal(): Vector3D {
    return m_normal
  }

  #m_normal: Vector3D = Vector3D.DneVector()

  #CalcNormal() {
    if (this.IsPlane) {
      this.m_normal = this.m_center
      this.m_normal.Normalize()
    }
  }

  get IsPlane(): boolean {}
  set IsPlane(value: boolean) {}

  get ID(): Vector3D {
    if (this.IsPlane) {
      let n: Vector3D = this.Normal
      n.Normalize()
      if (n.Z > 0) {
        n = n * -1
      }

      return n + this.Offset
    }

    return this.Center + new Vector3D(this.Radius / 2, 0)
  }

  //  XXX - Do we only want to compare the surface, or also the orientation?
  //  This just does the surface.
  /* override */ Equals(obj: Object): boolean {
    let s: Sphere = <Sphere>obj
    if (this.IsPlane) {
      if (!s.IsPlane) {
        return false
      }

      let n1: Vector3D = this.Normal
      n1.Normalize()
      let n2: Vector3D = s.Normal
      n2.Normalize()
      return (n1 == n2 || n1 == n2 * -1) && this.Offset == s.Offset
    }

    if (s.IsPlane) {
      return false
    }

    return (
      Tolerance.Equal(this.Radius, s.Radius) && this.Center == s.Center
    )
  }

  /* override */ GetHashCode(): number {
    return this.ID.GetHashCode()
  }

  Clone(): Sphere {
    return <Sphere>MemberwiseClone()
  }

  //  Strictly less than.
  IsPointInside(test: Vector3D): boolean {
    let inside: boolean
    //  For planes, this calcs us relative to the normal.
    if (this.IsPlane) {
      //  Normal vector points to the "outside" (same in pov-ray).
      inside = (test - this.Offset).Dot(this.Normal) < 0
      // inside = Tolerance.LessThanOrEqual( ( test - this.Offset ).Dot( this.Normal ), 0 );
    } else {
      //  XXX - Not General! (not as good as CenterNE calcs)
      inside = Tolerance.LessThan(
        (test - this.Center).Abs(),
        this.Radius,
      )
      // inside = Tolerance.LessThanOrEqual( ( test - Center ).Abs(), Radius );
    }

    // if( Invert )
    //     throw new System.Exception();
    return Invert ? !inside : inside
  }

  IsPointOn(test: Vector3D): boolean {
    if (this.IsPlane) {
      let dist: number = Euclidean3D.DistancePointPlane(
        this.Normal,
        this.Offset,
        test,
      )
      return Tolerance.Zero(dist)
    }

    return Tolerance.Equal((test - this.Center).Abs(), this.Radius)
  }

  IsPointInsideOrOn(test: Vector3D): boolean {
    return this.IsPointInside(test) || this.IsPointOn(test)
  }

  ///  <summary>
  ///  Reflect a point in us.
  ///  </summary>
  ReflectPoint(p: Vector3D): Vector3D {
    if (this.IsPlane) {
      //  We used to call ProjectOntoPlane, but optimized it away.
      //  This is faster because we already know our normal is normalized,
      //  and it avoids some extra Vector3D operations.
      let dist: number = Euclidean3D.DistancePointPlane(
        this.Normal,
        this.Offset,
        p,
      )
      let offset: Vector3D = this.Normal * (dist * -2)
      return p + offset
    } else {
      if (p == this.Center) {
        return Infinity.InfinityVector
      }

      if (isInfinite(p)) {
        return this.Center
      }

      let v: Vector3D = p - this.Center
      let d: number = v.Abs()
      v.Normalize()
      return this.Center + v * (this.Radius * (this.Radius / d))
    }
  }

  ///  <summary>
  ///  Reflect ourselves about another sphere.
  ///  </summary>
  Reflect(sphere: Sphere) {
    //  An interior point used to calculate whether we get inverted.
    let interiorPoint: Vector3D
    if (this.IsPlane) {
      console.assert(!this.Normal.IsOrigin)
      interiorPoint = this.Offset - this.Normal
    } else {
      //  We don't want it to be the center, because that will reflect to infinity.
      interiorPoint = this.Center + new Vector3D(this.Radius / 2, 0)
    }

    if (this.Invert) {
      interiorPoint = this.ReflectPoint(interiorPoint)
    }

    console.assert(this.IsPointInside(interiorPoint))
    interiorPoint = sphere.ReflectPoint(interiorPoint)
    console.assert(!interiorPoint.DNE)
    if (this.Equals(sphere)) {
      if (this.IsPlane) {
        // this.Center = -this.Center;    // Same as inverting, but we need to do it this way because of Pov-Ray
        this.Invert = !this.Invert
      } else {
        this.Invert = !this.Invert
      }

      console.assert(this.IsPointInside(interiorPoint))
      return
    }

    //  Both planes?
    if (this.IsPlane && sphere.IsPlane) {
      //  XXX - not general, but I know the planes I'll be dealing with go through the origin.
      // if( !sphere.Offset.IsOrigin )
      //     throw new Error('Not implemented');
      //  Reflect the normal relative to the plane (conjugate with sphere.Offset).
      let newNormal: Vector3D = this.Normal + sphere.Offset
      newNormal = sphere.ReflectPoint(newNormal)
      newNormal = newNormal - sphere.Offset
      newNormal.Normalize()
      this.Center = newNormal
      //  Calc the new offset (so far we have considered planes through origin).
      this.Offset = sphere.ReflectPoint(this.Offset)
      // console.assert( Offset.IsOrigin );    // XXX - should handle more generality.
      console.assert(this.IsPointInside(interiorPoint))
      return
    }

    //  We are a plane and reflecting in a sphere.
    if (this.IsPlane) {
      //  Think of 2D case here (circle and line)...
      let projected: Vector3D = Euclidean3D.ProjectOntoPlane(
        this.Normal,
        this.Offset,
        sphere.Center,
      )
      let p: Vector3D = sphere.ReflectPoint(projected)
      if (isInfinite(p)) {
        //  This can happen if we go through sphere.Center.
        //  This reflection does not change our orientation (does not invert us).
        return
      }

      this.Center = sphere.Center + (p - sphere.Center) / 2
      this.Radius = this.Center.Dist(sphere.Center)
      //  Did this invert us?
      if (!this.IsPointInside(interiorPoint)) {
        this.Invert = !this.Invert
      }

      return
    }

    //  Is mirror a plane?
    if (sphere.IsPlane) {
      let projected: Vector3D = Euclidean3D.ProjectOntoPlane(
        sphere.Normal,
        sphere.Offset,
        this.Center,
      )
      let diff: Vector3D = this.Center - projected
      this.Center = this.Center - 2 * diff
      //  Radius remains unchanged.
      //  NOTE: This does not invert us.
      console.assert(this.IsPointInside(interiorPoint))
      return
    }

    //
    //  Now sphere reflecting in a sphere.
    //
    //  Reflecting to a plane?
    if (this.IsPointOn(sphere.Center)) {
      //  Concentric spheres?
      if (this.Center == sphere.Center) {
        throw new System.Exception()
      }

      let center: Vector3D = this.Center - sphere.Center
      //  Offset
      let direction: Vector3D = center
      direction.Normalize()
      let offset: Vector3D = direction * (this.Radius * 2)
      offset = sphere.ReflectPoint(offset)
      //  We are a line now.
      this.Center = center
      // Offset = offset;    // Not working??  Caused issues in old generation code for 435.
      this.Radius = Number.POSITIVE_INFINITY
      //  Did this invert us?
      if (!this.IsPointInside(interiorPoint)) {
        this.Invert = !this.Invert
      }

      console.assert(this.IsPointInside(interiorPoint))
      return
    }

    //  XXX - Could try to share code below with Circle class.
    //  NOTE: We can't just reflect the center.
    //          See http://mathworld.wolfram.com/Inversion.html
    let a: number = this.Radius
    let k: number = sphere.Radius
    let v: Vector3D = this.Center - sphere.Center
    let s: number = k * (k / (v.MagSquared() - a * a))
    this.Center = sphere.Center + v * s
    this.Radius = Math.abs(s) * a
    //  Did this invert us?
    if (!this.IsPointInside(interiorPoint)) {
      this.Invert = !this.Invert
    }
  }

  //  Sphere from 4 points.
  //  Potentially good resource:  http://paulbourke.net/geometry/circlesphere/
  //  Try to generalize Circle3D.From3Points
  static From4Points(
    s1: Vector3D,
    s2: Vector3D,
    s3: Vector3D,
    s4: Vector3D,
  ): Sphere {
    //  http://www.gamedev.net/topic/652490-barycentric-coordinates-of-circumcenter-of-tetrahedron/
    let C: Vector3D = s4
    let O: Vector3D = s1
    let A: Vector3D = s2
    let B: Vector3D = s3
    let a: Vector3D = A - O
    let b: Vector3D = B - O
    let c: Vector3D = C - O
    let det: number =
      a.X * (b.Y * c.Z - b.Z * c.Y) -
      a.Y * (b.X * c.Z - b.Z * c.X) +
      a.Z * (b.X * c.Y - b.Y * c.X)
    let denominator: number = 2 * det
    let temp_v1: Vector3D = a.Cross(b) * c.Dot(c)
    let temp_v2: Vector3D = c.Cross(a) * b.Dot(b)
    let temp_v3: Vector3D = b.Cross(c) * a.Dot(a)
    let o: Vector3D =
      (temp_v1 + (temp_v2 + temp_v3)) * (1 / denominator)
    let radius: number = o.Abs()
    let center: Vector3D = O + o
    return new Sphere()
  }

  ///  <summary>
  ///  Get 4 points on the sphere.
  ///  </summary>
  Get4Points(): Vector3D[] {
    let s: Sphere = this
    let rad: number = s.Radius
    let spherePoints: Vector3D[]
    if (s.IsPlane) {
      let perp: Vector3D = s.Normal.Perpendicular()
      let perp2: Vector3D = perp
      perp2.RotateAboutAxis(s.Normal, Math.PI / 2)
      spherePoints = [
        s.Offset,
        s.Offset + perp,
        s.Offset - perp,
        s.Offset + perp2,
      ]
    } else {
      spherePoints = [
        s.Center + new Vector3D(rad, 0, 0),
        s.Center + new Vector3D(rad * -1, 0, 0),
        s.Center + new Vector3D(0, rad, 0),
        s.Center + new Vector3D(0, 0, rad),
      ]
    }

    return spherePoints
  }

  ///  <summary>
  ///  Radially project a point onto our surface.
  ///  </summary>
  ProjectToSurface(p: Vector3D): Vector3D {
    if (this.IsPlane) {
      return Euclidean3D.ProjectOntoPlane(this.Normal, this.Offset, p)
    }

    let direction: Vector3D = p - this.Center
    direction.Normalize()
    direction = direction * this.Radius
    return this.Center + direction
  }

  ///  <summary>
  ///  Finds the intersection (a circle) between us and another sphere.
  ///  Returns null if sphere centers are coincident or no intersection exists.
  ///  Does not currently work for planes.
  ///  </summary>
  Intersection(s: Sphere): Circle3D {
    if (this.IsPlane || s.IsPlane) {
      throw new Error('Not implemented')
    }

    let r: number = s.Radius
    let R: number = this.Radius
    let diff: Vector3D = this.Center - s.Center
    let d: number = diff.Abs()
    if (Tolerance.Equal(d, r + R)) {
      diff.Normalize()
      return new Circle3D()
    }

    if (Tolerance.Zero(d) || d > r + R) {
      return null
    }

    //  Sphere's inside spheres and not touching.
    // if( d < Math.abs( R - r ) )
    //     return null;
    let x: number = (d * d + (r * r - R * R)) / (2 * d)
    let y: number = Math.Sqrt(r * r - x * x)
    let result: Circle3D = new Circle3D()
    diff.Normalize()
    result.Normal = diff
    result.Center = s.Center + diff * x
    result.Radius = y
    return result
  }

  ///  <summary>
  ///  Returns null if no intersection, or a Tuple.
  ///  Currently does not work in tangent case.
  ///  </summary>
  Intersection(c: Circle3D): System.Tuple<Vector3D, Vector3D> {
    let intersectionCircle: Circle3D = this.Intersection(new Sphere())
    if (intersectionCircle == null) {
      return null
    }

    let vCross: Vector3D = c.Normal.Cross(intersectionCircle.Normal)
    vCross.Normalize()
    vCross = vCross * intersectionCircle.Radius
    return new System.Tuple<Vector3D, Vector3D>(
      intersectionCircle.Center + vCross,
      intersectionCircle.Center - vCross,
    )
  }

  static RotateSphere(s: Sphere, axis: Vector3D, rotation: number) {
    if (s.IsPlane) {
      let o: Vector3D = s.Offset
      o.RotateAboutAxis(axis, rotation)
      s.Offset = o
    }

    let c: Vector3D = s.Center
    c.RotateAboutAxis(axis, rotation)
    s.Center = c
  }

  static ScaleSphere(s: Sphere, factor: number) {
    if (s.IsPlane) {
      s.Offset = s.Offset * factor
    } else {
      s.Center = s.Center * factor
      s.Radius = s.Radius * factor
    }
  }

  static TranslateSphere(s: Sphere, t: Vector3D) {
    if (s.IsPlane) {
      let offsetAlongNormal: Vector3D = Euclidean3D.ProjectOntoLine(
        s.Normal,
        new Vector3D(),
        t,
      )
      s.Offset = s.Offset + offsetAlongNormal
    } else {
      s.Center = s.Center + t
    }
  }
}
