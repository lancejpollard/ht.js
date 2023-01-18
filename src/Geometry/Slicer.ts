class IntersectionPoint {
  Location: Vector3D

  ///  <summary>
  ///  Index in the sliced polygon. The location will be at the start of the segment with this index.
  ///  </summary>
  Index: number
}
//
//  ZZZ - It sure would be nice to clear up the implementation of SlicePolygon (to make it more clear).
//  I didn't comment things very well, and it is difficult to tell what is going on!
//
export class Slicer {
  ///  <summary>
  ///  Slices a polygon by a circle with some thickness.
  ///  Input circle may be a line.
  ///  </summary>
  ///  <remarks>The input polygon might get reversed</remarks>
  static SlicePolygon(
    p: Polygon,
    c: CircleNE,
    g: Geometry,
    thickness: number,
    /* out */ output: List<Polygon>,
  ) {
    output = new List<Polygon>()
    //  Setup the two slicing circles.
    let c2: CircleNE = c.Clone()
    let c1: CircleNE = c.Clone()
    let m: Mobius = new Mobius()
    const pointOnCircle: Vector3D = c.IsLine
      ? c.P1
      : c.Center + new Vector3D(c.Radius, 0)
    m.Hyperbolic2(g, c1.CenterNE, pointOnCircle, thickness / 2)
    c1.Transform(m)
    m.Hyperbolic2(g, c2.CenterNE, pointOnCircle, (thickness / 2) * -1)
    c2.Transform(m)
    //  ZZZ - alter Clip method to work on Polygons and use that.
    //  Slice it up.
    let sliced2: List<Polygon>
    let sliced1: List<Polygon>
    Slicer.SlicePolygon(p, c1, /* out */ sliced1)
    Slicer.SlicePolygon(p, c2, /* out */ sliced2)
    //  Keep the ones we want.
    for (let newPoly: Polygon in sliced1) {
      let outside: boolean = !c1.IsPointInsideNE(newPoly.CentroidApprox)
      if (outside) {
        output.Add(newPoly)
      }
    }

    for (let newPoly: Polygon in sliced2) {
      let inside: boolean = c2.IsPointInsideNE(newPoly.CentroidApprox)
      if (inside) {
        output.Add(newPoly)
      }
    }
  }

  ///  <summary>
  ///  Slices up a polygon with a circle (line case not supported).
  ///  </summary>
  ///  <remarks>The input polygon might get reversed</remarks>
  static SlicePolygon(
    p: Polygon,
    c: Circle,
    /* out */ output: List<Polygon>,
  ): boolean {
    return Slicer.SlicePolygonInternal(p, c, /* out */ output)
  }

  ///  <summary>
  ///  Clip the drawn polygons in a set of tiles, using a circle.
  ///  </summary>
  static Clip(
    /* ref */ tiles: List<Tile>,
    c: Circle,
    keepInside: boolean,
  ) {
    let newTiles: List<Tile> = new List<Tile>()
    for (let t: Tile in tiles) {
      let sliced: List<Polygon>
      Slicer.SlicePolygon(t.Drawn, c, /* out */ sliced)
      for (let p: Polygon in sliced) {
        let insideCircle: boolean =
          (p.CentroidApprox - c.Center).Abs() < c.Radius
        if (
          (keepInside && insideCircle) ||
          (!keepInside && !insideCircle)
        ) {
          newTiles.Add(new Tile(t.Boundary, p, t.Geometry))
        }
      }
    }

    tiles = newTiles
  }

