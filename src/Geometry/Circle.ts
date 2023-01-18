///  <summary>
///  Class for generalized circles (lines are a limiting case).

import { Tolerance } from '@Math/Utils'
import { Euclidean2D } from './Euclidean2D'
import { Segment, SegmentType } from './Polygon'
import { ITransformable } from './Transformable'
import { Vector3D } from './Vector3D'

///  </summary>
export class Circle implements ITransformable {
  constructor() {
    this.Reset()
  }

  Reset() {
    this.P2 = new Vector3D()
    this.P1 = new Vector3D()
    this.Center = new Vector3D()
    this.Radius = 1
  }

  ///  <summary>
  ///  Constructs a circle from 3 points.
  ///  </summary>
  constructor(p1: Vector3D, p2: Vector3D, p3: Vector3D) {
    this.From3Points(p1, p2, p3)
  }

  ///  <summary>
  ///  Constructs a circle with infinite radius going through 2 points.
  ///  </summary>
  constructor(p1: Vector3D, p2: Vector3D) {
    this.From2Points(p1, p2)
  }

  Center: Vector3D

  Radius: number

  ///  <summary>
  ///  Line variables.
  ///  </summary>
  P1: Vector3D

  P2: Vector3D

  ///  <summary>
  ///  Whether we are a line.
  ///  </summary>
  get IsLine(): boolean {
    return number.IsInfinity(this.Radius)
  }

  Clone(): Circle {
    return MemberwiseClone()
  }

  ///  <summary>
  ///  Construct a circle from 3 points
  ///  </summary>
  ///  <returns>false if the construction failed (if we are a line).</returns>
  From3Points(p1: Vector3D, p2: Vector3D, p3: Vector3D): boolean {
    this.Reset()
    //  Check for any infinite points, in which case we are a line.
    //  I'm not sure these checks are smart, since our IsInfinite check is so inclusive,
    //  but Big Chop puzzle doesn't work if we don't do this.
    //  ZZZ - Still, I need to think on this more.
    if (isInfinite(p1)) {
      this.From2Points(p2, p3)
      return false
    } else if (isInfinite(p2)) {
      this.From2Points(p1, p3)
      return false
    } else if (isInfinite(p3)) {
      this.From2Points(p1, p2)
      return false
    }

    //  Midpoints.
    let m1: Vector3D = (p1 + p2) / 2
    let m2: Vector3D = (p1 + p3) / 2
    //  Perpendicular bisectors.
    let b1: Vector3D = (p2 - p1) / 2
    let b2: Vector3D = (p3 - p1) / 2
    b1.Normalize()
    b2.Normalize()
    b1.RotateXY(Math.PI / 2)
    b2.RotateXY(Math.PI / 2)
    let newCenter: Vector3D
    let found: number = Euclidean2D.IntersectionLineLine(
      m1,
      m1 + b1,
      m2,
      m2 + b2,
      /* out */ newCenter,
    )
    this.Center = newCenter
    if (0 == found) {
      //  The points are collinear, so we are a line.
      this.From2Points(p1, p2)
      return false
    }

    this.Radius = (p1 - this.Center).Abs()
    console.assert(
      Tolerance.Equal(this.Radius, (p2 - this.Center).Abs()),
    )
    console.assert(
      Tolerance.Equal(this.Radius, (p3 - this.Center).Abs()),
    )
    return true
  }

  ///  <summary>
  ///  Creates a circle with infinite radius going through 2 points.
  ///  </summary>
  From2Points(p1: Vector3D, p2: Vector3D) {
    this.P1 = p1
    this.P2 = p2
    //  We do this normalization so that line comparisons will work.
    this.NormalizeLine()
    this.Radius = Number.POSITIVE_INFINITY
    this.Center.Empty()
  }

  ///  <summary>
  ///  Normalize so P1 is closest point to origin,
  ///  and direction vector is of unit length.
  ///  </summary>
  NormalizeLine() {
    if (!this.IsLine) {
      return
    }

    let d: Vector3D = this.P2 - this.P1
    d.Normalize()
    this.P1 = Euclidean2D.ProjectOntoLine(
      new Vector3D(),
      this.P1,
      this.P2,
    )
    //  ZZZ - Could probably do something more robust to choose proper direction.
    if (
      Tolerance.GreaterThanOrEqual(
        Euclidean2D.AngleToClock(d, new Vector3D(1, 0)),
        Math.PI,
      )
    ) {
      d = d * -1
    }

    this.P2 = this.P1 + d
  }

  //  Strictly less than.
  IsPointInside(test: Vector3D): boolean {
    return Tolerance.LessThan((test - this.Center).Abs(), this.Radius)
  }

  IsPointOn(test: Vector3D): boolean {
    if (this.IsLine) {
      return Tolerance.Zero(
        Euclidean2D.DistancePointLine(test, this.P1, this.P2),
      )
    }

    return Tolerance.Equal((test - this.Center).Abs(), this.Radius)
  }

