import { UtilsInfinity } from '@Math/Infinity'
import { Isometry } from '@Math/Isometry'
import { Matrix4D } from '@Math/Matrix4D'
import { Mobius } from '@Math/Mobius'
import { Tolerance, Utils } from '@Math/Utils'
import _ from 'lodash'
import { Circle, CircleNE } from './Circle'
import { Euclidean2D } from './Euclidean2D'
import { Euclidean3D } from './Euclidean3D'
import { Geometry } from './Geometry'
import { Geometry2D } from './Geometry2D'
import { ITransform, ITransformable } from './Transformable'
import { Vector3D } from './Vector3D'

export class Polygon implements ITransformable {
  constructor() {
    this.Segments = new Array<Segment>()
    this.Center = Vector3D.construct()
  }

  Center: Vector3D

  Segments: Array<Segment>

  ///  <summary>
  ///  Create a new polygon from a set of points.
  ///  Line segments will be used.
  ///  </summary>
  static FromPoints(points: Array<Vector3D>): Polygon {
    let result: Polygon = new Polygon()
    for (let i: number = 0; i < points.length; i++) {
      let idx1: number = i
      let idx2: number = i == points.length - 1 ? 0 : i + 1
      let newSeg: Segment = Segment.Line(points[idx1], points[idx2])
      result.Segments.push(newSeg)
    }

    result.Center = result.CentroidApprox
    return result
  }

  Clear() {
    this.Segments.length = 0
  }

  Clone(): Polygon {
    let newPoly: Polygon = new Polygon()
    // newPoly.Segments = new Array<Segment>( Segments );
    for (let s of this.Segments) {
      newPoly.Segments.push(s.Clone())
    }

    newPoly.Center = this.Center.Clone()
    return newPoly
  }

  CreateRegular(p: number, q: number) {
    this.Clear()

    let points: Array<Vector3D> = []
    let g: Geometry = Geometry2D.GetGeometry(p, q)
    let circumRadius: number = Geometry2D.GetNormalizedCircumRadius(
      p,
      q,
    )

    let angle: number = 0

    for (let i: number = 0; i < p; i++) {
      let point: Vector3D = Vector3D.construct()
      point.X = circumRadius * Math.cos(angle)
      point.Y = circumRadius * Math.sin(angle)
      points.push(point)
      angle = angle + Utils.DegreesToRadians(360 / p)
    }

    //  Turn this into segments.
    for (let i: number = 0; i < points.length; i++) {
      let idx1: number = i
      let idx2: number = i == points.length - 1 ? 0 : i + 1

      let newSegment: Segment = new Segment()
      newSegment.P1 = points[idx1]
      newSegment.P2 = points[idx2]

      if (g != Geometry.Euclidean) {
        newSegment.Type = SegmentType.Arc
        if (2 == p) {
          const factor = Math.tan(Math.PI / 6)

          newSegment.Center =
            newSegment.P1.X > 0
              ? Vector3D.construct3d(
                  0,
                  -circumRadius,
                  0,
                ).MultiplyWithNumber(factor)
              : Vector3D.construct3d(
                  0,
                  circumRadius,
                  0,
                ).MultiplyWithNumber(factor)
        } else {
          //  Our segments are arcs in Non-Euclidean geometries.
          //  Magically, the same formula turned out to work for both.
          //  (Maybe this is because the Poincare Disc model of the
          //  hyperbolic plane is stereographic projection as well).
          const piq = q == -1 ? 0 : Math.PI / q // Handle q infinite.
          //  Handle q infinite.
          let t1: number = Math.PI / p
          let t2: number = Math.PI / 2 - piq - t1
          let factor: number = (Math.tan(t1) / Math.tan(t2) + 1) / 2
          newSegment.Center = newSegment.P1.Add(
            newSegment.P2,
          ).MultiplyWithNumber(factor)
        }

        newSegment.Clockwise = Geometry.Spherical == g ? false : true
      }

      //  XXX - Make this configurable?
      //  This is the color of cell boundary lines.
      // newSegment.m_color = CColor( 1, 1, 0, 1 );
      this.Segments.push(newSegment)
    }
  }

  static InteriorAngle(n: number): number {
    return Utils.DegreesToRadians((n - 2) * (180 / n))
  }