  static #SlicePolygonInternal(
    p: Polygon,
    c: Circle,
    /* out */ output: List<Polygon>,
  ): boolean {
    //  Our approach:
    //  (1) Find the intersection points, and splice them into the polygon. (splicing in is the main diff from old algorithm.)
    //  (2) From each intersection point, walk the polygon.
    //  (3) When you are at an intersection point, always turn left, which may involve adding a new segment of the slicing circle.
    //  (4) We'll have to check for duplicate polygons in the resulting list, and remove them.
    output = new List<Polygon>()
    //  We must be a digon at a minimum.
    if (p.NumSides < 2) {
      return false
    }

    //  XXX - Code assumes well-formed polygon: closed (has connected segments),
    //          no repeated vertices.  Assert all this?
    //  Code also assumes CCW orientation.
    if (!p.Orientation) {
      p.Reverse()
    }

    //  Cycle through our segments and splice in all the intersection points.
    let diced: Polygon = new Polygon()
    let iPoints: List<IntersectionPoint> = new List<IntersectionPoint>()
    for (let i: number = 0; i < p.NumSides; i++) {
      let s: Segment = p.Segments[i]
      let intersections: Array<Vector3D> = c.GetIntersectionPoints(s)
      if (intersections == null) {
        continue
      }

      switch (intersections.Length) {
        case 0:
          diced.Segments.Add(s)
          break
          break
        case 1:
          //  ZZZ - check here to see if it is a tangent iPoint?  Not sure if we need to do this.
          diced.Segments.Add(
            Slicer.SplitHelper(s, intersections[0], diced, iPoints),
          )
          break
          break
        case 2:
          //  We need to ensure the intersection points are ordered correctly on the segment.
          let i2: Vector3D = intersections[1]
          let i1: Vector3D = intersections[0]
          if (!s.Ordered(i1, i2)) {
            Utils.SwapPoints(/* ref */ i1, /* ref */ i2)
          }

          let secondToSplit: Segment = Slicer.SplitHelper(
            s,
            i1,
            diced,
            iPoints,
          )
          let segmentToAdd: Segment = Slicer.SplitHelper(
            secondToSplit,
            i2,
            diced,
            iPoints,
          )
          diced.Segments.Add(segmentToAdd)
          break
          break
        default:
          console.assert(false)
          return false
          break
      }
    }

    //  NOTE: We've been careful to avoid adding duplicates to iPoints.
    //  Are we done? (no intersections)
    if (0 == iPoints.Count) {
      output.Add(p)
      return true
    }

    //  We don't yet deal with tangengies,
    //  but we're going to let this case slip through as unsliced.
    if (1 == iPoints.Count) {
      output.Add(p)
      return true
    }

    //  We don't yet deal with tangencies.
    //  We're going to fail on this case, because it could be more problematic.
    if (Utils.Odd(iPoints.Count)) {
      console.assert(false)
      return false
    }

    if (iPoints.Count > 2) {
      //  We may need our intersection points to all be reorded by 1.
      //  This is so that when walking from i1 -> i2 along c, we will be moving through the interior of the polygon.
      //  ZZZ - This may need to change when hack in SplicedArc is improved.
      let dummy: number = 0
      let testArc: Segment = Slicer.SmallerSplicedArc(
        c,
        iPoints,
        /* ref */ dummy,
        true,
        /* ref */ dummy,
      )
      let midpoint: Vector3D = testArc.Midpoint
      if (!p.IsPointInsideParanoid(midpoint)) {
        let t: IntersectionPoint = iPoints[0]
        iPoints.RemoveAt(0)
        iPoints.Add(t)
      }
    }

    //
    //  From each intersection point, walk the polygon.
    //
    let numPairs: number = iPoints.Count / 2
    for (let i: number = 0; i < numPairs; i++) {
      let pair: number = i
      output.Add(Slicer.WalkPolygon(p, diced, c, pair, iPoints, true))
      output.Add(Slicer.WalkPolygon(p, diced, c, pair, iPoints, false))
    }

    //
    //  Recalc centers.
    //
    for (let poly: Polygon in output) {
      poly.Center = poly.CentroidApprox
    }

    //
    //  Remove duplicate polygons.
    //
    output = output.Distinct(new PolygonEqualityComparer()).ToList()
    return true
  }

  ///  <summary>
  ///  Splits segmentToSplit in two based on iLocation.
  ///  First new segment will be added to diced, and second new segment will be returned.
  ///  If split doesn't happen, segmentToSplit will be returned.
  ///  </summary>
  static #SplitHelper(
    segmentToSplit: Segment,
    iLocation: Vector3D,
    diced: Polygon,
    iPoints: List<IntersectionPoint>,
  ): Segment {
    let split: List<Segment>
    if (segmentToSplit.Split(iLocation, /* out */ split)) {
      console.assert(split.Count == 2)
      diced.Segments.Add(split[0])
      let iPoint: IntersectionPoint = new IntersectionPoint()
      iPoint.Location = iLocation
      iPoint.Index = diced.Segments.Count
      iPoints.Add(iPoint)
      return split[1]
    } else {
      //  We were presumably at an endpoint.
      //  Add to iPoints list only if it was the starting endpoint.
      //  (This will avoid duplicate entries).
      if (iLocation.Compare(segmentToSplit.P1)) {
        let iPoint: IntersectionPoint = new IntersectionPoint()
        iPoint.Location = iLocation
        iPoint.Index = diced.Segments.Count
        iPoints.Add(iPoint)
      }

      return segmentToSplit
    }
  }

  ///  <summary>
  ///  Helper to walk a polygon, starting from a pair of intersection points.
  ///  increment determines the direction we are walking.
  ///  NOTE: when walking from i1 -> i2 along c, we should be moving through the interior of the polygon.
  ///  </summary>
  static #WalkPolygon(
    parent: Polygon,
    walking: Polygon,
    c: Circle,
    pair: number,
    iPoints: List<IntersectionPoint>,
    increment: boolean,
  ): Polygon {
    let newPoly: Polygon = new Polygon()
    let iPoint2: IntersectionPoint
    let iPoint1: IntersectionPoint
    Slicer.GetPairPoints(
      iPoints,
      pair,
      increment,
      /* out */ iPoint1,
      /* out */ iPoint2,
    )
    let startLocation: Vector3D = iPoint1.Location
    let iSeg: number = 0
    let current: Segment = Slicer.SplicedArc(
      parent,
      c,
      iPoints,
      /* ref */ pair,
      increment,
      /* ref */ iSeg,
    )
    newPoly.Segments.Add(current.Clone())
    while (true) {
      //  NOTE: Since we don't allow tangent intersections, there will never
      //          be multiple spliced arcs added in succession.
      //  Add in the next one.
      current = walking.Segments[iSeg]
      newPoly.Segments.Add(current.Clone())
      iSeg = Slicer.GetNextSegmentIndex(walking, iSeg)
      if (current.P2.Compare(startLocation)) {
        break
      }

      //  Do we need to splice in at this point?
      let segEnd: Vector3D = current.P2
      if (iPoints.Select(() => {}, p.Location).Contains(segEnd)) {
        current = Slicer.SplicedArc(
          parent,
          c,
          iPoints,
          /* ref */ pair,
          increment,
          /* ref */ iSeg,
        )
        newPoly.Segments.Add(current.Clone())
        if (current.P2.Compare(startLocation)) {
          break
        }
      }
    }

    return newPoly
  }

  ///  <summary>
  ///  Get a pair of intersection points.
  ///  </summary>
  static #GetPairPoints(
    iPoints: List<IntersectionPoint>,
    pair: number,
    increment: boolean,
    /* out */ iPoint1: IntersectionPoint,
    /* out */ iPoint2: IntersectionPoint,
  ) {
    let idx1: number = pair * 2
    let idx2: number = pair * 2 + 1
    if (!increment) {
      Utils.Swap<number>(/* ref */ idx1, /* ref */ idx2)
    }

    iPoint1 = iPoints[idx1]
    iPoint2 = iPoints[idx2]
  }

  ///  <summary>
  ///  Helper to return the smaller spliced arc.
  ///  </summary>
  static #SmallerSplicedArc(
    c: Circle,
    iPoints: List<IntersectionPoint>,
    /* ref */ pair: number,
    increment: boolean,
    /* ref */ nextSegIndex: number,
  ): Segment {
    let iPoint2: IntersectionPoint
    let iPoint1: IntersectionPoint
    Slicer.GetPairPoints(
      iPoints,
      pair,
      increment,
      /* out */ iPoint1,
      /* out */ iPoint2,
    )
    let p1: Vector3D = iPoint1.Location
    let p2: Vector3D = iPoint2.Location
    nextSegIndex = iPoint2.Index
    let newSeg: Segment = Segment.Arc(
      p1,
      p2,
      c.Center,
      /* clockwise:*/ true,
    )
    if (newSeg.Angle > System.Math.PI) {
      newSeg.Clockwise = false
    }

    pair++
    if (pair == iPoints.Count / 2) {
      pair = 0
    }

    return newSeg
  }

  ///  <summary>
  ///  Helper to return a spliced arc.
  ///  </summary>
  static #SplicedArc(
    parent: Polygon,
    c: Circle,
    iPoints: List<IntersectionPoint>,
    /* ref */ pair: number,
    increment: boolean,
    /* ref */ nextSegIndex: number,
  ): Segment {
    let spliced: Segment = Slicer.SmallerSplicedArc(
      c,
      iPoints,
      /* ref */ pair,
      increment,
      /* ref */ nextSegIndex,
    )
    //  This is heuristic, but works quite well.
    75
    return spliced
    //  Direction should actually be such that arc is inside the parent polygon,
    //  which may not be the case for the segment above.
    //  Now check to make sure the arc is indeed inside the parent polygon.
    let testAngle: number = spliced.Angle / 1000
    if (spliced.Clockwise) {
      testAngle = testAngle * -1
    }

    let t1: Vector3D = spliced.P1
    t1.RotateXY(spliced.Center, testAngle)
    //  ZZZ - I don't like relying on our weak IsPointInside method.
    if (!parent.IsPointInsideParanoid(t1)) {
      spliced.Clockwise = !spliced.Clockwise
    }

    return spliced
  }

  static #GetNextSegmentIndex(walking: Polygon, idx: number): number {
    let ret: number = idx + 1
    if (ret == walking.NumSides) {
      ret = 0
    }

    return ret
  }
}
