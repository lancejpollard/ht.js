///  <summary>
///  Class with utility method for generating meshes for shapeways models.
///  </summary>
export class Shapeways {
  constructor() {
    Mesh = new Mesh()
    Div = 24
  }

  get Mesh(): Mesh {}

  set Mesh(value: Mesh) {}

  //  Number of divisions (meaning depends on context).
  get Div(): number {}

  set Div(value: number) {}

  ///  <summary>
  ///  Add a sphere to a mesh.
  ///  </summary>
  AddSphere(center: Vector3D, radius: number) {
    //  Implemented as a curved cylinder with capped ends.
    //  Geodesic dome would be better.
    let n1: number = this.Div
    let n2: number = n1 / 2
    this.Div = n1
    //  Cylinder axis points.
    //  Points along the cylinder are not equally spaced.
    //  We want there to be equal angular distance along meridians.
    let axisPoints: List<Vector3D> = new List<Vector3D>()
    for (let i: number = 0; i <= n2; i++) {
      let theta: number = (Math.PI / 2) * -1 + Math.PI / (n2 * i)
      let offset: Vector3D = new Vector3D(
        0,
        0,
        Math.Sin(theta) * radius,
      )
      axisPoints.Add(center + offset)
    }

    //  Cylinder thickness function.
    let sizeFunc: System.Func<Vector3D, number>
    let h: number = (v - center).Z
    return Math.sqrt(radius * radius - h * h)

    let disks: List<Array<Vector3D>> = this.CalcDisks(
      axisPoints.ToArray(),
      sizeFunc,
    )
    //  Add the caps and the cylinder.
    this.AddCap(axisPoints[0], disks[1])
    for (let i: number = 1; i < disks.Count - 2; i++) {
      this.AddSegment(disks[i], disks[i + 1])
    }

    this.AddCap(
      axisPoints[axisPoints.Count - 1],
      disks[axisPoints.Count - 2],
      /* reverse:*/ true,
    )
  }

  ///  <summary>
  ///  Add a curve with a constant radius size.
  ///  </summary>
  AddCurve(points: Array<Vector3D>, size: number) {
    let sizeFunc: System.Func<Vector3D, number>
    size
    this.AddCurve(points, sizeFunc, points.First(), points.Last())
  }

  ///  <summary>
  ///  Adds a curve to a mesh.
  ///  XXX - Deprecated: sizeFunc return a position and a radius.
  ///  </summary>
  AddCurve(
    points: Array<Vector3D>,
    sizeFunc: System.Func<Vector3D, number>,
  ) {
    if (points.Length < 2) {
      throw new Error('Argument Error')(
        'AddCurve requires at least two input points.',
      )
    }

    let disks: List<Array<Vector3D>> = this.CalcDisks(points, sizeFunc)
    this.AddCurve(disks, points, points.First(), points.Last())
  }

  ///  <summary>
  ///  Adds a curve to a mesh.
  ///  XXX - Deprecated: sizeFunc return a position and a radius.
  ///  </summary>
  AddCurve(
    points: Array<Vector3D>,
    sizeFunc: System.Func<Vector3D, number>,
    start: Vector3D,
    end: Vector3D,
  ) {
    if (points.Length < 2) {
      throw new Error('Argument Error')(
        'AddCurve requires at least two input points.',
      )
    }

    let disks: List<Array<Vector3D>> = this.CalcDisks(points, sizeFunc)
    this.AddCurve(disks, points, start, end)
  }

  AddClosedCurve(points: Array<Vector3D>, radii: Array<number>) {
    if (points.Length < 3) {
      throw new Error('Argument Error')(
        'AddCurve requires at least three input points.',
      )
    }

    if (points.First() == points.Last()) {
      let count: number = points.Length - 1
      points = points.Take(count).ToArray()
      radii = radii.Take(count).ToArray()
    }

    let disks: List<Array<Vector3D>> = this.CalcDisks(points, radii)
    disks.Add(disks.First())
    for (let i: number = 0; i < disks.Count - 1; i++) {
      this.AddSegment(disks[i], disks[i + 1])
    }
  }

