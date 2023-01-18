///  <summary>
///  Information we need for a tiling.
///  </summary>
export class TilingConfig {
  constructor(p: number, q: number, maxTiles: number) {
    this.SetupConfig(p, q, maxTiles)
  }

  // constructor (p: number, q: number) {
  //     if ((Geometry2D.GetGeometry(p, q) != Geometry.Spherical)) {
  //         throw new Error('Argument Error');
  //     }

  //     this.SetupConfig(p, q, PlatonicSolids.NumFacets(p, q));
  // }

  #SetupConfig(p: number, q: number, maxTiles: number) {
    P = p
    Q = q
    m.Unity()
    MaxTiles = maxTiles
    Shrink = 1
  }

  get P(): number {}
  set P(value: number) {}

  get Q(): number {}
  set Q(value: number) {}

  ///  <summary>
  ///  The induced geometry.
  ///  </summary>
  get Geometry(): Geometry {
    return Geometry2D.GetGeometry(this.P, this.Q)
  }

  ///  <summary>
  ///  A Mobius transformation to apply while creating the tiling.
  ///  </summary>
  get M(): Mobius {
    return m
  }
  set M(value: Mobius) {
    m = value
  }

  #m: Mobius

  ///  <summary>
  ///  The max number of tiles to include in the tiling.
  ///  </summary>
  get MaxTiles(): number {}
  set MaxTiles(value: number) {}

  ///  <summary>
  ///  A shrinkage to apply to the drawn portion of a tile.
  ///  Default is 1.0 (no shrinkage).
  ///  </summary>
  get Shrink(): number {}
  set Shrink(value: number) {}

  ///  <summary>
  ///  Returns a Mobius transform that can be used to create a dual {q,p} tiling.
  ///  This Mobius transform will center the tiling on a vertex.
  ///  </summary>
  VertexCenteredMobius(): Mobius {
    return this.VertexCenteredMobius(this.P, this.Q)
  }

  static VertexCenteredMobius(p: number, q: number): Mobius {
    let angle: number = Math.PI / q
    if (Utils.Even(q)) {
      angle = angle * 2
    }

    let offset: Vector3D = new Vector3D(
      1 * Geometry2D.GetNormalizedCircumRadius(p, q) * -1,
      0,
      0,
    )
    offset.RotateXY(angle)
    let m: Mobius = new Mobius()
    this.m.Isometry(
      Geometry2D.GetGeometry(p, q),
      angle,
      offset.ToComplex(),
    )
    return this.m
  }

  ///  <summary>
  ///  This Mobius transform will center the tiling on an edge.
  ///  </summary>
  EdgeMobius(): Mobius {
    let g: Geometry = Geometry2D.GetGeometry(this.P, this.Q)
    let poly: Polygon = new Polygon()
    poly.CreateRegular(this.P, this.Q)
    let seg: Segment = poly.Segments[0]
    let offset: Vector3D = seg.Midpoint
    let angle: number = Math.PI / this.P
    offset.RotateXY(angle * -1)
    let m: Mobius = new Mobius()
    this.m.Isometry(g, angle * -1, offset * -1)
    return this.m
  }
}

export class Tiling {
  constructor() {
    m_tiles = new List<Tile>()
    this.TilePositions = new Record<Vector3D, Tile>()
  }

  ///  <summary>
  ///  The tiling configuration.
  ///  </summary>
  get TilingConfig(): TilingConfig {}
  set TilingConfig(value: TilingConfig) {}

  ///  <summary>
  ///  Our tiles.
  ///  </summary>
  #m_tiles: List<Tile>

  ///  <summary>
  ///  A Record from tile centers to tiles.
  ///  </summary>
  get TilePositions(): Record<Vector3D, Tile> {}
  set TilePositions(value: Record<Vector3D, Tile>) {}