  ///  <summary>
  ///  Create a euclidean polygon with n points,
  ///  centered at the origin with the first vertex on the x axis.
  ///  </summary>
  static CreateEuclidean(n: number): Polygon {
    let polyPoints: Array<Vector3D> = []
    let centralAngle: number = 2 * (Math.PI / n)

    for (let i: number = 0; i < n; i++) {
      let v: Vector3D = Vector3D.construct2d(1, 0)
      v.RotateXY(centralAngle * i)
      polyPoints.push(v)
    }

    let poly: Polygon = new Polygon()
    poly.CreateEuclidean(polyPoints)
    return poly
  }

  static CreateEuclideanWithNormal(
    n: number,
    p1: Vector3D,
    p2: Vector3D,
    normal: Vector3D,
  ): Polygon {
    let polyPoints: Array<Vector3D> = new Array<Vector3D>()
    let centralAngle: number = 2 * (Math.PI / n)
    let direction: Vector3D = p2.Subtract(p1)

    direction.RotateAboutAxis(normal, Math.PI / 2)
    direction.Normalize()

    let dist: number = p2.Subtract(p1).Abs() / 2 / Math.tan(Math.PI / n)
    let center: Vector3D = p1
      .Add(p2.Subtract(p1))
      .Divide(2)
      .Add(direction.MultiplyWithNumber(dist))

    for (let i: number = 0; i < n; i++) {
      let v: Vector3D = p1.Subtract(center)
      v.RotateAboutAxis(normal, centralAngle * i)
      v = v.Add(center)
      polyPoints.push(v)
    }

    let poly: Polygon = new Polygon()
    poly.CreateEuclidean(polyPoints)
    return poly
  }

  ///  <summary>
  ///  Create a Euclidean polygon from a set of points.
  ///  NOTE: Do not include starting point twice.
  ///  </summary>
  CreateEuclidean(points: Array<Vector3D>) {
    this.Segments.length = 0

    for (let i: number = 0; i < points.length; i++) {
      let idx1: number = i
      let idx2: number = i + 1
      if (idx2 == points.length) {
        idx2 = 0
      }

      let newSeg: Segment = Segment.Line(points[idx1], points[idx2])
      this.Segments.push(newSeg)
    }

    this.Center = this.CentroidApprox
  }

  get NumSides(): number {
    return this.Segments.length
  }

  get Length(): number {
    let totalLength: number = 0
    for (let i: number = 0; i < this.NumSides; i++) {
      let s: Segment = this.Segments[i]
      //  ZZZ
      // if( s.valid() )
      totalLength = totalLength + s.Length
    }

    return totalLength
  }

  ///  <summary>
  ///  Find a centroid of the polygon.
  ///  This is not fully accurate for arcs yet.
  ///  </summary>
  get CentroidApprox(): Vector3D {
    let average: Vector3D = Vector3D.construct()
    for (let i: number = 0; i < this.NumSides; i++) {
      //  NOTE: This is not fully accurate for arcs (using midpoint instead of true centroid).
      //          This was done on purpose in MagicTile v1, to help avoid drawing overlaps.
      //          (it biases the calculated centroid towards large arcs.)
      let s: Segment = this.Segments[i]
      //  ZZZ
      // if( s.valid() )
      average = average.Add(s.Midpoint.MultiplyWithNumber(s.Length))
    }

    this.Length
    return average
  }

  get Normal(): Vector3D {
    return this.NormalAfterTransform(v => v)
  }

  ///  <summary>
  ///  Calculate a normal after a transformation function is applied
  ///  to the points of the polygon.
  ///  </summary>
  NormalAfterTransform(transform: (v: Vector3D) => Vector3D): Vector3D {
    if (this.NumSides < 1) {
      return Vector3D.construct3d(0, 0, 1)
    }

    return Euclidean3D.NormalFrom3PointsWithTransform(
      this.Segments[0].P1,
      this.Segments[0].P2,
      this.Center,
      transform,
    )
  }

  ///  <summary>
  ///  Returns only the vertices of the polygon.
  ///  </summary>
  get Vertices(): Array<Vector3D> {
    let points: Array<Vector3D> = new Array<Vector3D>()
    for (let s of this.Segments) {
      points.push(s.P1)
    }

    return points
  }

  ///  <summary>
  ///  Returns all edge midpoints of the polygon.
  ///  </summary>
  get EdgeMidpoints(): Array<Vector3D> {
    let points: Array<Vector3D> = new Array<Vector3D>()
    for (let s of this.Segments) {
      points.push(s.Midpoint)
    }

    return points
  }