  ///  <summary>
  ///  Reflect ourselves about another circle.
  ///  </summary>
  Reflect(c: Circle) {
    this.ReflectInternal(c)
  }

  ReflectInternal(c: Circle) {
    //  Reflecting to a line?
    if (this.IsPointOn(c.Center)) {
      //  Grab 2 points to reflect to P1/P2.
      //  We'll use the 2 points that are 120 degrees from c.Center.
      let v: Vector3D = c.Center - this.Center
      v.RotateXY(2 * (Math.PI / 3))
      this.P1 = c.ReflectPoint(this.Center + v)
      v.RotateXY(2 * (Math.PI / 3))
      this.P2 = c.ReflectPoint(this.Center + v)
      this.Radius = Number.POSITIVE_INFINITY
      this.Center.Empty()
    } else {
      //  NOTE: We can't just reflect the center.
      //          See http://mathworld.wolfram.com/Inversion.html
      let a: number = this.Radius
      let k: number = c.Radius
      let v: Vector3D = this.Center - c.Center
      let s: number = k * (k / (v.MagSquared() - a * a))
      this.Center = c.Center + v * s
      this.Radius = Math.abs(s) * a
      this.P1.Empty()
      this.P2.Empty()
    }
  }

  ///  <summary>
  ///  Reflect ourselves about a segment.
  ///  </summary>
  Reflect(s: Segment) {
    if (SegmentType.Arc == s.Type) {
      this.ReflectInternal(s.Circle)
    } else {
      //  We just need to reflect the center.
      this.Center = s.ReflectPoint(this.Center)
    }
  }

  ///  <summary>
  ///  Reflect a point in us.
  ///  ZZZ - This method is confusing in that it is opposite the above (we aren't reflecting ourselves here).
  ///  </summary>
  ///  <param name="p"></param>
  ReflectPoint(p: Vector3D): Vector3D {
    if (this.IsLine) {
      return Euclidean2D.ReflectPointInLine(p, this.P1, this.P2)
    } else {
      //  Handle infinities.
      let infinityVector: Vector3D = Infinity.InfinityVector
      if (p.Compare(this.Center)) {
        return infinityVector
      }

      if (p == infinityVector) {
        return this.Center
      }

      let v: Vector3D = p - this.Center
      let d: number = v.Abs()
      v.Normalize()
      return this.Center + v * (this.Radius * (this.Radius / d))
    }
  }

  Transform(m: Mobius) {
    this.TransformInternal(m)
  }

  Transform(i: Isometry) {
    this.TransformInternal(i)
  }

  ///  <summary>
  ///  Apply a transform to us.
  ///  </summary>
  TransformInternal(transform: T) {
    //  Get 3 points on the circle.
    let p3: Vector3D
    let p1: Vector3D
    let p2: Vector3D
    if (this.IsLine) {
      p1 = this.P1
      p2 = (this.P1 + this.P2) / 2
      p3 = this.P2
    } else {
      p1 = this.Center + new Vector3D(this.Radius, 0, 0)
      p2 = this.Center + new Vector3D(this.Radius * -1, 0, 0)
      p3 = this.Center + new Vector3D(0, this.Radius, 0)
    }

    p1 = transform.Apply(p1)
    p2 = transform.Apply(p2)
    p3 = transform.Apply(p3)
    this.From3Points(p1, p2, p3)
  }

  //  Get the intersection points with a segment.
  //  Returns null if the segment is an arc coincident with the circle (infinite number of intersection points).
  GetIntersectionPoints(segment: Segment): Array<Vector3D> {
    let p2: Vector3D
    let p1: Vector3D
    let result: number
    //  Are we a line?
    if (this.IsLine) {
      if (SegmentType.Arc == segment.Type) {
        let tempCircle: Circle = segment.Circle
        result = Euclidean2D.IntersectionLineCircle(
          this.P1,
          this.P2,
          tempCircle,
          /* out */ p1,
          /* out */ p2,
        )
      } else {
        result = Euclidean2D.IntersectionLineLine(
          this.P1,
          this.P2,
          segment.P1,
          segment.P2,
          /* out */ p1,
        )
        p2 = Vector3D.DneVector()
      }
    } else if (SegmentType.Arc == segment.Type) {
      let tempCircle: Circle = segment.Circle
      result = Euclidean2D.IntersectionCircleCircle(
        tempCircle,
        this,
        /* out */ p1,
        /* out */ p2,
      )
    } else {
      result = Euclidean2D.IntersectionLineCircle(
        segment.P1,
        segment.P2,
        this,
        /* out */ p1,
        /* out */ p2,
      )
    }

    if (-1 == result) {
      return null
    }

    let ret: Array<Vector3D> = new Array<Vector3D>()
    if (result >= 1 && segment.IsPointOn(p1)) {
      ret.Add(p1)
    }

    if (result >= 2 && segment.IsPointOn(p2)) {
      ret.Add(p2)
    }

    return ret.ToArray()
  }