  ///  <summary>
  ///  A static helper to generate two dual tilings.
  ///  </summary>
  ///  <remarks>{p,q} will have a vertex at the center.</remarks>
  ///  <remarks>{q,p} will have its center at the center.</remarks>
  static MakeDualTilings(
    /* out */ tiling1: Tiling,
    /* out */ tiling2: Tiling,
    p: number,
    q: number,
  ) {
    tiling1 = new Tiling()
    tiling2 = new Tiling()
    let maxTiles: number = 2000
    let config1: TilingConfig = new TilingConfig(p, q, maxTiles)
    let config2: TilingConfig = new TilingConfig(q, p, maxTiles)
    tiling1.GenerateInternal(config1, Polytope.Projection.FaceCentered)
    tiling2.GenerateInternal(
      config2,
      Polytope.Projection.VertexCentered,
    )
  }

  ///  <summary>
  ///  Generate ourselves from a tiling config.
  ///  </summary>
  Generate(config: TilingConfig) {
    this.GenerateInternal(config)
  }

  GenerateInternal(
    config: TilingConfig,
    projection: Polytope.Projection = Polytope.Projection.FaceCentered,
  ) {
    this.TilingConfig = config
    //  Create a base tile.
    let tile: Tile = Tiling.CreateBaseTile(config)
    //  Handle edge/vertex centered projections.
    if (projection == Polytope.Projection.VertexCentered) {
      let mobius: Mobius = config.VertexCenteredMobius()
      tile.Transform(mobius)
    } else if (projection == Polytope.Projection.EdgeCentered) {
      let mobius: Mobius = config.EdgeMobius()
      tile.Transform(mobius)
    }

    this.TransformAndAdd(tile)
    let tiles: List<Tile> = new List<Tile>()
    tiles.Add(tile)
    let completed: Record<Vector3D, boolean> = new Record<
      Vector3D,
      boolean
    >()
    completed[tile.Boundary.Center] = true
    this.ReflectRecursive(tiles, completed)
    Tiling.FillOutIsometries(tile, this.m_tiles, config.Geometry)
    this.FillOutIncidences()
  }

