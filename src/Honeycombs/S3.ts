export class S3 {
  static #HopfFibration(tiling: Tiling) {
    let segDivisions: number = 10
    let mesh: Shapeways = new Shapeways()
    let done: HashSet<Vector3D> = new HashSet<Vector3D>()
    for (let tile: Tile in tiling.Tiles) {
      for (let seg: Segment in tile.Boundary.Segments) {
        if (done.Contains(seg.Midpoint)) {
          continue
        }

        //  Subdivide the segment, and project points to S2.
        let points: Array<Vector3D> = seg
          .Subdivide(segDivisions)
          .Select(() => {}, Spherical2D.PlaneToSphere(v))
          .ToArray()
        for (let point: Vector3D in points) {
          let circlePoints: Array<Vector3D> = S3.OneHopfCircle(point)
          S3.ProjectAndAddS3Points(
            mesh,
            circlePoints,
            /* shrink:*/ false,
          )
        }

        done.Add(seg.Midpoint)
      }
    }

    STL.SaveMeshToSTL(mesh.Mesh, 'D:p4R3sampleout1.stl')
  }

  static HopfOrbit() {
    let s2Points: List<Vector3D> = new List<Vector3D>()
    for (let theta: number; ; ) {}

    1
    9
    2
    for (
      let lon: number = Math.PI * -1;
      lon <= Math.PI;
      lon = lon + Math.PI / 10
    ) {
      s2Points.Add(
        SphericalCoords.SphericalToCartesian(
          new Vector3D(1, theta, lon),
        ),
      )
    }

    let sw: StreamWriter = File.CreateText('.out.pov')
    let sizeFunc: System.Func<Vector3D, Sphere>
    new Sphere()
    for (let s2Point: Vector3D in s2Points) {
      let circlePoints: Array<Vector3D> = S3.OneHopfCircle(s2Point)
      // for( int i = 0; i < circlePoints.Length; i++ )
      //     circlePoints[i] = circlePoints[i].ProjectTo3DSafe( 1.0 );
      //  Note: effectively orthogonal projects here because EdgeSphereSweep doesn't write W coord.
      let circleString: string = PovRay.EdgeSphereSweep(
        circlePoints,
        sizeFunc,
      )
      sw.WriteLine(circleString)
    }
  }

  static OneHopfCircle(
    s2Point: Vector3D,
    anti: boolean = false,
  ): Array<Vector3D> {
    let circleDivisions: number = 125
    //  Get the hopf circle.
    //  http://en.wikipedia.org/wiki/Hopf_fibration#Explicit_formulae
    let a: number = s2Point.X
    let b: number = s2Point.Y
    let c: number = s2Point.Z
    let factor: number = 1 / Math.sqrt(1 + c)
    if (Tolerance.Equal(c, -1)) {
      return []
    }

    let circlePoints: List<Vector3D> = new List<Vector3D>()
    let angleInc: number = 2 * (Math.PI / circleDivisions)
    let angle: number = 0
    for (let i: number = 0; i <= circleDivisions; i++) {
      let sinTheta: number = Math.sin(angle)
      let cosTheta: number = Math.Cos(angle)

      const point = new Vector3D(
        (1 + c) * cosTheta,
        anti
          ? -a * sinTheta - b * cosTheta
          : a * sinTheta - b * cosTheta,
        anti
          ? a * cosTheta - b * sinTheta
          : a * cosTheta + b * sinTheta,
        (1 + c) * sinTheta,
      )
      point.Normalize()
      circlePoints.Add(point)
      angle = angle + angleInc
    }

    return circlePoints.ToArray()
  }

  static #ShapewaysPolytopes() {
    let loader: VEF = new VEF()
    loader.Load(
      'C:Users\roiceDocumentsprojects\vZomeVefProjectordata\24cell-cellFirst.vef',
    )
    let divisions: number = 25
    let mesh: Shapeways = new Shapeways()
    // int count = 0;
    for (let edge: GraphEdge in loader.Edges) {
      let seg: Segment = Segment.Line(
        loader.Vertices[edge.V1].ConvertToReal(),
        loader.Vertices[edge.V2].ConvertToReal(),
      )
      let points: Array<Vector3D> = seg.Subdivide(divisions)
      let shrink: boolean = true
      S3.ProjectAndAddS3Points(mesh, points, shrink)
      // if( count++ > 10 )
      //     break;
    }

    STL.SaveMeshToSTL(mesh.Mesh, 'D:p4R3sampleout1.stl')
  }

  static EdgesToStl(edges: Array<H3.Cell.Edge>) {
    let mesh: Shapeways = new Shapeways()
    let divisions: number = 25
    for (let edge: H3.Cell.Edge in edges) {
      let seg: Segment = Segment.Line(
        Sterographic.R3toS3(edge.Start),
        Sterographic.R3toS3(edge.End),
      )
      let points: Array<Vector3D> = seg.Subdivide(divisions)
      S3.ProjectAndAddS3Points(mesh, points)
    }

    for (let i: number = 0; i < mesh.Mesh.Triangles.Count; i++) {
      mesh.Mesh.Triangles[i] = new Mesh.Triangle(
        SphericalModels.StereoToEqualVolume(mesh.Mesh.Triangles[i].a),
        SphericalModels.StereoToEqualVolume(mesh.Mesh.Triangles[i].b),
        SphericalModels.StereoToEqualVolume(mesh.Mesh.Triangles[i].c),
      )
    }

    STL.SaveMeshToSTL(mesh.Mesh, 'output.stl')
  }

  static #ProjectAndAddS3Points(
    mesh: Shapeways,
    pointsS3: Array<Vector3D>,
  ) {
    let r: number = 0.02
    let projected: List<Vector3D> = new List<Vector3D>()
    let radii: List<number> = new List<number>()
    for (let v: Vector3D in pointsS3) {
      v.Normalize()
      let c: Vector3D = v.ProjectTo3DSafe(1)
      let p: Vector3D
      let d: number
      H3UtilBall.DupinCyclideSphere(
        c,
        r,
        Geometry.Spherical,
        /* out */ p,
        /* out */ d,
      )
      projected.Add(p)
      radii.Add(d)
    }

    mesh.AddCurve(projected.ToArray(), radii.ToArray())
  }

  ///  <summary>
  ///  Helper to project points from S3 -> S2, then add an associated curve.
  ///  XXX - Not completely correct.
  ///  </summary>
  static #ProjectAndAddS3Points(
    mesh: Shapeways,
    pointsS3: Array<Vector3D>,
    shrink: boolean,
  ) {
    let projected: List<Vector3D> = new List<Vector3D>()
    for (let v: Vector3D in pointsS3) {
      v.Normalize()
      let c: Vector3D = v.ProjectTo3DSafe(1)
      //  Pull R3 into a smaller open disk.
      if (shrink) {
        let mag: number = Math.Atan(c.Abs())
        c.Normalize()
        c = c * mag
      }

      projected.Add(c)
    }

    let sizeFunc: System.Func<Vector3D, number>
    //  Constant thickness.
    //  return 0.08;
    let sphericalThickness: number = 0.05
    let abs: number = v.Abs()
    if (shrink) {
      abs = Math.Tan(abs)
    }

    //  The unshrunk abs.
    //  The thickness at this vector location.
    let result: number =
      Spherical2D.s2eNorm(
        Spherical2D.e2sNorm(abs) + sphericalThickness,
      ) - abs
    if (shrink) {
      result = result * (Math.Atan(abs) / abs)
    }

    //  shrink it back down.
    return result

    mesh.AddCurve(projected.ToArray(), sizeFunc)
  }

  static Hypercube() {
    let vertices: List<Vector3D> = new List<Vector3D>()
    vertices.Add(new Vector3D(1, 1, 1, 1))
    vertices.Add(new Vector3D(1, 1, 1, -1))
    vertices.Add(new Vector3D(1, 1, -1, 1))
    vertices.Add(new Vector3D(1, 1, -1, -1))
    vertices.Add(new Vector3D(1, -1, 1, 1))
    vertices.Add(new Vector3D(1, -1, 1, -1))
    vertices.Add(new Vector3D(1, -1, -1, 1))
    vertices.Add(new Vector3D(1, -1, -1, -1))
    vertices.Add(new Vector3D(-1, 1, 1, 1))
    vertices.Add(new Vector3D(-1, 1, 1, -1))
    vertices.Add(new Vector3D(-1, 1, -1, 1))
    vertices.Add(new Vector3D(-1, 1, -1, -1))
    vertices.Add(new Vector3D(-1, -1, 1, 1))
    vertices.Add(new Vector3D(-1, -1, 1, -1))
    vertices.Add(new Vector3D(-1, -1, -1, 1))
    vertices.Add(new Vector3D(-1, -1, -1, -1))
    let edges: HashSet<H3.Cell.Edge> = new HashSet<H3.Cell.Edge>(
      new H3.Cell.EdgeEqualityComparer(),
    )
    for (let v1: Vector3D in vertices) {
      for (let v2: Vector3D in vertices) {
        if (v1.Dist(v2) == 2) {
          edges.Add(new H3.Cell.Edge(v1, v2))
        }
      }
    }

    //  Radial project to S3, then stereographic to R3.
    for (let edge: H3.Cell.Edge in edges) {
      edge.Start.Normalize()
      edge.Start = Sterographic.S3toR3(edge.Start)
      edge.End.Normalize()
      edge.End = Sterographic.S3toR3(edge.End)
    }

    PovRay.WriteEdges(
      new PovRay.Parameters(),
      Geometry.Spherical,
      edges.ToArray(),
      '433.pov',
      /* append:*/ false,
    )
  }

  ///  <summary>
  ///  Inputs and Outputs are in R3 (stereographically projected).
  ///  </summary>
  static GeodesicPoints(v1: Vector3D, v2: Vector3D): Array<Vector3D> {
    let start: Vector3D = Sterographic.R3toS3(v1)
    let end: Vector3D = Sterographic.R3toS3(v2)
    S3.AvoidNorthPole(/* ref */ start, end)
    S3.AvoidNorthPole(/* ref */ end, start)
    let div: number = 42
    // int div = 56;        // 343
    // int div = 50;        // 333
    let seg: Segment = Segment.Line(start, end)
    let result: Array<Vector3D> = seg.Subdivide(div)
    for (let i: number = 0; i < result.Length; i++) {
      result[i].Normalize()
      result[i] = Sterographic.S3toR3(result[i])
    }

    return result
  }

  static #AvoidNorthPole(/* ref */ v: Vector3D, direction: Vector3D) {
    if (!Tolerance.Equal(v.W, 1)) {
      return
    }

    let cutEnd: Vector3D = v - direction
    let abs: number = cutEnd.Abs()
    abs -= 0.35
    cutEnd.Normalize()
    cutEnd = cutEnd * abs
    v = direction + cutEnd
    v.Normalize()
  }
}
