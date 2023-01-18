import { Tolerance } from '@Math/Utils'
import { Circle } from './Circle'
import { Vector3D } from './Vector3D'

export class Euclidean2D {
  ///  <summary>
  ///  Returns the counterclock angle between two vectors (between 0 and 2*pi)
  ///  NOTE: A unique counter clockwise angle really only makes sense onces you've picked a plane normal direction.
  ///          So as coded, this function is really only intended to be used with 2D vector inputs.
  ///  </summary>
  static AngleToCounterClock(v1: Vector3D, v2: Vector3D): number {
    let angle: number = Math.atan2(v2.Y, v2.X) - Math.atan2(v1.Y, v1.X)
    if (angle < 0) {
      return angle + 2 * Math.PI
    }

    return angle
  }

  ///  <summary>
  ///  Returns the clockwise angle between two vectors (between 0 and 2*pi)
  ///  NOTE: A unique clockwise angle really only makes sense onces you've picked a plane normal direction.
  ///          So as coded, this function is really only intended to be used with 2D vector inputs.
  ///  </summary>
  static AngleToClock(v1: Vector3D, v2: Vector3D): number {
    let result: number = Euclidean2D.AngleToCounterClock(v1, v2)
    return 2 * Math.PI - result
  }

  static DistancePointLine(
    p: Vector3D,
    lineP1: Vector3D,
    lineP2: Vector3D,
  ): number {
    //  The line vector
    let v1: Vector3D = lineP2 - lineP1
    let lineMag: number = v1.Abs()
    if (Tolerance.Zero(lineMag)) {
      //  Line definition points are the same.
      console.assert(false)
      return NaN
    }

    let v2: Vector3D = p - lineP1
    let distance: number = v1.Cross(v2).Abs() / lineMag
    return distance
  }

  static ProjectOntoLine(
    p: Vector3D,
    lineP1: Vector3D,
    lineP2: Vector3D,
  ): Vector3D {
    let v1: Vector3D = lineP2 - lineP1
    let lineMag: number = v1.Abs()
    if (Tolerance.Zero(lineMag)) {
      console.assert(false)
      return new Vector3D()
    }

    v1.Normalize()
    let v2: Vector3D = p - lineP1
    let distanceAlongLine: number = v2.Dot(v1)
    return lineP1 + v1 * distanceAlongLine
  }

  static IntersectionLineLine(
    p1: Vector3D,
    p2: Vector3D,
    p3: Vector3D,
    p4: Vector3D,
    /* out */ intersection: Vector3D,
  ): number {
    intersection = new Vector3D()
    let n1: Vector3D = p2 - p1
    let n2: Vector3D = p4 - p3
    //  Intersect?
    //  XXX - Handle the case where lines are one and the same separately?
    //          (infinite interesection points)
    if (Tolerance.Zero(n1.Cross(n2).Abs())) {
      return 0
    }

    let d3: number = Euclidean2D.DistancePointLine(p3, p1, p2)
    let d4: number = Euclidean2D.DistancePointLine(p4, p1, p2)
    //  Distances on the same side?
    //  This tripped me up.
    let a3: number = Euclidean2D.AngleToClock(p3 - p1, n1)
    let a4: number = Euclidean2D.AngleToClock(p4 - p1, n1)

    const sameSide = a3 > Math.PI ? a4 > Math.PI : a4 <= Math.PI

    const factor = sameSide ? d3 / (d3 - d4) : d3 / (d3 + d4)
    intersection = p3 + n2 * factor
    //  XXX - Unfortunately, this is happening sometimes.
    if (
      !Tolerance.Zero(
        Euclidean2D.DistancePointLine(intersection, p1, p2),
      )
    ) {
      // console.assert( false );
    }

    return 1
  }

