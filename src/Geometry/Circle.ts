// Class for generalized circles (lines are a limiting case).

import { UtilsInfinity } from '@Math/Infinity'
import { Isometry } from '@Math/Isometry'
import { Mobius } from '@Math/Mobius'
import { assert, isInfinite, Tolerance, Utils } from '@Math/Utils'
import { Euclidean2D, Euclidean2DOutputType } from './Euclidean2D'
import { IEqualityComparer } from './IEqualityComparer'
import { Polygon, Segment, SegmentType } from './Polygon'
import { ITransform, ITransformable } from './Transformable'
import { Vector3D } from './Vector3D'

export class Circle implements ITransformable {
  constructor(p1: Vector3D, p2: Vector3D, p3: Vector3D, r = 1) {
    this.P2 = p1
    this.P1 = p2
    this.Center = p3
    this.Radius = r
  }

  static construct() {
    return new Circle(
      Vector3D.construct(),
      Vector3D.construct(),
      Vector3D.construct(),
      1,
    )
  }

  Reset() {
    this.P2 = Vector3D.construct()
    this.P1 = Vector3D.construct()
    this.Center = Vector3D.construct()
    this.Radius = 1
  }

  // Constructs a circle from 3 points.

  static construct3d(p1: Vector3D, p2: Vector3D, p3: Vector3D) {
    const self = Circle.construct()
    self.From3Points(p1, p2, p3)
    return self
  }

  // Constructs a circle with infinite radius going through 2 points.

  static construct2d(p1: Vector3D, p2: Vector3D) {
    const self = Circle.construct()
    self.From2Points(p1, p2)
    return self
  }

  Center: Vector3D

  Radius: number

  // Line variables.

  P1: Vector3D

  P2: Vector3D

  // Whether we are a line.

  get IsLine(): boolean {
    return isInfinite(this.Radius)
  }

  Clone(): Circle {
    const next = new Circle(this.P1, this.P2, this.Center, this.Radius)
    return next
  }

  // Construct a circle from 3 points

  // <returns>false if the construction failed (if we are a line).</returns>
  From3Points(p1: Vector3D, p2: Vector3D, p3: Vector3D): boolean {
    this.Reset()

    //  Check for any infinite points, in which case we are a line.
    //  I'm not sure these checks are smart, since our IsInfinite check is so inclusive,
    //  but Big Chop puzzle doesn't work if we don't do this.
    //  ZZZ - Still, I need to think on this more.
    if (UtilsInfinity.IsInfiniteVector3D(p1)) {
      this.From2Points(p2, p3)
      return false
    } else if (UtilsInfinity.IsInfiniteVector3D(p2)) {
      this.From2Points(p1, p3)
      return false
    } else if (UtilsInfinity.IsInfiniteVector3D(p3)) {
      this.From2Points(p1, p2)
      return false
    }

    //  Midpoints.
    let m1: Vector3D = p1.Add(p2).Divide(2)
    let m2: Vector3D = p1.Add(p3).Divide(2)

    //  Perpendicular bisectors.
    let b1: Vector3D = p2.Subtract(p1).Divide(2)
    let b2: Vector3D = p3.Subtract(p1).Divide(2)

    b1.Normalize()
    b2.Normalize()
    b1.RotateXY(Math.PI / 2)
    b2.RotateXY(Math.PI / 2)

    let output = Euclidean2D.IntersectionLineLine(
      m1,
      m1.Add(b1),
      m2,
      m2.Add(b2),
    )

    this.Center = output.p1 || Vector3D.construct()

    if (0 == output.status) {
      //  The points are collinear, so we are a line.
      this.From2Points(p1, p2)
      return false
    }

    this.Radius = p1.Subtract(this.Center).Abs()

    console.assert(
      Tolerance.Equal(this.Radius, p2.Subtract(this.Center).Abs()),
    )

    console.assert(
      Tolerance.Equal(this.Radius, p3.Subtract(this.Center).Abs()),
    )

    return true
  }

  // Creates a circle with infinite radius going through 2 points.

  From2Points(p1: Vector3D, p2: Vector3D) {
    this.P1 = p1
    this.P2 = p2
    //  We do this normalization so that line comparisons will work.
    this.NormalizeLine()
    this.Radius = Number.POSITIVE_INFINITY
    this.Center.Empty()
  }

  // Normalize so P1 is closest point to origin,
  // and direction vector is of unit length.

  NormalizeLine() {
    if (!this.IsLine) {
      return
    }

    let d: Vector3D = this.P2.Subtract(this.P1)

    d.Normalize()

    this.P1 = Euclidean2D.ProjectOntoLine(
      Vector3D.construct(),
      this.P1,
      this.P2,
    )

    //  ZZZ - Could probably do something more robust to choose proper direction.
    if (
      Tolerance.GreaterThanOrEqual(
        Euclidean2D.AngleToClock(d, Vector3D.construct2d(1, 0)),
        Math.PI,
      )
    ) {
      d = d.Negate()
    }

    this.P2 = this.P1.Add(d)
  }