  get EdgePoints(): Array<Vector3D> {
    let points: Array<Vector3D> = new Array<Vector3D>()
    let arcResolution: number = Utils.DegreesToRadians(4.5)
    for (let i: number = 0; i < this.NumSides; i++) {
      let s: Segment = this.Segments[i]
      //  First point.
      //  ZZZ - getting lazy
      // console.assert( ! (UtilsInfinity.IsInfiniteVector3D( s.m_p1 ) && UtilsInfinity.IsInfiniteVector3D( s.m_p2 )) );
      const p1: Vector3D = UtilsInfinity.IsInfiniteVector3D(s.P1)
        ? s.P2.MultiplyWithNumber(UtilsInfinity.FiniteScale)
        : s.P1
      points.push(p1)
      //  For arcs, add in a bunch of extra points.
      if (SegmentType.Arc == s.Type) {
        let maxAngle: number = s.Angle
        let vs: Vector3D = s.P1.Subtract(s.Center)
        let numSegments: number = maxAngle / arcResolution
        if (numSegments < 10) {
          numSegments = 10
        }

        let angle: number = maxAngle / numSegments
        for (let j: number = 1; j < numSegments; j++) {
          vs.RotateXY(s.Clockwise ? -angle : angle)
          points.push(vs.Add(s.Center))
        }
      }

      //  Last point.
      const p2: Vector3D = UtilsInfinity.IsInfiniteVector3D(s.P2)
        ? s.P1.MultiplyWithNumber(UtilsInfinity.FiniteScale)
        : s.P2
      points.push(p2)
    }

    return points
  }

  ///  <summary>
  ///  Returns true if CCW, false if CW.
  ///  NOTE: only makes sense for 2D polygons.
  ///  </summary>
  get Orientation(): boolean {
    let sArea: number = this.SignedArea
    return sArea > 0
  }

  get SignedArea(): number {
    //  Calculate the signed area.
    //  ZZZ - I'm doing arcs piecemiel at this point.  Maybe there is a better way.
    let sArea: number = 0
    let edgePoints: Array<Vector3D> = this.EdgePoints
    for (let i: number = 0; i < edgePoints.length; i++) {
      let v1: Vector3D = edgePoints[i]
      let v2: Vector3D =
        edgePoints[i == edgePoints.length - 1 ? 0 : i + 1]
      sArea += v1.X * v2.Y - v1.Y * v2.X
    }

    sArea /= 2
    return sArea
  }

  get CircumCircle(): CircleNE {
    let result: CircleNE = CircleNE.construct()

    if (this.Segments.length > 2) {
      result.From3Points(
        this.Segments[0].P1,
        this.Segments[1].P1,
        this.Segments[2].P1,
      )
    }

    result.CenterNE = this.Center
    return result
  }

  get InCircle(): CircleNE {
    let result: CircleNE = CircleNE.construct()

    if (this.Segments.length > 2) {
      result.From3Points(
        this.Segments[0].Midpoint,
        this.Segments[1].Midpoint,
        this.Segments[2].Midpoint,
      )
    }

    result.CenterNE = this.Center
    return result
  }

  Reverse() {
    //  Reverse all our segments and swap the order of them.
    for (let s of this.Segments) {
      s.Reverse()
    }

    this.Segments.reverse()
  }

  ///  <summary>
  ///  This will reorder our segments (in a CW sense).
  ///  NOTE: The center will not be recalculated.
  ///  </summary>
  Cycle(num: number) {
    if (num < 0 || num > this.NumSides) {
      throw new Error('Cycle called with invalid input.')
    }

    for (let i: number = 0; i < num; i++) {
      //  Move the first to the last (like a CW rotation).
      let first: Segment = this.Segments[0]
      this.Segments.unshift()
      this.Segments.push(first)
    }
  }

  Reflect(s: Segment) {
    //  Just reflect all our segments.
    for (let i: number = 0; i < this.Segments.length; i++) {
      this.Segments[i].Reflect(s)
    }

    this.Center = s.ReflectPoint(this.Center)
  }

  ///  <summary>
  ///  Apply a Mobius transform to us.
  ///  </summary>
  TransformMobius(m: Mobius) {
    for (let s of this.Segments) {
      s.TransformMobius(m)
    }

    this.Center = m.ApplyVector3D(this.Center)
  }

  ///  <summary>
  ///  Apply an isometry to us.
  ///  </summary>
  TransformIsometry(isometry: Isometry) {
    for (let s of this.Segments) {
      s.TransformIsometry(isometry)
    }

    this.Center = isometry.ApplyVector3D(this.Center)
  }

  ///  <summary>
  ///  Apply a Euclidean translation to us.
  ///  </summary>
  Translate(v: Vector3D) {
    for (let s of this.Segments) {
      s.Translate(v)
    }

    this.Center = this.Center.Add(v)
  }