  static IntersectionCircleCircle(
    c1: Circle,
    c2: Circle,
    /* out */ p1: Vector3D,
    /* out */ p2: Vector3D,
  ): number {
    p1 = new Vector3D()
    p2 = new Vector3D()
    //  A useful page describing the cases in this function is:
    //  http://ozviz.wasp.uwa.edu.au/~pbourke/geometry/2circle/
    //  Maybe here now? http://paulbourke.net/geometry/circlesphere/
    //  Vector and distance between the centers.
    let v: Vector3D = c2.Center - c1.Center
    let d: number = v.Abs()
    let r1: number = c1.Radius
    let r2: number = c2.Radius
    //  Circle centers coincident.
    if (Tolerance.Zero(d)) {
      if (Tolerance.Equal(r1, r2)) {
        return -1
      } else {
        return 0
      }
    }

    //  We should be able to normalize at this point.
    if (!v.Normalize()) {
      console.assert(false)
      return 0
    }

    //  No intersection points.
    //  First case is disjoint circles.
    //  Second case is where one circle contains the other.
    if (
      Tolerance.GreaterThan(d, r1 + r2) ||
      Tolerance.LessThan(d, Math.abs(r1 - r2))
    ) {
      return 0
    }

    //  One intersection point.
    if (
      Tolerance.Equal(d, r1 + r2) ||
      Tolerance.Equal(d, Math.abs(r1 - r2))
    ) {
      p1 = c1.Center + v * r1
      return 1
    }

    //  There must be two intersection points.
    p2 = v * r1
    p1 = v * r1
    let temp: number = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
    let angle: number = Math.acos(temp / r1)
    console.assert(
      !Tolerance.Zero(angle) && !Tolerance.Equal(angle, Math.PI),
    )
    p1.RotateXY(angle)
    p2.RotateXY(angle * -1)
    p1 = p1 + c1.Center
    p2 = p2 + c1.Center
    return 2
  }

  static IntersectionLineCircle(
    lineP1: Vector3D,
    lineP2: Vector3D,
    circle: Circle,
    /* out */ p1: Vector3D,
    /* out */ p2: Vector3D,
  ): number {
    p1 = new Vector3D()
    p2 = new Vector3D()
    //  Distance from the circle center to the closest point on the line.
    let d: number = Euclidean2D.DistancePointLine(
      circle.Center,
      lineP1,
      lineP2,
    )
    //  No intersection points.
    let r: number = circle.Radius
    if (d > r) {
      return 0
    }

    //  One intersection point.
    p1 = Euclidean2D.ProjectOntoLine(circle.Center, lineP1, lineP2)
    if (Tolerance.Equal(d, r)) {
      return 1
    }

    //  Two intersection points.
    //  Special case when the line goes through the circle center,
    //  because we can see numerical issues otherwise.
    //
    //  I had further issues where my default tolerance was too strict for this check.
    //  The line was close to going through the center and the second block was used,
    //  so I had to loosen the tolerance used by my comparison macros.
    if (Tolerance.Zero(d)) {
      let line: Vector3D = lineP2 - lineP1
      line.Normalize()
      line = line * r
      p1 = circle.Center + line
      p2 = circle.Center - line
    } else {
      //  To origin.
      p1 = p1 - circle.Center
      p1.Normalize()
      p1 = p1 * r
      p2 = p1
      let angle: number = Math.acos(d / r)
      p1.RotateXY(angle)
      p2.RotateXY(angle * -1)
      //  Back out.
      p1 = p1 + circle.Center
      p2 = p2 + circle.Center
    }

    return 2
  }

  ///  <summary>
  ///  Reflects a point in a line defined by two points.
  ///  </summary>
  static ReflectPointInLine(
    input: Vector3D,
    p1: Vector3D,
    p2: Vector3D,
  ): Vector3D {
    let p: Vector3D = Euclidean2D.ProjectOntoLine(input, p1, p2)
    return input + (p - input) * 2
  }

  static SameSideOfLine(
    lineP1: Vector3D,
    lineP2: Vector3D,
    test1: Vector3D,
    test2: Vector3D,
  ): boolean {
    let d: Vector3D = lineP2 - lineP1
    let t1: Vector3D = (test1 - lineP1).Cross(d)
    let t2: Vector3D = (test2 - lineP1).Cross(d)
    let pos1: boolean = t1.Z > 0
    let pos2: boolean = t2.Z > 0
    return !(pos1 | pos2)
    // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
  }
}