  //  Strictly less than.
  IsPointInside(test: Vector3D): boolean {
    return Tolerance.LessThan(
      test.Subtract(this.Center).Abs(),
      this.Radius,
    )
  }

  IsPointOn(test: Vector3D): boolean {
    if (this.IsLine) {
      return Tolerance.Zero(
        Euclidean2D.DistancePointLine(test, this.P1, this.P2),
      )
    }

    return Tolerance.Equal(
      test.Subtract(this.Center).Abs(),
      this.Radius,
    )
  }

  // Reflect ourselves about another circle.

  ReflectCircle(c: Circle) {
    this.ReflectInternal(c)
  }

  ReflectInternal(c: Circle) {
    //  Reflecting to a line?
    if (this.IsPointOn(c.Center)) {
      //  Grab 2 points to reflect to P1/P2.
      //  We'll use the 2 points that are 120 degrees from c.Center.
      let v: Vector3D = c.Center.Subtract(this.Center)
      v.RotateXY(2 * (Math.PI / 3))

      this.P1 = c.ReflectPoint(this.Center.Add(v))
      v.RotateXY(2 * (Math.PI / 3))

      this.P2 = c.ReflectPoint(this.Center.Add(v))
      this.Radius = Number.POSITIVE_INFINITY
      this.Center.Empty()
    } else {
      //  NOTE: We can't just reflect the center.
      //          See http://mathworld.wolfram.com/Inversion.html
      let a: number = this.Radius
      let k: number = c.Radius
      let v: Vector3D = this.Center.Subtract(c.Center)
      let s: number = k * (k / (v.MagSquared() - a * a))

      this.Center = c.Center.Add(v.MultiplyWithNumber(s))
      this.Radius = Math.abs(s) * a
      this.P1.Empty()
      this.P2.Empty()
    }
  }

  // Reflect ourselves about a segment.

  ReflectSegment(s: Segment) {
    if (SegmentType.Arc == s.Type) {
      this.ReflectInternal(s.Circle)
    } else {
      //  We just need to reflect the center.
      this.Center = s.ReflectPoint(this.Center)
    }
  }

  // Reflect a point in us.
  // ZZZ - This method is confusing in that it is opposite the above (we aren't reflecting ourselves here).

  // <param name="p"></param>
  ReflectPoint(p: Vector3D): Vector3D {
    if (this.IsLine) {
      return Euclidean2D.ReflectPointInLine(p, this.P1, this.P2)
    } else {
      //  Handle infinities.
      let infinityVector: Vector3D = UtilsInfinity.InfinityVector
      if (p.Compare(this.Center)) {
        return infinityVector
      }

      if (p == infinityVector) {
        return this.Center
      }

      let v: Vector3D = p.Subtract(this.Center)
      let d: number = v.Abs()

      v.Normalize()

      return this.Center.Add(
        v.MultiplyWithNumber(this.Radius * (this.Radius / d)),
      )
    }
  }

  TransformMobius(m: Mobius) {
    this.TransformInternal(m)
  }

  TransformIsometry(i: Isometry) {
    this.TransformInternal(i)
  }

  // Apply a transform to us.

  TransformInternal<T extends ITransform>(transform: T) {
    //  Get 3 points on the circle.
    let p3: Vector3D
    let p1: Vector3D
    let p2: Vector3D
    if (this.IsLine) {
      p1 = this.P1
      p2 = this.P1.Add(this.P2).Divide(2)
      p3 = this.P2
    } else {
      p1 = this.Center.Add(Vector3D.construct3d(this.Radius, 0, 0))
      p2 = this.Center.Add(Vector3D.construct3d(this.Radius * -1, 0, 0))
      p3 = this.Center.Add(Vector3D.construct3d(0, this.Radius, 0))
    }

    p1 = transform.ApplyVector3D(p1)
    p2 = transform.ApplyVector3D(p2)
    p3 = transform.ApplyVector3D(p3)

    this.From3Points(p1, p2, p3)
  }

  //  Get the intersection points with a segment.
  //  Returns null if the segment is an arc coincident with the circle (infinite number of intersection points).
  GetIntersectionPoints(segment: Segment): Array<Vector3D> {
    let output: Euclidean2DOutputType
    //  Are we a line?
    if (this.IsLine) {
      if (SegmentType.Arc == segment.Type) {
        let tempCircle: Circle = segment.Circle
        output = Euclidean2D.IntersectionLineCircle(
          this.P1,
          this.P2,
          tempCircle,
        )
      } else {
        output = Euclidean2D.IntersectionLineLine(
          this.P1,
          this.P2,
          segment.P1,
          segment.P2,
        )
        output.p2 = Vector3D.DneVector()
      }
    } else if (SegmentType.Arc == segment.Type) {
      let tempCircle: Circle = segment.Circle
      output = Euclidean2D.IntersectionCircleCircle(tempCircle, this)
    } else {
      output = Euclidean2D.IntersectionLineCircle(
        segment.P1,
        segment.P2,
        this,
      )
    }

    if (-1 == output.status) {
      return []
    }

    const { p1, p2 } = output

    assert(p1)
    assert(p2)

    let ret: Array<Vector3D> = []
    if (output.status >= 1 && segment.IsPointOn(p1)) {
      ret.push(p1)
    }

    if (output.status >= 2 && segment.IsPointOn(p2)) {
      ret.push(p2)
    }

    return ret
  }