  ///  <summary>
  ///  Apply a Euclidean rotation to us.
  ///  </summary>
  Rotate(m: Matrix4D) {
    for (let s of this.Segments) {
      s.Rotate(m)
    }

    this.Center = m.RotateVector(this.Center)
  }

  ///  <summary>
  ///  Euclidean scale us.
  ///  </summary>
  Scale(factor: number) {
    for (let s of this.Segments) {
      s.Scale(this.Center, factor)
    }
  }

  ///  <summary>
  ///  Gets the intersection points between us and a generalized circle.
  ///  </summary>
  GetIntersectionPoints(line: Circle): Array<Vector3D> {
    let iPoints: Array<Vector3D> = new Array<Vector3D>()
    for (let i: number = 0; i < this.NumSides; i++) {
      iPoints.push(...line.GetIntersectionPoints(this.Segments[i]))
    }

    return iPoints
  }

  ///  <summary>
  ///  Attempts to return true if the polygon center is not inside the polygon.
  ///  This is used in spherical case, and currently has some hardcoded hacks
  ///  to make it work better.
  ///  </summary>
  get IsInverted(): boolean {
    //  This is a hack to simply ignore a little more than one complete hemisphere of the spherical surface.
    //  (and all of the Poincare disk).
    let factor: number = 1.5
    //  Magic tunable number :(
    if (this.Center.Abs() < Geometry2D.DiskRadius * factor) {
      return false
    }

    if (UtilsInfinity.IsInfiniteVector3D(this.Center)) {
      return true
    }

    let inverted: boolean = !this.IsPointInside(this.Center)
    if (!inverted) {
      return inverted
    }

    //  We think we're inverted.
    //  However, we've been have too many inverted false positives here!
    //  ZZZ - hack! hack! (The correct thing would be for the IsPointInside function to work robustly.)
    //  We'll try two more times, and let the majority win (only need one more vote).
    //  Since not many polygons will actually make it here, these extra calculations are ok.
    //  It does seem to help a lot.
    let ray: Circle = Circle.construct()
    ray.From2Points(
      this.Center,
      this.Center.Add(Vector3D.construct2d(103, 10007)),
    )
    if (!this.IsPointInsideWithRay(this.Center, ray)) {
      return true
    }

    ray.From2Points(
      this.Center,
      this.Center.Add(Vector3D.construct2d(7001, 7993)),
    )
    return !this.IsPointInsideWithRay(this.Center, ray)
  }

  ///  <summary>
  ///  Try not to use this.
  ///  See IsInverted method about this HACK.
  ///  ZZZ - Need to find a better way to make IsPointInside more robust :(
  ///  </summary>
  IsPointInsideParanoid(p: Vector3D): boolean {
    let insideCount: number = 0
    let ray: Circle = Circle.construct()
    if (this.IsPointInside(p)) {
      insideCount++
    }

    ray.From2Points(p, p.Add(Vector3D.construct2d(103, 10007)))
    if (this.IsPointInsideWithRay(p, ray)) {
      insideCount++
    }

    ray.From2Points(p, p.Add(Vector3D.construct2d(7001, 7993)))
    if (this.IsPointInsideWithRay(p, ray)) {
      insideCount++
    }

    return insideCount >= 2
  }

  ///  <summary>
  ///  Warning, this suffers from FP tolerance issues,
  ///  when the polygon has arc segments with very large radii (for instance).
  ///  </summary>
  IsPointInside(p: Vector3D): boolean {
    //  ZZZ - Our "ray" will be half a circle for now.
    //          (We'll throw out intersections where x <= p.X)
    let ray: Circle = Circle.construct()
    // ray.From3Points( p + new Vector3D( -500, 1 ), p, p + new Vector3D( 500, 1 ) );        // Circle was too huge (r ~= 125000), which caused tolerance issues.
    // ray.From3Points( p + new Vector3D( -103, 1 ), p, p + new Vector3D( 193, 1 ) );        // primes! (r ~= 10000)  Still suffering
    ray.From2Points(p, p.Add(Vector3D.construct2d(10007, 103)))
    //  Best, but still not perfect.
    return this.IsPointInsideWithRay(p, ray)
  }