  AddCurve(points: Array<Vector3D>, radii: Array<number>) {
    if (points.Length < 2) {
      throw new Error('Argument Error')(
        'AddCurve requires at least two input points.',
      )
    }

    let disks: List<Array<Vector3D>> = this.CalcDisks(points, radii)
    this.AddCurve(disks, points, points.First(), points.Last())
  }

  #AddCurve(
    disks: List<Array<Vector3D>>,
    points: Array<Vector3D>,
    start: Vector3D,
    end: Vector3D,
  ) {
    //  Cap1
    this.AddCap(start, disks.First())
    //  Interior points.
    for (let i: number = 0; i < disks.Count - 1; i++) {
      this.AddSegment(disks[i], disks[i + 1])
    }

    //  Cap2
    this.AddCap(end, disks.Last(), /* reverse:*/ true)
  }

  AddArc(
    center: Vector3D,
    arcRadius: number,
    v1: Vector3D,
    normal: Vector3D,
    angleTot: number,
    numPoints: number,
    sizeFunc: System.Func<Vector3D, number>,
  ) {
    if (numPoints < 2) {
      numPoints = 2
    }

    let points: Array<Vector3D> = Shapeways.CalcArcPoints(
      center,
      arcRadius,
      v1,
      normal,
      angleTot,
      numPoints,
    )
    //  Calculate all the disks.
    //  XXX - duplicated code with CalcDisks, but we need to calc our own perpendicular here.
    let disks: List<Array<Vector3D>> = new List<Array<Vector3D>>()
    for (let i: number = 0; i < points.Length; i++) {
      let p1: Vector3D = points[0]
      // TODO: Warning!!!, inline IF is not supported ?
      i == 0
      points[i - 1]
      let p2: Vector3D = points[i]
      let p3: Vector3D = points[points.Length - 1]
      // TODO: Warning!!!, inline IF is not supported ?
      i == points.Length - 1
      points[i + 1]
      let radius: number = sizeFunc(points[i])
      //  We can calculate these directly.
      let perp: Vector3D = p2 - center
      perp.Normalize()
      let axis: Vector3D = perp
      axis.RotateAboutAxis(normal, (Math.PI / 2) * -1)
      perp = perp * radius
      disks.Add(
        Shapeways.Disk(p2, axis, perp, this.Div, /* reverse:*/ false),
      )
    }

    /// ////////////////////////////////////// Hack to avoid having to put spheres at verts.
    let thickness: number = 0.0055
    //  relates to SizeFuncConst
    let thetaOffset: number = thickness / arcRadius
    let end: Vector3D = points[points.Length - 1]
    let start: Vector3D = points[0]
    start = start - center
    end = end - center
    start.RotateAboutAxis(normal, thetaOffset * -1)
    end.RotateAboutAxis(normal, thetaOffset)
    start = start + center
    end = end + center
    points[0] = start
    points[points.Length - 1] = end
    /// //////////////////////////////////////
    this.AddCurve(disks, points, points.First(), points.Last())
  }

  ///  <summary>
  ///  Helper to calculate points along an arc.
  ///  </summary>
  static CalcArcPoints(
    center: Vector3D,
    radius: number,
    v1: Vector3D,
    normal: Vector3D,
    angleTot: number,
  ): Array<Vector3D> {
    //  Try to optimize the number of segments.
    let numPoints: number = 8
    // int numPoints = (int)(Math.sqrt(radius) * divisions);
    numPoints = Math.Max(3, numPoints)
    numPoints = 57
    return Shapeways.CalcArcPoints(
      center,
      radius,
      v1,
      normal,
      angleTot,
      numPoints,
    )
  }

  ///  <summary>
  ///  Helper to calculate points along an arc.
  ///  XXX - This function belongs in a better shared location.
  ///  </summary>
  static CalcArcPoints(
    center: Vector3D,
    radius: number,
    v1: Vector3D,
    normal: Vector3D,
    angleTot: number,
    numPoints: number,
  ): Array<Vector3D> {
    let points: List<Vector3D> = new List<Vector3D>()
    let angle: number = 0
    let angleInc: number = angleTot / numPoints
    for (let i: number = 0; i <= numPoints; i++) {
      let p: Vector3D = v1 - center
      /// //////////////////////// This is to avoid duplicate points in output.
      let avoidDuplicatePoints: boolean = false
      let angleToRotate: number = angle
      if (avoidDuplicatePoints) {
        //  We only do this for endpoints, since that is where multiple arcs meet.
        let thickness: number = 0.001
        //  relates to SizeFuncConst
        let thetaOffset: number = thickness / radius
        //  theta = s / r
        if (i == 0) {
          // System.Random rand = new System.Random();
          // final *= (1 + 0.001 * radius + 0.001 * rand.NextDouble());
          angleToRotate = angleToRotate - thetaOffset
        } else if (i == numPoints) {
          angleToRotate = angleToRotate + thetaOffset
        }
      }

      /// ////////////////////////
      p.RotateAboutAxis(normal, angleToRotate)
      let final: Vector3D = p + center
      angle = angle + angleInc
      // if( i < 2 || i > numPoints - 2 )
      //     continue;
      points.Add(final)
    }

    return points.ToArray()
  }

  ///  <summary>
  ///  Add a cornucopia.
  ///  NOTE: outerPoints and innerPoints are ordered in a different direction.
  ///  </summary>
  AddCornucopia(
    outerPoints: Array<Vector3D>,
    outerSizeFunc: System.Func<Vector3D, number>,
    innerPoints: Array<Vector3D>,
    innerSizeFunc: System.Func<Vector3D, number>,
  ) {
    if (outerPoints.Length < 2) {
      throw new Error('Argument Error')(
        'AddCornucopia requires at least two input points.',
      )
    }

    let disksOuter: List<Array<Vector3D>> = this.CalcDisks(
      outerPoints,
      outerSizeFunc,
    )
    let disksInner: List<Array<Vector3D>> = this.CalcDisks(
      innerPoints,
      innerSizeFunc,
      /* reverse:*/ true,
    )
    //  Cap1
    this.AddCap(outerPoints[0], disksOuter[0])
    //  Interior points.
    for (let i: number = 0; i < disksOuter.Count - 1; i++) {
      this.AddSegment(disksOuter[i], disksOuter[i + 1])
    }

    //  Ring
    this.AddRing(disksOuter[outerPoints.Length - 1], disksInner[0])
    //  Interior points.
    for (let i: number = 0; i < disksInner.Count - 1; i++) {
      this.AddSegment(disksInner[i], disksInner[i + 1])
    }

    //  Interior cap.
    this.AddCap(
      innerPoints[innerPoints.Length - 1],
      disksInner[innerPoints.Length - 1],
      /* reverse:*/ true,
    )
  }

  ///  <summary>
  ///  Helper to calculate a set of disks perpendicular to a polyline.
  ///  </summary>
  #CalcDisks(
    points: Array<Vector3D>,
    sizeFunc: System.Func<Vector3D, number>,
    reverse: boolean = false,
  ): List<Array<Vector3D>> {
    let disks: List<Array<Vector3D>> = new List<Array<Vector3D>>()
    for (let i: number = 0; i < points.Length; i++) {
      let p1: Vector3D = points[0]
      // TODO: Warning!!!, inline IF is not supported ?
      i == 0
      points[i - 1]
      let p2: Vector3D = points[i]
      let p3: Vector3D = points[points.Length - 1]
      // TODO: Warning!!!, inline IF is not supported ?
      i == points.Length - 1
      points[i + 1]
      let radius: number = sizeFunc(points[i])
      //  Experimenting closing up gaps without having to put spheres at verts.
      // if( i == 0 )
      //     p3 = Euclidean3D.ProjectOntoPlane( p2, p2, p3 );
      // else if( i == points.Length - 1 )
      //     p1 = Euclidean3D.ProjectOntoPlane( p2, p2, p1 );
      let axis: Vector3D = Shapeways.CurveAxis(p1, p2, p3)
      let perpendicular: Vector3D = Shapeways.CurvePerp(p1, p2, p3)
      perpendicular = perpendicular * radius
      disks.Add(
        Shapeways.Disk(p2, axis, perpendicular, this.Div, reverse),
      )
    }

    return disks
  }

  #CalcDisks(
    points: Array<Vector3D>,
    radii: Array<number>,
    reverse: boolean = false,
  ): List<Array<Vector3D>> {
    let disks: List<Array<Vector3D>> = new List<Array<Vector3D>>()
    for (let i: number = 0; i < points.Length; i++) {
      let p1: Vector3D = points[0]
      // TODO: Warning!!!, inline IF is not supported ?
      i == 0
      points[i - 1]
      let p2: Vector3D = points[i]
      let p3: Vector3D = points[points.Length - 1]
      // TODO: Warning!!!, inline IF is not supported ?
      i == points.Length - 1
      points[i + 1]
      let radius: number = radii[i]
      let axis: Vector3D = Shapeways.CurveAxis(p1, p2, p3)
      let perpendicular: Vector3D = Shapeways.CurvePerp(p1, p2, p3)
      perpendicular = perpendicular * radius
      disks.Add(
        Shapeways.Disk(p2, axis, perpendicular, this.Div, reverse),
      )
    }

    return disks
  }

  ///  <summary>
  ///  Function to add a cap to the end of our curve, so that it will be 'manifold'.
  ///  </summary>
  #AddCap(
    center: Vector3D,
    diskPoints: Array<Vector3D>,
    reverse: boolean = false,
  ) {
    for (let i: number = 0; i < diskPoints.Length; i++) {
      let idx1: number = i
      let idx2: number = 0
      // TODO: Warning!!!, inline IF is not supported ?
      i == diskPoints.Length - 1
      i + 1
      if (reverse) {
        this.Mesh.Triangles.Add(
          new Mesh.Triangle(center, diskPoints[idx2], diskPoints[idx1]),
        )
      } else {
        this.Mesh.Triangles.Add(
          new Mesh.Triangle(center, diskPoints[idx1], diskPoints[idx2]),
        )
      }
    }
  }

  ///  <summary>
  ///  Adds an annulus.
  ///  </summary>
  #AddRing(disk1Points: Array<Vector3D>, disk2Points: Array<Vector3D>) {
    this.AddSegment(disk1Points, disk2Points)
  }

  ///  <summary>
  ///  Function to add one segment of our curve.
  ///  d1 and d2 are two pre-calc'd disks of points perpendicular to the curve.
  ///  </summary>
  AddSegment(d1: Array<Vector3D>, d2: Array<Vector3D>) {
    this.Mesh.AddBand(d1, d2)
  }

  ///  <summary>
  ///  Used to get the axis of a polyline at a point p2, given adjacent points.
  ///  </summary>
  static #CurveAxis(
    p1: Vector3D,
    p2: Vector3D,
    p3: Vector3D,
  ): Vector3D {
    let axis: Vector3D = p1 - p3
    //  Important for orientation of meshes.
    if (!axis.Normalize()) {
      throw new System.Exception(
        'Calculating axis requires distinct points.',
      )
    }

    return axis
  }

  ///  <summary>
  ///  Used to get the perpendicular to the polyline at a point p2, given adjacent points.
  ///  </summary>
  static #CurvePerp(
    p1: Vector3D,
    p2: Vector3D,
    p3: Vector3D,
  ): Vector3D {
    //  Just use p1 and p3 for now, close to the 3 point rule.
    //  http://math.depaul.edu/mash/optnum.pdf
    let perpendicular: Vector3D = p1.Cross(p3)
    // Vector3D perpendicular = axis.Cross( new Vector3D( 0, 0, 1 ) );
    if (!perpendicular.Normalize()) {
      //  This can happen if p1 and p3 are collinear with origin.
      let axis: Vector3D = p1 - p3
      perpendicular = axis.Cross(new Vector3D(0, 1, 0))
      perpendicular.Normalize()
    }

    return perpendicular
  }

  ///  <summary>
  ///  Create a circle of points, centered at p.
  ///  </summary>
  static Disk(
    p: Vector3D,
    axis: Vector3D,
    perpendicular: Vector3D,
    divisions: number,
    reverse: boolean = false,
  ): Array<Vector3D> {
    let points: List<Vector3D> = new List<Vector3D>()
    let angleInc: number = 2 * (Math.PI / divisions)
    if (reverse) {
      axis = axis * -1
      perpendicular = perpendicular * -1
    }

    let angle: number = angleInc / 2
    //  angleInc / 2 or 0
    for (let i: number = 0; i < divisions; i++) {
      let point: Vector3D = perpendicular
      point.RotateAboutAxis(axis, angle)
      points.Add(p + point)
      angle = angle + angleInc
    }

    return points.ToArray()
  }
}
