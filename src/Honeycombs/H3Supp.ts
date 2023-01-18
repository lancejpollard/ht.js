class H3SuppParams {
  constructor() {
    this.Setup()
  }

  Iterations: number

  MaxTiles: number

  UhsCutoff: number

  BallCutoff: number

  RemoveDangling: boolean

  Output: H3.Output = H3.Output.POVRay

  #Setup() {
    if (this.Output == H3.Output.STL) {
      this.Iterations = 2
      this.MaxTiles = 500
      this.UhsCutoff = 0.002
      this.BallCutoff = 0.0158
      this.RemoveDangling = true
      // UhsCutoff = 0.02;
      // BallCutoff = 0.015;
      this.BallCutoff = 0.03
      //  363
    } else {
      this.Iterations = 10
      this.MaxTiles = 750
      this.UhsCutoff = 0.001
      this.BallCutoff = 0.01
      this.RemoveDangling = false
    }
  }
}

///  <summary>
///  This class is used to generate the really exotic H3 honeycombs,
///  the {4,4,4}, {3,6,3}, and {6,3,6}.
///  </summary>
export class H3Supp {
  ///  <summary>
  ///  Our approach will be:
  ///  (1) Generate a portion of one cell.
  ///  (2) Reflect all facets in the central facet, to get things filled-in inside the central facet.  (Trim small edges here?)
  ///  (3) Copy this region around the plane, and go back to step (2) if density is not high enough.
  ///  (4) Map to Ball, trimming edges that become too small.
  ///  NOTE: All verts are on the boundary, so we can reflect around
  //           in circles on the plane at infinity, rather than spheres.
  ///  </summary>
  static GenerateExotic(honeycomb: EHoneycomb, settings: H3.Settings) {
    settings.AngularThickness = 0.17
    let tiling: Tiling
    let baseTile: Tile
    H3Supp.GetAssociatedTiling(
      honeycomb,
      /* out */ tiling,
      /* out */ baseTile,
    )
    let edges: List<H3.Cell.Edge> = new List<H3.Cell.Edge>()
    for (let seg: Segment in baseTile.Boundary.Segments) {
      edges.Add(new H3.Cell.Edge(seg.P1, seg.P2))
    }

    settings.Position = Polytope.Projection.FaceCentered
    let scale: number = 1
    let offset: Vector3D = new Vector3D()
    if (settings.Position == Polytope.Projection.FaceCentered) {
      scale = H3Supp.FaceCenteredScale(baseTile.VertexCircle)
      offset = new Vector3D()
    } else if (settings.Position == Polytope.Projection.EdgeCentered) {
      scale = H3Supp.EdgeCenteredScale(baseTile)
      offset = baseTile.Boundary.Segments[0].Midpoint
    }

    let iterations: number = m_params.Iterations
    for (let i: number = 0; i < iterations; i++) {
      edges = H3Supp.DoOneStep(edges, tiling, baseTile.VertexCircle)
    }

    edges = H3Supp.CopyAndProject(edges, tiling, scale, offset)
    if (m_params.RemoveDangling) {
      let edgeDict: Record<H3.Cell.Edge, number> = edges.ToRecord(
        () => {},
        e,
        () => {},
        1,
      )
      H3.RemoveDanglingEdgesRecursive(edgeDict)
      edges = edgeDict.Keys.ToList()
    }

    let outputFileName: string =
      H3.m_baseDir + Honeycomb.String(honeycomb, false)
    System.IO.File.Delete(outputFileName)
    if (m_params.Output == H3.Output.STL) {
      outputFileName += '.stl'
      //  Now mesh the edges.
      let mesh: Shapeways = new Shapeways()
      for (let edge: H3.Cell.Edge in edges) {
        //  Append to the file vs. writing out all at once because I was running out of memory otherwise.
        mesh = new Shapeways()
        let div: number
        H3Models.Ball.LODThin(edge.Start, edge.End, /* out */ div)
        mesh.Div = div
        H3.Util.AddToMeshInternal(mesh, edge.Start, edge.End)
        mesh.Mesh.Scale(settings.Scale)
        STL.AppendMeshToSTL(mesh.Mesh, outputFileName)
      }
    } else {
      outputFileName += '.pov'
      PovRay.WriteH3Edges(
        new PovRay.Parameters(),
        edges.ToArray(),
        outputFileName,
      )
    }
  }

  static #m_params: H3SuppParams = new H3SuppParams()

  static IsExotic(honeycomb: EHoneycomb): boolean {
    return (
      honeycomb == EHoneycomb.H444 ||
      honeycomb == EHoneycomb.H636 ||
      honeycomb == EHoneycomb.H363
    )
  }