  ///  <summary>
  ///  Warning, this suffers from FP tolerance issues,
  ///  when the polygon has arc segments with very large radii (for instance).
  ///  </summary>
  IsPointInsideWithRay(p: Vector3D, ray: Circle): boolean {
    //  We use the ray casting since that will work for arcs as well.
    //  NOTE: This impl is known to not be fully general yet,
    //          since some issues won't arise in MagicTile.
    //          See http://en.wikipedia.org/wiki/Point_in_polygon about
    //          some of the degenerate cases that are possible.
    if (Tolerance.Zero(p.MagSquared())) {
      return true
    }

    //  Get all of the the boundary intersection points.
    let iPoints: Array<Vector3D> = this.GetIntersectionPoints(ray)
    //  Keep only the positive, distinct ones.
    iPoints = _.uniqBy(
      iPoints.filter(v => v.X > p.X),
      //  Argh, between a rock and a hard place.
      //  Making this smaller causes issues, making this bigger causes issues.
      v => v.GetHashCodeWithTolerance(0.0001),
    )
    //  Even number of intersection points means we're outside, odd means inside
    let inside: boolean = Utils.Odd(iPoints.length)
    return inside
  }

  GetHashCode(): string {
    const array: Array<string> = []

    for (let v of this.Vertices) {
      array.push(v.GetHashCode())
    }

    // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
    return array.join(':')
  }
}

export class Segment implements ITransformable {
  Type?: SegmentType

  P1: Vector3D

  P2: Vector3D

  //  These only apply to arc segments.
  Center: Vector3D

  Clockwise: boolean

  constructor() {
    this.P1 = Vector3D.construct()
    this.P2 = Vector3D.construct()
    this.Center = Vector3D.construct()
    this.Clockwise = false
  }

  Clone(): Segment {
    let newSeg: Segment = new Segment()
    newSeg.Type = this.Type
    newSeg.P1 = this.P1.Clone()
    newSeg.P2 = this.P2.Clone()
    newSeg.Center = this.Center.Clone()
    newSeg.Clockwise = this.Clockwise
    return newSeg
  }

  static Line(start: Vector3D, end: Vector3D): Segment {
    let newSeg: Segment = new Segment()
    newSeg.Type = SegmentType.Line
    newSeg.P1 = start
    newSeg.P2 = end
    return newSeg
  }

  static ArcWithClockwise(
    start: Vector3D,
    end: Vector3D,
    center: Vector3D,
    clockwise: boolean,
  ): Segment {
    let newSeg: Segment = new Segment()
    newSeg.Type = SegmentType.Arc
    newSeg.P1 = start
    newSeg.P2 = end
    newSeg.Center = center
    newSeg.Clockwise = clockwise
    return newSeg
  }

  static Arc(start: Vector3D, mid: Vector3D, end: Vector3D): Segment {
    let newSeg: Segment = new Segment()
    newSeg.Type = SegmentType.Arc
    newSeg.P1 = start
    newSeg.P2 = end
    let c: Circle = Circle.construct()
    c.From3Points(start, mid, end)
    newSeg.Center = c.Center
    //  Obtain vectors from center point of circle (as if at the origin)
    let startOrigin: Vector3D = start.Subtract(c.Center)
    let midOrigin: Vector3D = mid.Subtract(c.Center)
    let endOrigin: Vector3D = end.Subtract(c.Center)
    //  Calculate the normal vector and angle to traverse.
    //  ZZZ - worry about failure of cross product here.
    let normalVector: Vector3D = startOrigin.Cross(endOrigin)
    newSeg.Clockwise = normalVector.Z < 0
    let angleToTraverse: number = startOrigin.AngleTo(endOrigin)
    //  The normal vector might need to be reversed and the angleToTraverse adjusted.
    //  This happens depending on the location of the midpoint relative to the start and end points.
    let compareAngle: number =
      startOrigin.AngleTo(midOrigin) + midOrigin.AngleTo(endOrigin)
    let reverse: boolean = !Tolerance.Equal(
      angleToTraverse,
      compareAngle,
    )

    if (reverse) {
      newSeg.Clockwise = !newSeg.Clockwise
    }

    return newSeg
  }

  get Radius(): number {
    console.assert(SegmentType.Arc == this.Type)
    return this.P1.Subtract(this.Center).Abs()
  }

  get Angle(): number {
    if (SegmentType.Arc != this.Type) {
      console.assert(false)
      return 0
    }

    let v1: Vector3D = this.P1.Subtract(this.Center)
    let v2: Vector3D = this.P2.Subtract(this.Center)

    return this.Clockwise
      ? Euclidean2D.AngleToClock(v1, v2)
      : Euclidean2D.AngleToCounterClock(v1, v2)
  }