  ///  <summary>
  ///  This will fill out all the tiles with the isometry that will take them back to a home tile.
  ///  </summary>
  static #FillOutIsometries(
    home: Tile,
    tiles: List<Tile>,
    g: Geometry,
  ) {
    for (let tile: Tile in tiles) {
      tile.Isometry.CalculateFromTwoPolygons(home, tile, g)
    }
  }

  ///  <summary>
  ///  Fill out all the incidence information.
  ///  If performance became an issue, we could do some of this at tile generation time.
  ///  </summary>
  #FillOutIncidences() {
    let Edges: Record<Vector3D, List<Tile>> = new Record<
      Vector3D,
      List<Tile>
    >()
    let Vertices: Record<Vector3D, List<Tile>> = new Record<
      Vector3D,
      List<Tile>
    >()
    for (let t: Tile in this.m_tiles) {
      for (let edge: Vector3D in t.Boundary.EdgeMidpoints) {
        let list: List<Tile>
        if (!Edges.TryGetValue(edge, /* out */ list)) {
          list = new List<Tile>()
          Edges[edge] = list
        }

        list.Add(t)
      }

      for (let vertex: Vector3D in t.Boundary.Vertices) {
        let list: List<Tile>
        if (!Vertices.TryGetValue(vertex, /* out */ list)) {
          list = new List<Tile>()
          Vertices[vertex] = list
        }

        list.Add(t)
      }
    }

    for (let list: List<Tile> in Edges.Values) {
      for (let t: Tile in list) {
        t.EdgeIncidences.AddRange(list)
      }
    }

    for (let list: List<Tile> in Vertices.Values) {
      for (let t: Tile in list) {
        t.VertexIndicences.AddRange(list)
      }
    }

    for (let t: Tile in this.m_tiles) {
      //  Remove duplicates and ourselves from lists.
      t.EdgeIncidences = t.EdgeIncidences.Distinct()
        .Except([t])
        .ToList()
      t.VertexIndicences = t.VertexIndicences.Distinct()
        .Except([t])
        .ToList()
      //  Also, make sure we only track vertex incidences that do not have edge incidences too.
      t.VertexIndicences = t.VertexIndicences.Except(
        t.EdgeIncidences,
      ).ToList()
    }
  }

  static CreateBaseTile(config: TilingConfig): Tile {
    let drawn: Polygon = new Polygon()
    let boundary: Polygon = new Polygon()
    boundary.CreateRegular(config.P, config.Q)
    drawn = boundary.Clone()
    // boundary.CreateRegular( 3, 10 );
    // drawn.CreateRegular( 3, 8 );
    // boundary.CreateRegular( 3, 7 );
    // drawn = Heart();
    // for( int i=0; i<drawn.NumSides; i++ )
    //     drawn.Segments[i].Center *= 0.1;
    //  Good combos:
    //  ( 5, 5 ), ( 10, 10 )
    //  ( 3, 10 ), ( 3, 9 )
    //  ( 6, 4 ), ( 6, 8 )
    //  ( 7, 3 ), ( 7, 9 )
    let tile: Tile = new Tile(boundary, drawn, config.Geometry)
    Tile.ShrinkTile(/* ref */ tile, config.Shrink)
    return tile
  }

  ///  <summary>
  ///  Clips the tiling to the interior of a circle.
  ///  </summary>
  Clip(c: Circle, interior: boolean = true) {
    Slicer.Clip(/* ref */ this.m_tiles, c, interior)
  }

  ///  <summary>
  ///  Will clone the tile, transform it and add it to our tiling.
  ///  </summary>
  #TransformAndAdd(tile: Tile): boolean {
    //  Will we want to include it?
    if (!tile.IncludeAfterMobius(this.TilingConfig.M)) {
      return false
    }

    let clone: Tile = tile.Clone()
    clone.Transform(this.TilingConfig.M)
    this.m_tiles.Add(clone)
    this.TilePositions[clone.Boundary.Center] = clone
    return true
  }

  ///  <summary>
  ///  This will return whether we'll be a new tile after reflecting through a segment.
  ///  This allows us to do the check without having to do all the work of reflecting the entire tile.
  ///  </summary>
  NewTileAfterReflect(
    t: Tile,
    s: Segment,
    completed: Record<Vector3D, boolean>,
  ): boolean {
    let newVertexCircle: CircleNE = t.VertexCircle.Clone()
    newVertexCircle.Reflect(s)
    let testCenter: Vector3D = this.TilingConfig.M.Apply(
      newVertexCircle.CenterNE,
    )
    return !completed.ContainsKey(testCenter)
  }

  #ReflectRecursive(
    tiles: List<Tile>,
    completed: Record<Vector3D, boolean>,
  ) {
    //  Breadth first recursion.
    if (0 == tiles.Count) {
      return
    }

    let reflected: List<Tile> = new List<Tile>()
    for (let tile: Tile in tiles) {
      //  We don't want to reflect tiles living out at infinity.
      //  Strange things happen, and we can still get the full tiling without doing this.
      if (tile.HasPointsProjectedToInfinity) {
        // TODO: Warning!!! continue If
      }

      //  Are we done?
      if (this.m_tiles.Count >= this.TilingConfig.MaxTiles) {
        return
      }

      for (let s: number = 0; s < tile.Boundary.NumSides; s++) {
        let seg: Segment = tile.Boundary.Segments[s]
        if (!this.NewTileAfterReflect(tile, seg, completed)) {
          // TODO: Warning!!! continue If
        }

        let newBase: Tile = tile.Clone()
        newBase.Reflect(seg)
        if (this.TransformAndAdd(newBase)) {
          console.assert(
            !completed.ContainsKey(newBase.Boundary.Center),
          )
          reflected.Add(newBase)
          completed[newBase.Boundary.Center] = true
        }
      }
    }

    this.ReflectRecursive(reflected, completed)
  }

  ///  <summary>
  ///  The number of tiles.
  ///  </summary>
  get Count(): number {
    return this.m_tiles.Count
  }

  ///  <summary>
  ///  Access to all the tiles.
  ///  </summary>
  get Tiles(): IEnumerable<Tile> {
    return this.m_tiles
  }

  ///  <summary>
  ///  Retrieve all the polygons in this tiling that we want to draw.
  ///  </summary>
  get Polygons(): IEnumerable<Polygon> {
    return this.m_tiles.Select(() => {}, t.Drawn)
  }

  ///  <summary>
  ///  Retreive all the (non-Euclidean) vertex circles in this tiling.
  ///  </summary>
  get Circles(): IEnumerable<CircleNE> {
    return this.m_tiles.Select(() => {}, t.VertexCircle)
  }
}