  static #GetPQ(
    honeycomb: EHoneycomb,
    /* out */ p: number,
    /* out */ q: number,
  ) {
    let r: number
    Honeycomb.PQR(honeycomb, /* out */ p, /* out */ q, /* out */ r)
  }

  static #GetAssociatedTiling(
    honeycomb: EHoneycomb,
    /* out */ tiling: Tiling,
    /* out */ baseTile: Tile,
  ) {
    let q: number
    let p: number
    H3Supp.GetPQ(honeycomb, /* out */ p, /* out */ q)
    let tilingConfig: TilingConfig = new TilingConfig(
      p,
      q,
      /* maxTiles:*/ m_params.MaxTiles,
    )
    tiling = new Tiling()
    tiling.Generate(tilingConfig)
    baseTile = Tiling.CreateBaseTile(tilingConfig)
  }

  ///  <summary>
  ///  Helper to do one step of reflections.
  ///  Returns a new list of region edges.
  ///  </summary>
  static #DoOneStep(
    regionEdges: List<H3.Cell.Edge>,
    tiling: Tiling,
    region: Circle,
  ): List<H3.Cell.Edge> {
    let newEdges: HashSet<H3.Cell.Edge> = new HashSet<H3.Cell.Edge>(
      new H3.Cell.EdgeEqualityComparer(),
    )
    for (let tile: Tile in tiling.Tiles) {
      for (let edge: H3.Cell.Edge in regionEdges) {
        let toAdd: H3.Cell.Edge = null
        if (!Tolerance.Zero(tile.Center.Abs())) {
          //  Translate
          //  The isometry is necessary for the 363, but seems to mess up 636
          let start: Vector3D = tile.Isometry.Apply(edge.Start)
          let end: Vector3D = tile.Isometry.Apply(edge.End)
          // Vector3D start = edge.Start + tile.Center;
          // Vector3D end = edge.End + tile.Center;
          //  Reflect
          start = region.ReflectPoint(start)
          end = region.ReflectPoint(end)
          toAdd = new H3.Cell.Edge(start, end)
        } else {
          toAdd = edge
        }

        if (H3Supp.EdgeOkUHS(toAdd, region)) {
          newEdges.Add(toAdd)
        }
      }
    }

    return newEdges.ToList()
  }

  static #EdgeOkUHS(edge: H3.Cell.Edge, region: Circle): boolean {
    if (
      Tolerance.GreaterThan(edge.Start.Abs(), region.Radius) ||
      Tolerance.GreaterThan(edge.End.Abs(), region.Radius)
    ) {
      return false
    }

    return H3Supp.EdgeOk(edge, m_params.UhsCutoff)
  }

  static #EdgeOkBall(edge: H3.Cell.Edge): boolean {
    return H3Supp.EdgeOk(edge, m_params.BallCutoff)
  }

  static #EdgeOk(edge: H3.Cell.Edge, cutoff: number): boolean {
    return edge.Start.Dist(edge.End) > cutoff
  }

  static #CopyAndProject(
    regionEdges: List<H3.Cell.Edge>,
    tiling: Tiling,
    scale: number,
    offset: Vector3D,
  ): List<H3.Cell.Edge> {
    let newEdges: HashSet<H3.Cell.Edge> = new HashSet<H3.Cell.Edge>(
      new H3.Cell.EdgeEqualityComparer(),
    )
    // foreach( Tile tile in tiling.Tiles )    // Needed for doing full ball (rather than just half of it)
    let tile: Tile = tiling.Tiles.First()
    for (let edge: H3.Cell.Edge in regionEdges) {
      //  Translation
      //  The isometry is necessary for the 363, but seems to mess up 636
      let start: Vector3D = tile.Isometry.Apply(edge.Start) + offset
      let end: Vector3D = tile.Isometry.Apply(edge.End) + offset
      // Vector3D start = edge.Start + tile.Center + offset;
      // Vector3D end = edge.End + tile.Center + offset;
      //  Scaling
      start = start * scale
      end = end * scale
      //  Projections
      start = H3Models.UHSToBall(start)
      end = H3Models.UHSToBall(end)
      let transformed: H3.Cell.Edge = new H3.Cell.Edge(start, end)
      if (H3Supp.EdgeOkBall(transformed)) {
        newEdges.Add(transformed)
      }
    }

    return newEdges.ToList()
  }

  static #FaceCenteredScale(vertexCircle: Circle): number {
    //  The radius is the height of the face in UHS.
    //  We need to scale this to be at (0,0,1)
    return 1 / vertexCircle.Radius
  }

  static #EdgeCenteredScale(baseTile: Tile): number {
    let seg: Segment = baseTile.Boundary.Segments[0]
    return 1 / (seg.Length / 2)
  }
}