  get Circle(): Circle {
    console.assert(SegmentType.Arc == this.Type)
    //  Avoiding allocations of new circles,
    //  (Memory profiling showed this was responsible
    //  for many allocations.)
    if (this.m_circle != null) {
      if (
        this.m_circle.Center.Equals(this.Center) &&
        this.m_circle.Radius === this.Radius
      ) {
        return this.m_circle
      }
    }

    this.m_circle = Circle.construct()
    this.m_circle.Center = this.Center
    this.m_circle.Radius = this.Radius

    return this.m_circle
  }

  m_circle?: Circle

  get Length(): number {
    if (SegmentType.Arc == this.Type) {
      return this.Radius * this.Angle
    } else {
      return this.P2.Subtract(this.P1).Abs()
    }
  }

  get Midpoint(): Vector3D {
    if (SegmentType.Arc == this.Type) {
      let a: number = this.Angle / 2
      let ret: Vector3D = this.P1.Subtract(this.Center)
      ret.RotateXY(this.Clockwise ? -a : a)
      ret = ret.Add(this.Center)
      return ret
    } else {
      return this.P1.Add(this.P2).Divide(2)
    }
  }

  Reverse() {
    this.SwapPoints()
    if (SegmentType.Arc == this.Type) {
      this.Clockwise = !this.Clockwise
    }
  }

  ///  <summary>
  ///  Return the vertices from subdividing ourselves.
  ///  </summary>
  Subdivide(numSegments: number): Array<Vector3D> {
    let ret: Array<Vector3D> = []

    if (numSegments < 1) {
      console.assert(false)
      return ret
    }

    if (this.Type == SegmentType.Arc) {
      let v: Vector3D = this.P1.Subtract(this.Center)
      let angle: number = this.Angle / numSegments
      for (let i: number = 0; i < numSegments; i++) {
        ret.push(this.Center.Add(v))
        v.RotateXY(this.Clockwise ? -angle : angle)
      }
    } else {
      let v: Vector3D = this.P2.Subtract(this.P1)
      v.Normalize()
      for (let i: number = 0; i < numSegments; i++) {
        ret.push(
          this.P1.Add(v).MultiplyWithNumber(
            i * (this.Length / numSegments),
          ),
        )
      }
    }

    //  Add in the last point and return.
    ret.push(this.P2)
    return ret
  }

  SwapPoints() {
    let t: Vector3D = this.P1
    this.P1 = this.P2
    this.P2 = t
  }

  IsPointOn(test: Vector3D): boolean {
    return SegmentType.Arc == this.Type
      ? Segment.PointOnArcSegment(test, this)
      : Segment.PointOnLineSegment(test, this)
  }

  static PointOnArcSegment(p: Vector3D, seg: Segment): boolean {
    let maxAngle: number = seg.Angle
    let v1: Vector3D = seg.P1.Subtract(seg.Center)
    let v2: Vector3D = p.Subtract(seg.Center)
    if (!Tolerance.Equal(v1.Abs(), v2.Abs())) {
      return false
    }

    const angle = seg.Clockwise
      ? Euclidean2D.AngleToClock(v1, v2)
      : Euclidean2D.AngleToCounterClock(v1, v2)

    return Tolerance.LessThanOrEqual(angle, maxAngle)
  }

  static PointOnLineSegment(p: Vector3D, seg: Segment): boolean {
    //  This will be so if the point and the segment ends represent
    //  the vertices of a degenerate triangle.
    let d1: number = seg.P2.Subtract(seg.P1).Abs()
    let d2: number = p.Subtract(seg.P1).Abs()
    let d3: number = seg.P2.Subtract(p).Abs()
    return Tolerance.Equal(d1, d2 + d3)
  }