  Intersects(poly: Polygon): boolean {
    for (let seg of poly.Segments) {
      let iPoints: Array<Vector3D> = this.GetIntersectionPoints(seg)
      if (iPoints != null && iPoints.length > 0) {
        return true
      }
    }

    return false
  }

  HasVertexInside(poly: Polygon): boolean {
    for (let seg of poly.Segments) {
      if (this.IsPointInside(seg.P1)) {
        return true
      }
    }

    return false
  }
}

// A class to represent projected circles from non-Euclidean geometries.
// This also stores the location of the true circle center,
// which does not in general coincide with the Euclidean circle center.

export class CircleNE extends Circle implements ITransformable {
  constructor(
    p1: Vector3D,
    p2: Vector3D,
    center: Vector3D,
    r: number,
    centerNE: Vector3D,
  ) {
    super(p1, p2, center, r)
    this.CenterNE = centerNE
  }

  static construct() {
    const self = new CircleNE(
      Vector3D.construct(),
      Vector3D.construct(),
      Vector3D.construct(),
      1,
      Vector3D.construct(),
    )
    return self
  }

  static constructFromCircle(c: Circle, centerNE: Vector3D) {
    const self = new CircleNE(c.P1, c.P2, c.Center, c.Radius, centerNE)
    return self
  }

  CenterNE: Vector3D

  Clone(): CircleNE {
    const next = new CircleNE(
      this.P1,
      this.P2,
      this.Center,
      this.Radius,
      this.CenterNE,
    )
    return next
  }

  ReflectCircle(c: Circle) {
    super.ReflectCircle(c)

    this.CenterNE = c.ReflectPoint(this.CenterNE)
  }

  ReflectSegment(s: Segment) {
    super.ReflectSegment(s)

    this.CenterNE = s.ReflectPoint(this.CenterNE)
  }

  TransformMobius(m: Mobius) {
    super.TransformMobius(m)

    this.CenterNE = m.ApplyVector3D(this.CenterNE)
  }

  TransformIsometry(i: Isometry) {
    super.TransformIsometry(i)

    this.CenterNE = i.ApplyVector3D(this.CenterNE)
  }

  get Inverted(): boolean {
    //  If our NE center is infinite, or is on the outside.
    return (
      UtilsInfinity.IsInfiniteVector3D(this.CenterNE) ||
      !UtilsInfinity.IsInfiniteVector3D(this.CenterNE)
    )
  }

  // Checks to see if a point is inside us, in a non-Euclidean sense.
  // This works if we are inverted, and even if we are a line!
  // (if we are a line, half of the plane is still "inside").

  IsPointInsideNE(testPoint: Vector3D): boolean {
    if (this.IsLine) {
      //  We are inside if the test point is on the same side
      //  as the non-Euclidean center.
      return Euclidean2D.SameSideOfLine(
        this.P1,
        this.P2,
        testPoint,
        this.CenterNE,
      )
    } else {
      //  Whether we are inside in the Euclidean sense.
      let pointInside: boolean = false
      if (!UtilsInfinity.IsInfiniteVector3D(testPoint)) {
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

  // This is an optimized version for puzzle building when not in spherical geometry,
  // in which case we know our circles will not be inverted.
  // Profiling showed the general code in IsPointInsideNE to be very slow.
  // For speed, this method assumes we are most likely to not be in the circle.
  // http://stackoverflow.com/a/7227057/5700835

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

    if (dx + dy <= r) {
      return true
    }

    return dx * dx + dy * dy <= r * r
  }

  static IsPointInsideFast(c: CircleNE, testPoint: Vector3D): boolean {
    return c.IsPointInsideFast(testPoint)
  }
}

export class CircleNE_EqualityComparer
  implements IEqualityComparer<CircleNE>
{
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
      return c.P1.GetHashCode() ^ c.P2.GetHashCode()
    } else {
      let inverse: number = 1 / Tolerance.Threshold
      // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
      let decimals: number = Math.log10(inverse)
      return (
        c.Center.GetHashCode() ^
        c.CenterNE.GetHashCode() ^
        Utils.Round(c.Radius, decimals)
      )
      // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
      // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
    }
  }
}