  Intersects(poly: Polygon): boolean {
    for (let seg: Segment in poly.Segments) {
      let iPoints: Array<Vector3D> = this.GetIntersectionPoints(seg)
      if (iPoints != null && iPoints.Length > 0) {
        return true
      }
    }

    return false
  }

  HasVertexInside(poly: Polygon): boolean {
    for (let seg: Segment in poly.Segments) {
      if (this.IsPointInside(seg.P1)) {
        return true
      }
    }

    return false
  }
}

///  <summary>
///  A class to represent projected circles from non-Euclidean geometries.
///  This also stores the location of the true circle center,
///  which does not in general coincide with the Euclidean circle center.
///  </summary>

export class CircleNE extends Circle implements ITransformable {
  // constructor() {}

  constructor(c: Circle, centerNE: Vector3D) {
    this.Center = c.Center
    this.Radius = c.Radius
    this.P1 = c.P1
    this.P2 = c.P2
    this.CenterNE = centerNE
  }

  CenterNE: Vector3D

  Clone(): CircleNE {
    return MemberwiseClone()
  }

  Reflect(c: Circle) {
    super.Reflect(c)
    this.CenterNE = c.ReflectPoint(this.CenterNE)
  }

  Reflect(s: Segment) {
    super.Reflect(s)
    this.CenterNE = s.ReflectPoint(this.CenterNE)
  }

  Transform(m: Mobius) {
    super.Transform(m)
    this.CenterNE = m.Apply(this.CenterNE)
  }

  Transform(i: Isometry) {
    super.Transform(i)
    this.CenterNE = i.Apply(this.CenterNE)
  }

  get Inverted(): boolean {
    //  If our NE center is infinite, or is on the outside.
    return isInfinite(this.CenterNE) || !IsPointInside(this.CenterNE)
  }

  ///  <summary>
  ///  Checks to see if a point is inside us, in a non-Euclidean sense.
  ///  This works if we are inverted, and even if we are a line!
  ///  (if we are a line, half of the plane is still "inside").
  ///  </summary>
  IsPointInsideNE(testPoint: Vector3D): boolean {
    if (this.IsLine) {
      //  We are inside if the test point is on the same side
      //  as the non-Euclidean center.
      return Euclidean2D.SameSideOfLine(
        P1,
        P2,
        testPoint,
        this.CenterNE,
      )
    } else {
      //  Whether we are inside in the Euclidean sense.
      let pointInside: boolean = false
      if (!isInfinite(testPoint)) {
        pointInside = this.IsPointInside(testPoint)
      }

      //  And in the Non-Euclidean sense.
      let inverted: boolean = this.Inverted
      return (!inverted && pointInside) || (inverted && !pointInside)
    }
  }

  static IsPointInsideNE(c: CircleNE, testPoint: Vector3D): boolean {
    return c.IsPointInsideNE(testPoint)
  }

  ///  <summary>
  ///  This is an optimized version for puzzle building when not in spherical geometry,
  ///  in which case we know our circles will not be inverted.
  ///  Profiling showed the general code in IsPointInsideNE to be very slow.
  ///  For speed, this method assumes we are most likely to not be in the circle.
  ///  http://stackoverflow.com/a/7227057/5700835
  ///  </summary>
  IsPointInsideFast(testPoint: Vector3D): boolean {
    let r: number = this.Radius
    let dx: number = Math.abs(testPoint.X - this.Center.X)
    if (dx > r) {
      return false
    }

    let dy: number = Math.abs(testPoint.Y - this.Center.Y)
    if (dy > r) {
      return false
    }

    if (dx + (dy <= r)) {
      return true
    }

    return dx * dx + (dy * dy <= r * r)
  }

  static IsPointInsideFast(c: CircleNE, testPoint: Vector3D): boolean {
    return c.IsPointInsideFast(testPoint)
  }
}

export class CircleNE_EqualityComparer extends IEqualityComparer<CircleNE> {
  //  ZZZ - I wonder if we want to do normalization of lines before comparing.
  Equals(c1: CircleNE, c2: CircleNE): boolean {
    let radiusEqual: boolean =
      Tolerance.Equal(c1.Radius, c2.Radius) ||
      (isInfinite(c1.Radius) && isInfinite(c2.Radius))

    if (c1.IsLine) {
      return c1.P1 == c2.P1 && c1.P2 == c2.P2 && radiusEqual
    } else {
      return (
        c1.Center == c2.Center &&
        c1.CenterNE == c2.CenterNE &&
        radiusEqual
      )
    }
  }

  GetHashCode(c: CircleNE): number {
    if (c.IsLine) {
      return c.P1.GetHashCode() | c.P2.GetHashCode()
    } else {
      let inverse: number = 1 / Tolerance.Threshold
      // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
      let decimals: number = Math.log10(inverse)
      return (
        c.Center.GetHashCode() |
        (c.CenterNE.GetHashCode() |
          Math.Round(c.Radius, decimals).GetHashCode())
      )
      // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
      // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
    }
  }
}