  Reflect(s: Segment) {
    //  NOTES:
    //  Arcs can go to lines, and lines to arcs.
    //  Rotations may reverse arc directions as well.
    //  Arc centers can't be transformed directly.
    //  NOTE: We must calc this before altering the endpoints.
    let mid: Vector3D = this.Midpoint
    if (UtilsInfinity.IsInfiniteVector3D(mid)) {
      mid = UtilsInfinity.IsInfiniteVector3D(s.P1)
        ? s.P2.MultiplyWithNumber(UtilsInfinity.FiniteScale)
        : s.P1.MultiplyWithNumber(UtilsInfinity.FiniteScale)
    }

    this.P1 = s.ReflectPoint(this.P1)
    this.P2 = s.ReflectPoint(this.P2)

    mid = s.ReflectPoint(mid)
    //  Can we make a circle out of the reflected points?
    let temp: Circle = Circle.construct()

    if (
      !UtilsInfinity.IsInfiniteVector3D(this.P1) &&
      !UtilsInfinity.IsInfiniteVector3D(this.P2) &&
      !UtilsInfinity.IsInfiniteVector3D(mid) &&
      temp.From3Points(this.P1, mid, this.P2)
    ) {
      this.Type = SegmentType.Arc
      this.Center = temp.Center
      //  Work out the orientation of the arc.
      let t1: Vector3D = this.P1.Subtract(this.Center)
      let t2: Vector3D = mid.Subtract(this.Center)
      let t3: Vector3D = this.P2.Subtract(this.Center)
      let a1: number = Euclidean2D.AngleToCounterClock(t2, t1)
      let a2: number = Euclidean2D.AngleToCounterClock(t3, t1)
      this.Clockwise = a2 > a1
    } else {
      //  The circle construction fails if the points
      //  are colinear (if the arc has been transformed into a line).
      this.Type = SegmentType.Line
      //  XXX - need to do something about this.
      //  Turn into 2 segments?
      // if( UtilsInfinity.IsInfiniteVector3D( mid ) )
      //  Actually the check should just be whether mid is between p1 and p2.
    }
  }

  TransformMobius(m: Mobius) {
    this.TransformInternal(m)
  }

  TransformIsometry(i: Isometry) {
    this.TransformInternal(i)
  }

  ///  <summary>
  ///  Apply a transform to us.
  ///  </summary>
  TransformInternal<T extends ITransform>(transform: T) {
    //  NOTES:
    //  Arcs can go to lines, and lines to arcs.
    //  Rotations may reverse arc directions as well.
    //  Arc centers can't be transformed directly.
    //  NOTE: We must calc this before altering the endpoints.
    let mid: Vector3D = this.Midpoint
    if (UtilsInfinity.IsInfiniteVector3D(mid)) {
      mid = UtilsInfinity.IsInfiniteVector3D(this.P1)
        ? this.P2.MultiplyWithNumber(UtilsInfinity.FiniteScale)
        : this.P1.MultiplyWithNumber(UtilsInfinity.FiniteScale)
    }

    this.P1 = transform.ApplyVector3D(this.P1)
    this.P2 = transform.ApplyVector3D(this.P2)
    mid = transform.ApplyVector3D(mid)

    //  Can we make a circle out of the transformed points?
    let temp: Circle = Circle.construct()

    if (
      !UtilsInfinity.IsInfiniteVector3D(this.P1) &&
      !UtilsInfinity.IsInfiniteVector3D(this.P2) &&
      !UtilsInfinity.IsInfiniteVector3D(mid) &&
      temp.From3Points(this.P1, mid, this.P2)
    ) {
      this.Type = SegmentType.Arc
      this.Center = temp.Center
      //  Work out the orientation of the arc.
      let t1: Vector3D = this.P1.Subtract(this.Center)
      let t2: Vector3D = mid.Subtract(this.Center)
      let t3: Vector3D = this.P2.Subtract(this.Center)
      let a1: number = Euclidean2D.AngleToCounterClock(t2, t1)
      let a2: number = Euclidean2D.AngleToCounterClock(t3, t1)
      this.Clockwise = a2 > a1
    } else {
      //  The circle construction fails if the points
      //  are colinear (if the arc has been transformed into a line).
      this.Type = SegmentType.Line
      //  XXX - need to do something about this.
      //  Turn into 2 segments?
      // if( UtilsInfinity.IsInfiniteVector3D( mid ) )
      //  Actually the check should just be whether mid is between p1 and p2.
    }
  }

  ///  <summary>
  ///  Apply a Euclidean translation to us.
  ///  </summary>
  Translate(v: Vector3D) {
    this.P1 = this.P1.Add(v)
    this.P2 = this.P2.Add(v)

    if (this.Type == SegmentType.Arc) {
      this.Center = this.Center.Add(v)
    }
  }

  ///  <summary>
  ///  Apply a Euclidean rotation to us.
  ///  </summary>
  Rotate(m: Matrix4D) {
    this.P1 = m.RotateVector(this.P1)
    this.P2 = m.RotateVector(this.P2)
    if (this.Type == SegmentType.Arc) {
      this.Center = m.RotateVector(this.Center)
    }
  }

