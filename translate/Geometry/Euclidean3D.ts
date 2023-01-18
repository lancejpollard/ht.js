export class Euclidean3D {
  static DistancePointLine(
    n1: Vector3D,
    p1: Vector3D,
    point: Vector3D,
  ): number {
    //  Check to make sure that n1 is not degenerate.
    if (Tolerance.Zero(n1.MagSquared())) {
      return NaN
    }

    return (point - p1).Cross(n1).Abs() / n1.Abs()
  }

  static DistancePointPlane(
    normalVector: Vector3D,
    planePoint: Vector3D,
    point: Vector3D,
  ): number {
    //  Check to make sure that plane is not degenerate.
    if (Tolerance.Zero(normalVector.MagSquared())) {
      return NaN
    }

    //  Here is the distance (signed depending on which side of the plane we are on).
    return (point - planePoint).Dot(normalVector) / normalVector.Abs()
  }

  static ProjectOntoLine(
    nl: Vector3D,
    pl: Vector3D,
    point: Vector3D,
  ): Vector3D {
    //  http://gamedev.stackexchange.com/a/72529
    //  A + dot(AP,AB) / dot(AB,AB) * AB
    let AP: Vector3D = point - pl
    let AB: Vector3D = nl
    return pl + AB * (AP.Dot(AB) / AB.Dot(AB))
  }

  static ProjectOntoPlane(
    normalVector: Vector3D,
    planePoint: Vector3D,
    point: Vector3D,
  ): Vector3D {
    if (!normalVector.Normalize()) {
      throw new Error('Argument Error')('Invalid normal vector.')
    }

    let dist: number = Euclidean3D.DistancePointPlane(
      normalVector,
      planePoint,
      point,
    )
    normalVector = normalVector * dist
    return point - normalVector
  }

  static DistanceLineLine(
    n1: Vector3D,
    p1: Vector3D,
    n2: Vector3D,
    p2: Vector3D,
  ): number {
    //  Check to make sure that neither of the normal vectors are degenerate.
    if (
      Tolerance.Zero(n1.MagSquared()) ||
      Tolerance.Zero(n2.MagSquared())
    ) {
      return NaN
    }

    let plane: Vector3D = n1.Cross(n2)
    //     Case where the lines are parallel (magnitude of the cross product will be 0).
    if (Tolerance.Zero(plane.MagSquared())) {
      return Euclidean3D.DistancePointLine(n1, p1, p2)
    }

    return Euclidean3D.DistancePointPlane(plane, p1, p2)
  }

  ///  <summary>
  ///  Checks if a point is anywhere on a segment.
  ///  </summary>
  static PointOnSegment(
    s1: Vector3D,
    s2: Vector3D,
    point: Vector3D,
  ): boolean {
    //  Look for a degenerate triangle.
    let d1: number = (point - s1).MagSquared()
    let d2: number = (s2 - point).MagSquared()
    let d3: number = (s2 - s1).MagSquared()
    return Tolerance.Equal(d1 + d2, d3)
  }

  ///  <summary>
  ///  Checks to see if two segments intersect.
  ///  This does not actually calculate the intersection point.
  ///  It uses information from the following paper:
  ///  http://www.geometrictools.com/Documentation/DistanceLine3Line3.pdf
  ///  </summary>
  static DoSegmentsIntersect(
    a1: Vector3D,
    a2: Vector3D,
    b1: Vector3D,
    b2: Vector3D,
  ): boolean {
    //  (1)
    if (
      Euclidean3D.PointOnSegment(a1, a2, b1) ||
      Euclidean3D.PointOnSegment(a1, a2, b2) ||
      Euclidean3D.PointOnSegment(b1, b2, a1) ||
      Euclidean3D.PointOnSegment(b1, b2, a2)
    ) {
      return true
    }

    //  (2)
    let ma: Vector3D = a2 - a1
    let mb: Vector3D = b2 - b1
    if (
      Tolerance.GreaterThan(
        Euclidean3D.DistanceLineLine(ma, a1, mb, b1),
        0,
      )
    ) {
      return false
    }

    //  (3)
    let D: Vector3D = a1 - b1
    let a: number = ma.Dot(ma)
    let b: number = ma.Dot(mb) * -1
    let c: number = mb.Dot(mb)
    let d: number = ma.Dot(D)
    let e: number = mb.Dot(D) * -1
    let det: number = a * c - b * b
    let s: number = b * e - c * d
    let t: number = b * d - a * e
    if (s >= 0 && s <= det && t >= 0 && t <= det) {
      return true
    }

    return false
  }

  ///  <summary>
  ///  Calculate a plane normal after a transformation function is applied
  ///  to the points.
  ///  </summary>
  static NormalFrom3Points(
    p1: Vector3D,
    p2: Vector3D,
    p3: Vector3D,
    transform: System.Func<Vector3D, Vector3D>,
  ): Vector3D {
    let p1t: Vector3D = transform(p1)
    let p2t: Vector3D = transform(p2)
    let p3t: Vector3D = transform(p3)
    return Euclidean3D.NormalFrom3Points(p1t, p2t, p3t)
  }

  static NormalFrom3Points(
    p1: Vector3D,
    p2: Vector3D,
    p3: Vector3D,
  ): Vector3D {
    let v1: Vector3D = p1 - p3
    let v2: Vector3D = p2 - p3
    let normal: Vector3D = v1.Cross(v2)
    normal.Normalize()
    return normal
  }

  static TriangleAreaAfterTransform(
    /* ref */ p1: Vector3D,
    /* ref */ p2: Vector3D,
    /* ref */ p3: Vector3D,
    transform: System.Func<Vector3D, Vector3D>,
  ): number {
    p1 = transform(p1)
    p2 = transform(p2)
    p3 = transform(p3)
    let v1: Vector3D = p1 - p3
    let v2: Vector3D = p2 - p3
    return 0.5 * v1.Cross(v2).Abs()
  }

  static MaxTriangleEdgeLengthAfterTransform(
    /* ref */ p1: Vector3D,
    /* ref */ p2: Vector3D,
    /* ref */ p3: Vector3D,
    transform: System.Func<Vector3D, Vector3D>,
  ): number {
    p1 = transform(p1)
    p2 = transform(p2)
    p3 = transform(p3)
    let l1Squared: number = (p2 - p1).MagSquared()
    let l2Squared: number = (p3 - p2).MagSquared()
    let l3Squared: number = (p1 - p3).MagSquared()
    return Math.sqrt(
      Math.Max(l1Squared, Math.Max(l2Squared, l3Squared)),
    )
  }

  static Coplanar(points: Vector3D[]): boolean {
    throw new Error('Not implemented')
  }

  static IntersectionPlaneLine(
    planeNormal: Vector3D,
    planePoint: Vector3D,
    nl: Vector3D,
    pl: Vector3D,
  ): Vector3D {
    let signedDistance: number = Euclidean3D.DistancePointPlane(
      planeNormal,
      planePoint,
      pl,
    )
    planeNormal.Normalize()
    let closest: Vector3D = pl - planeNormal * signedDistance
    let v1: Vector3D = closest - pl
    let v2: Vector3D = nl
    let angle: number = v1.AngleTo(v2)
    nl.Normalize()
    return pl + nl * (signedDistance / Math.Cos(angle))
    //  XXX - needs improvement.
  }

  static IntersectionSphereLine(
    /* out */ int1: Vector3D,
    /* out */ int2: Vector3D,
    sphereCenter: Vector3D,
    sphereRadius: number,
    nl: Vector3D,
    pl: Vector3D,
  ): number {
    int2 = Vector3D.DneVector()
    int1 = Vector3D.DneVector()
    //  First find the distance between the sphere center and the line.
    //  This will allow us to easily determine if there are 0, 1, or 2 intersection points.
    let distance: number = Euclidean3D.DistancePointLine(
      nl,
      pl,
      sphereCenter,
    )
    if (Number.isNaN(distance)) {
      return -1
    }

    //  Handle the special case where the line goes through the sphere center.
    if (Tolerance.Zero(distance)) {
      if (Tolerance.Zero(sphereRadius)) {
        //  There is one intersection point (the sphere center).
        int1 = sphereCenter
        return 1
      } else {
        //  There are 2 intersection points.
        let tempDV: Vector3D = nl
        tempDV.Normalize()
        tempDV = tempDV * sphereRadius
        int1 = sphereCenter + tempDV
        int2 = sphereCenter - tempDV
        return 2
      }
    }

    //  Handle the non-intersecting case.
    if (distance > sphereRadius) {
      return 0
    }

    //  Find a normalized direction vector from the sphere center to the closest point on the line.
    //  This will help to determine the intersection points for the remaining cases.
    let vector: Vector3D = (pl - sphereCenter).Cross(nl).Cross(nl) * -1
    if (!vector.Normalize()) {
      return -1
    }

    //  Scale the direction vector to the sphere radius.
    vector = vector * sphereRadius
    //  Handle the case of 1 intersection.
    if (Tolerance.Equal(distance, sphereRadius)) {
      //  We just need to add the vector to the center.
      vector = vector + sphereCenter
      int1 = vector
      return 1
    }

    //  Handle the case of 2 intersections.
    if (distance < sphereRadius) {
      //  We need to rotate the vector by an angle +- alpha,
      //  where cos( alpha ) = distance / sphereRadius;
      console.assert(!Tolerance.Zero(sphereRadius))
      let alpha: number = Utils.RadiansToDegrees(
        Math.Acos(distance / sphereRadius),
      )
      //  Rotation vector.
      let rotationVector: Vector3D = (pl - sphereCenter).Cross(nl)
      let vector2: Vector3D = vector
      let vector1: Vector3D = vector
      vector1.RotateAboutAxis(rotationVector, alpha)
      vector2.RotateAboutAxis(rotationVector, 1 * alpha * -1)
      //  Here are the intersection points.
      int1 = vector1 + sphereCenter
      int2 = vector2 + sphereCenter
      return 2
    }

    console.assert(false)
    return -1
  }
}