  ///  <summary>
  ///  Euclidean scale us relative to some center point.
  ///  NOTE: Currently only works for line segments.
  ///  </summary>
  Scale(center: Vector3D, factor: number) {
    this.Translate(center.Negate())

    if (this.Type == SegmentType.Line) {
      this.P1 = this.P1.MultiplyWithNumber(factor)
      this.P2 = this.P2.MultiplyWithNumber(factor)
    } else if (this.Type == SegmentType.Arc) {
      let p1: Vector3D = this.P1
      let p2: Vector3D = this.P2
      let mid: Vector3D = this.Midpoint
      p1 = p1.MultiplyWithNumber(factor)
      p2 = p2.MultiplyWithNumber(factor)
      mid = mid.MultiplyWithNumber(factor)
      let temp: Segment = Segment.Arc(p1, mid, p2)
      this.P1 = p1
      this.P2 = p2
      this.Center = temp.Center
    }

    this.Translate(center)
  }

  ReflectPoint(input: Vector3D): Vector3D {
    if (SegmentType.Arc == this.Type) {
      let c: Circle = this.Circle
      return c.ReflectPoint(input)
    } else {
      return Euclidean2D.ReflectPointInLine(input, this.P1, this.P2)
    }
  }

  ///  <summary>
  ///  Splits a segment into multiple segments based on a point.
  ///  The new segments will be ordered in the same way as us (from p1 -> point and point -> p2 ).
  ///  </summary>
  ///  <returns>True if the segment was split, false otherwise (if passed in point is not on segment or an endpoint).</returns>
  Split(point: Vector3D, split: Array<Segment>): boolean {
    if (!this.IsPointOn(point)) {
      console.assert(false)
      return false
    }

    //  Endpoint?
    if (point.Compare(this.P1) || point.Compare(this.P2)) {
      return false
    }

    let s1: Segment = this.Clone()
    let s2: Segment = this.Clone()
    s1.P2 = point
    s2.P1 = point
    split.push(s1)
    split.push(s2)
    return true
  }

  ///  <summary>
  ///  Checks to see if two points are ordered on this segment, that is:
  ///  P1 -> test1 -> test2 -> P2 returns true.
  ///  P1 -> test2 -> test1 -> P2 returns false;
  ///  Also returns false if test1 or test2 are equal, not on the segment, or are an endpoint.
  ///  </summary>
  ///  <param name="p1"></param>
  ///  <param name="p2"></param>
  ///  <returns></returns>
  Ordered(test1: Vector3D, test2: Vector3D): boolean {
    if (test1.Compare(test2)) {
      console.assert(false)
      return false
    }

    if (!this.IsPointOn(test1) || !this.IsPointOn(test2)) {
      console.assert(false)
      return false
    }

    if (
      test1.Compare(this.P1) ||
      test1.Compare(this.P2) ||
      test2.Compare(this.P1) ||
      test2.Compare(this.P2)
    ) {
      return false
    }

    if (SegmentType.Arc == this.Type) {
      let t1: Vector3D = this.P1.Add(this.Center)
      let t2: Vector3D = test1.Add(this.Center)
      let t3: Vector3D = test2.Add(this.Center)

      const a1 = this.Clockwise
        ? Euclidean2D.AngleToClock(t1, t2)
        : Euclidean2D.AngleToCounterClock(t1, t2)
      const a2 = this.Clockwise
        ? Euclidean2D.AngleToClock(t1, t3)
        : Euclidean2D.AngleToCounterClock(t1, t3)
      return a1 < a2
    } else {
      let d1: number = test1.Add(this.P1).MagSquared()
      let d2: number = test2.Add(this.P1).MagSquared()
      return d1 < d2
    }
  }
}

export enum SegmentType {
  Line,

  Arc,
}

function Vector3DCompare(v1: Vector3D, v2: Vector3D): number {
  const less = -1
  const greater = 1

  if (Tolerance.LessThan(v1.X, v2.X)) {
    return less
  }
  if (Tolerance.GreaterThan(v1.X, v2.X)) {
    return greater
  }

  if (Tolerance.LessThan(v1.Y, v2.Y)) {
    return less
  }
  if (Tolerance.GreaterThan(v1.Y, v2.Y)) {
    return greater
  }

  if (Tolerance.LessThan(v1.Z, v2.Z)) {
    return less
  }
  if (Tolerance.GreaterThan(v1.Z, v2.Z)) {
    return greater
  }

  if (Tolerance.LessThan(v1.W, v2.W)) {
    return less
  }
  if (Tolerance.GreaterThan(v1.W, v2.W)) {
    return greater
  }

  // Making it here means we are equal.
  return 0
}

function hashCode(str: string) {
  var hash = 0,
    i = 0,
    len = str.length
  while (i < len) {
    hash = ((hash << 5) - hash + str.charCodeAt(i++)) << 0
  }
  return hash
}
