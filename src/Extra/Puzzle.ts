export interface IStatusCallback {
  Cancelled: boolean

  Status: (message: string) => any
}

class IncidenceData {
  constructor(c: Cell, e: number, i: Cell, ie: number, r: boolean) {
    Cell = c
    Edge = e
    Incident = i
    IncidentEdge = ie
    Reflected = r
  }

  get Cell(): Cell {}

  set Cell(value: Cell) {}

  get Edge(): number {}

  set Edge(value: number) {}

  get Incident(): Cell {}

  set Incident(value: Cell) {}

  get IncidentEdge(): number {}

  set IncidentEdge(value: number) {}

  get Reflected(): boolean {}

  set Reflected(value: boolean) {}
}

class PuzzleIdentifications extends Array<PuzzleIdentification> {}

//  ZZZ - clean up naming (confusing with classes in PuzzleConfig.cs).
class PuzzleIdentification {
  get UseMirrored(): boolean {}

  set UseMirrored(value: boolean) {}

  //  ZZZ - move to list class below?
  get Unmirrored(): Isometry {}

  set Unmirrored(value: Isometry) {}

  get Mirrored(): Isometry {}

  set Mirrored(value: Isometry) {}

  get Isometries(): IEnumerable<Isometry> {
    let useMe: Array<Isometry> = new Array<Isometry>()
    if (this.UseMirrored) {
      useMe.Add(this.Unmirrored)
      useMe.Add(this.Mirrored)
    } else {
      useMe.Add(this.Unmirrored)
    }

    return useMe
  }
}

export class Puzzle {
  constructor() {
    this.m_masters = new Array<Cell>()
    this.m_slaves = new Dictionary<Cell, Array<Cell>>()
    this.IRPCells = []
    this.m_stateCalcCells = new Array<Cell>()
    this.m_stateCalcCellSet = new HashSet<Cell>()
    this.AllTwistData = new Array<IdentifiedTwistData>()
    this.Config = new PuzzleConfig()
    this.TextureHelper = new TextureHelper()
    this.MacroList = new MacroList()
  }

  ///  <summary>
  ///  The puzzle configuration for this puzzle.
  ///  </summary>
  get Config(): PuzzleConfig {}

  set Config(value: PuzzleConfig) {}

  ///  <summary>
  ///  A description of the topology.
  ///  </summary>
  get Topology(): string {}

  set Topology(value: string) {}

  ///  <summary>
  ///  Access to the master cells for this puzzle.
  ///  </summary>
  get MasterCells(): Array<Cell> {
    return m_masters
  }

  m_masters: Array<Cell>

  ///  <summary>
  ///  The border of the fundamental domain.
  ///  </summary>
  get MasterBoundary(): Array<Segment> {}

  set MasterBoundary(value: Array<Segment>) {}

  ///  <summary>
  ///  Access to the slave cells for a master cell.
  ///  </summary>
  SlaveCells(master: Cell): IEnumerable<Cell> {
    let slaves: Array<Cell>
    if (!m_slaves.TryGetValue(master, /* out */ slaves)) {
      return []
    }

    return slaves
  }

  m_slaves: Dictionary<Cell, Array<Cell>>

  ///  <summary>
  ///  Access to all cells.
  ///  </summary>
  get AllCells(): IEnumerable<Cell> {
    for (let master: Cell in this.MasterCells) {
      yield
      return master
      for (let slave: Cell in this.SlaveCells(master)) {
        yield
      }

      return slave
    }
  }

  ///  <summary>
  ///  Access to all the slave cells in the puzzle.
  ///  </summary>
  get AllSlaveCells(): IEnumerable<Cell> {
    for (let master: Cell in this.MasterCells) {
      for (let slave: Cell in this.SlaveCells(master)) {
        yield
      }
    }

    return slave
  }

  IsStateCalcCell(cell: Cell): boolean {
    return m_stateCalcCellSet.Contains(cell)
  }

  ///  <summary>
  ///  Access to the cells needed to render on a rolled up surface.
  ///  </summary>
  get SurfaceRenderingCells(): Array<Cell> {}

  set SurfaceRenderingCells(value: Array<Cell>) {}

  ///  <summary>
  ///  The cells for an associated IRP, if we have one.
  ///  </summary>
  get IRPCells(): Array<Cell> {}

  set IRPCells(value: Array<Cell>) {}

  ///  <summary>
  ///  Access to IRP translations.
  ///  </summary>
  get IRPTranslations(): IEnumerable<Translation> {
    if (m_translations == null) {
      return []
    }

    return m_translations
  }

  m_translations: Array<Translation>

  ///  <summary>
  ///  The main list of all twist data.
  ///  </summary>
  get AllTwistData(): Array<IdentifiedTwistData> {}

  set AllTwistData(value: Array<IdentifiedTwistData>) {}

  ///  <summary>
  ///  Access to the puzzle state.
  ///  </summary>
  get State(): State {}

  set State(value: State) {}

  ///  <summary>
  ///  Our twist history.
  ///  </summary>
  get TwistHistory(): TwistHistory {}

  set TwistHistory(value: TwistHistory) {}

  ///  <summary>
  ///  Macros for this puzzle.
  ///  </summary>
  get MacroList(): MacroList {}

  set MacroList(value: MacroList) {}

  ///  <summary>
  ///  Whether or not we have surface config.
  ///  </summary>
  get HasSurfaceConfig(): boolean {
    return (
      this.Config.SurfaceConfig != null &&
      this.Config.SurfaceConfig.Configured
    )
  }

  ///  <summary>
  ///  Whether or not we have an associated skew polyhedron.
  ///  </summary>
  get HasSkew(): boolean {}

  set HasSkew(value: boolean) {}

  ///  <summary>
  ///  Whether or not we can only be shown as a skew polyhedron.
  ///  </summary>
  get OnlySkew(): boolean {}

  set OnlySkew(value: boolean) {}

  ///  <summary>
  ///  Clear out our internal caches.
  ///  </summary>
  Clear() {
    this.m_masters.Clear()
    this.m_slaves.Clear()
    this.IRPCells = []
    this.m_translations = null
    m_stateCalcCells.Clear()
    this.AllTwistData.Clear()
    m_twistDataNearTree.Reset(NearTree.GtoM(this.Config.Geometry))
    m_cellNearTree.Reset(NearTree.GtoM(this.Config.Geometry))
    this.MacroList.Clear()
    this.Topology = string.Empty
  }

  static StatusOrCancel(callback: IStatusCallback, message: string) {
    if (callback.Cancelled) {
      throw new OperationCanceledException('Puzzle building cancelled.')
    }

    callback.Status(message)
  }

  GenTiling(num: number): Tiling {
    let tilingConfig: TilingConfig = new TilingConfig(
      this.Config.P,
      this.Config.Q,
      num,
    )
    tilingConfig.Shrink = this.Config.TileShrink
    let tiling: Tiling = new Tiling(TilingConfig)
    tiling.Generate()
    return tiling
  }

  ///  <summary>
  ///  Build the puzzle.
  ///  </summary>
  Build(callback: IStatusCallback) {
    this.Clear()
    //  Generate a tiling for use with this puzzle.
    StatusOrCancel(callback, 'creating underlying tiling...')
    let tiling: Tiling = this.GenTiling(this.Config.NumTiles)
    let template: Tile = tiling.Tiles.First()
    //  This will track all the tiles we've turned into cells.
    let completed: Dictionary<Vector3D, Cell> = new Dictionary<
      Vector3D,
      Cell
    >()
    StatusOrCancel(
      callback,
      'precalculating identification isometries...',
    )
    let identifications: PuzzleIdentifications =
      this.PrecalcIdentificationIsometries(tiling, template)
    //  Add in all of our cells.
    if (callback.Cancelled) {
      return
    }

    callback.Status('adding in cells...')
    for (let t: Tile in this.MasterCandidates(tiling)) {
      //  Have we already done this tile?
      if (completed.ContainsKey(t.Center)) {
        continue
      }

      //  Add it (this will add all the slaves too).
      this.AddMaster(t, tiling, identifications, completed)
    }

    StatusOrCancel(callback, 'analyzing topology...')
    let topology: TopologyAnalyzer = new TopologyAnalyzer(
      this,
      template,
    )
    topology.Analyze()
    this.Topology = topology.ToString()
    StatusOrCancel(callback, 'marking cells for state calcs...')
    let templateTwistDataArray: Array<TwistData> =
      this.TemplateTwistData(template).ToArray()
    this.MarkCellsForStateCalcs(
      tiling,
      completed,
      templateTwistDataArray,
      topology,
    )
    //  Slice up the template tile.
    StatusOrCancel(callback, 'slicing up template tile...')
    let tStickers: Array<Polygon> = this.SliceUpTemplate(
      template,
      templateTwistDataArray,
    )
    StatusOrCancel(callback, 'adding in stickers...')
    if (this.Config.Geometry == Geometry.Spherical) {
      //  ZZZ - this is only here because we're still drawing spherical directly (without textures).
      for (let cell: Cell in completed.Values) {
        this.AddStickersToCell(cell, tStickers)
      }
    } else {
      for (let cell: Cell in m_stateCalcCells) {
        this.AddStickersToCell(cell, tStickers)
      }
    }

    // StatusOrCancel(callback, "setting up texture coordinates...");
    this.SetupTextureCoords()
    // StatusOrCancel(callback, "preparing twisting...");
    this.SetupTwistDataForFullPuzzle(
      tiling,
      topology,
      templateTwistDataArray,
    )
    this.SetupCellNearTree(completed)
    // StatusOrCancel(callback, "preparing surface data...");
    this.PrepareSurfaceData(callback)
    // StatusOrCancel(callback, "loading and preparing irp data...");
    try {
      this.LoadIRP(callback)
    } catch (ex) {
      console.log(ex.stack)
      // StatusOrCancel(callback, (ex.Message + ("" + ex.StackTrace)));
    }

    StatusOrCancel(
      callback,
      'calculating fundamental domain boundary...',
    )
    this.CalcBoundary()
    // TraceGraph();
    if (this.Config.IsToggling) {
      StatusOrCancel(callback, 'populating neighbors...')
      this.PopulateNeighbors(tiling, completed)
    }

    this.State = new State(this.MasterCells.Count, tStickers.Count)
    this.TwistHistory = new TwistHistory()
    let count: number = this.MasterCells.Count
    for (let master: Cell in this.MasterCells) {
      count = count + this.SlaveCells(master).Count()
    }

    Debug.Assert(tiling.Tiles.Count() == completed.Count())
    callback.Status('Number of colors:' + this.MasterCells.Count)
    callback.Status('Number of tiles:' + tiling.Tiles.Count())
    callback.Status('Number of cells:' + count)
    callback.Status('Number of stickers per cell:' + tStickers.Count)
  }

  CalcBoundary() {
    let segments: Dictionary<Vector3D, Array<Segment>> = new Dictionary<
      Vector3D,
      Array<Segment>
    >()
    for (let c: Cell in this.m_masters) {
      for (let s: Segment in c.Boundary.Segments) {
        let segs: Array<Segment>
        if (!segments.TryGetValue(s.Midpoint, /* out */ segs)) {
          segs = new Array<Segment>()
        }

        segs.Add(s)
        segments[s.Midpoint] = segs
      }
    }

    this.MasterBoundary = segments.Values.Where(() => {}, l.Count == 1)
      .Select(() => {}, l.First())
      .ToArray()
  }

  MasterCandidates(tiling: Tiling): IEnumerable<Tile> {
    let masterCandidates: IEnumerable<Tile> = tiling.Tiles
    //  Hack to make the fundamental region look better for some Klein bottle puzzles.
    //  (to match Mathologer video).
    if (this.Config.Geometry == Geometry.Euclidean) {
      if (
        this.Config.P == 4 &&
        this.Config.Q == 4 &&
        this.Config.ExpectedNumColors == 4
      ) {
        let index: index<
          index,
          ToArray,
          Config.P,
          Config.Q,
          Config.ExpectedNumColors,
          masterCandidates,
          tiling.Tiles.Where,
          t,
          index
        >
        8 || index == 15
        ToArray()
      }
    }

    return masterCandidates
  }

  SetupTemplateSlicingCircle(
    template: Tile,
    d: Distance,
    m: Mobius,
  ): CircleNE {
    let circle: CircleNE = new CircleNE()
    circle.CenterNE = template.Center
    circle.Center = template.Center
    let radiusInGeometry: number = d.Dist(this.Config.P, this.Config.Q)
    switch (this.Config.Geometry) {
      case Geometry.Spherical:
        circle.Radius = Spherical2D.s2eNorm(radiusInGeometry)
        break
      case Geometry.Euclidean:
        circle.Radius = radiusInGeometry
        break
      case Geometry.Hyperbolic:
        circle.Radius = DonHatch.h2eNorm(radiusInGeometry)
        break
    }

    circle.Transform(m)
    return circle
  }

  SetupTemplateSlicingCircles(
    template: Tile,
    center: Vector3D,
    distances: IEnumerable<Distance>,
  ): Array<CircleNE> {
    let m: Mobius = new Mobius()
    m.Isometry(this.Config.Geometry, 0, center)
    let slicers: Array<CircleNE> = new Array<CircleNE>()
    for (let d: Distance in distances) {
      slicers.Add(this.SetupTemplateSlicingCircle(template, d, m))
    }

    return slicers.ToArray()
  }

  TemplateTwistData(template: Tile): IEnumerable<TwistData> {
    let result: Array<TwistData> = new Array<TwistData>()
    if (this.Config.SlicingCircles == null) {
      return result
    }

    let circles: SlicingCircles = this.Config.SlicingCircles
    let faceCentered: Array<Distance> = circles.FaceCentered
    if (circles.FaceTwisting) {
      let twistData: TwistData = new TwistData()
      twistData.TwistType = ElementType.Face
      twistData.Center = template.Center
      twistData.Order = this.Config.P
      twistData.Circles = this.SetupTemplateSlicingCircles(
        template,
        twistData.Center,
        faceCentered,
      )
      result.Add(twistData)
    }

    for (let s: Segment in template.Boundary.Segments) {
      let edgeCentered: Array<Distance> = circles.EdgeCentered
      if (circles.EdgeTwisting) {
        let twistData: TwistData = new TwistData()
        twistData.TwistType = ElementType.Edge
        twistData.Center = s.Midpoint
        twistData.Order = 2
        twistData.Circles = this.SetupTemplateSlicingCircles(
          template,
          twistData.Center,
          edgeCentered,
        )
        result.Add(twistData)
      }

      let vertexCentered: Array<Distance> = circles.VertexCentered
      if (circles.VertexTwisting) {
        let twistData: TwistData = new TwistData()
        twistData.TwistType = ElementType.Vertex
        twistData.Center = s.P1
        twistData.Order = this.Config.Q
        twistData.Circles = this.SetupTemplateSlicingCircles(
          template,
          twistData.Center,
          vertexCentered,
        )
        result.Add(twistData)
      }

      //  Long way to go to make this general.
      if (this.Config.Earthquake) {
        let twistData: TwistData = new TwistData()
        twistData.TwistType = ElementType.Vertex
        twistData.Center = s.P1
        twistData.Order = 3
        //  The only use here is in controlling twist speed.
        twistData.NumSlices = 3
        //  We'll use the slices as a way to mark the 3 directions.
        let m: Mobius = new Mobius()
        m.Isometry(
          Geometry.Hyperbolic,
          Euclidean2D.AngleToCounterClock(new Vector3D(1, 0), s.P1),
          new Vector3D(),
        )
        twistData.Pants = new Pants()
        twistData.Pants.SetupHexagonForKQ()
        if (Pants.TemplateHex == null) {
          Pants.TemplateHex = twistData.Pants.Hexagon.Clone()
        }

        twistData.Pants.Transform(m)
        c.Transform(m)
        return c
        // Warning!!! Lambda constructs are not supported
        twistData.Circles = Pants.SystolesForKQ()
          .Select(() => {})
          .ToArray()
        result.Add(twistData)
      }
    }

    return result
  }

  ///  <summary>
  ///  Returns all the circles we want to use to slice up a template cell.
  ///  </summary>
  Slicers(
    template: Tile,
    templateSlicers: IEnumerable<TwistData>,
  ): IEnumerable<CircleNE> {
    let complete: HashSet<CircleNE> = new HashSet<CircleNE>(
      new CircleNE_EqualityComparer(),
    )
    let templateTile: Array<Tile> = new Array<Tile>()
    templateTile.Add(template)
    if (this.Config.CoxeterComplex) {
      //  templateSlicers will be empty, since we don't allow twisting.
      //  Fill it out with the slicers we want.
      let td: TwistData = new TwistData()
      let c: Circle = new Circle(
        template.Boundary.Start.Value,
        template.Boundary.Mid.Value,
      )
      for (let i: number = 0; i < this.Config.P; i++) {
        let m: Mobius = new Mobius()
        m.Elliptic(
          Geometry.Spherical,
          new Complex(),
          Math.PI * (i / this.Config.P),
        )
        let cNE: CircleNE = new CircleNE(
          c,
          template.Boundary.Segments[0].P2,
        )
        cNE.Transform(m)
        yield
        return cNE
      }
    } else {
      for (let twistData: TwistData in templateSlicers) {
        for (let slicingCircle: CircleNE in twistData.Circles) {
          //  Use all edge and vertex incident tiles.
          //  ZZZ - It's easy to imagine needing to grab more than this in the future.
          for (let t: Tile in templateTile.Concat(
            template.EdgeIncidences.Concat(template.VertexIndicences),
          )) {
            let result: CircleNE = slicingCircle.Clone()
            result.Transform(t.Isometry)
            if (complete.Contains(result)) {
              continue
            }

            complete.Add(result)
            yield
            return result
          }
        }
      }
    }
  }

  //  ZZZ - move all this puzzle slicing code to a separate file.
  SliceUpTemplate(
    template: Tile,
    templateTwistDataArray: Array<TwistData>,
  ): Array<Polygon> {
    let slicers: Array<CircleNE> = this.Slicers(
      template,
      templateTwistDataArray,
    ).ToArray()
    let sliced: Array<Polygon> = null
    let slicees: Array<Polygon> = new Array<Polygon>()
    slicees.Add(template.Drawn)
    this.SliceRecursive(slicees, slicers, /* ref */ sliced)
    if (this.Config.CoxeterComplex) {
      //  Order the stickers, so we can change their colors appropriately.
      sliced = sliced
        .OrderBy(() => {},
        Euclidean2D.AngleToCounterClock(p.Center, new Vector3D(1, 0)))
        .ToArray()
    }

    //  ZZZ - Hacky to special case this,
    //          but I'm not sure how the general solution will go.
    if (this.Config.Earthquake) {
      slicers.Clear()
      for (let i: number = 0; i < 7; i++) {
        let m: Mobius = new Mobius()
        m.Elliptic(
          Geometry.Hyperbolic,
          new Complex(),
          Math.PI * (2 * (i / 7)),
        )
        let c: CircleNE = new CircleNE()
        c.Transform(m)
        slicers.Add(c)
      }

      let result: Array<Polygon> = new Array<Polygon>()
      result.Add(sliced[4])
      slicees = sliced.Except(result).ToArray()
      let temp: Array<Polygon> = new Array<Polygon>()
      this.SliceRecursive(slicees, slicers, /* ref */ temp)
      result.AddRange(temp)
      return result
    }

    //  Some slicing is complicated enough that stickers have zero area.  Remove such stickers.
    sliced = sliced
      .Where(() => {}, !Tolerance.Zero(p.SignedArea))
      .ToArray()
    return sliced
  }

  SliceRecursive(
    slicees: Array<Polygon>,
    slicers: Array<CircleNE>,
    /* ref */ sliced: Array<Polygon>,
  ) {
    //  We're done if we've used up all the slicing circles.
    if (0 == slicers.Count) {
      sliced = slicees
      return
    }

    //  Use the next circle to slice it all up.
    let lastIndex: number = slicers.Count - 1
    let slicer: CircleNE = slicers[lastIndex]
    let tempSliced: Array<Polygon> = new Array<Polygon>()
    for (let slicee: Polygon in slicees) {
      let tempSliced2: Array<Polygon>
      if (this.Config.Earthquake) {
        Slicer.SlicePolygonWithHyperbolicGeodesic(
          slicee,
          slicer,
          this.Config.SlicingCircles.Thickness,
          /* out */ tempSliced2,
        )
      } else {
        Slicer.SlicePolygon(
          slicee,
          slicer,
          this.Config.Geometry,
          this.Config.SlicingCircles.Thickness,
          /* out */ tempSliced2,
        )
      }

      tempSliced.AddRange(tempSliced2)
    }

    //  On to the next level...
    slicers.RemoveAt(lastIndex)
    this.SliceRecursive(tempSliced, slicers, /* ref */ sliced)
  }

  CalcIsometriesFromRelations(
    tiling: Tiling,
    template: Tile,
  ): PuzzleIdentifications {
    let result: PuzzleIdentifications = new PuzzleIdentifications()
    //  Fundamental triangle definition.
    let seg: Segment = template.Boundary.Segments[0]
    let p3: Vector3D = seg.P1
    let p1: Vector3D = new Vector3D()
    let p2: Vector3D = seg.Midpoint
    let source: Array<Vector3D> = [p1, p2, p3]
    let mirrors: Array<Circle> = [
      new Circle(p1, p2),
      new Circle(p1, p3),
      seg.Circle,
    ]
    let id: Mobius = Mobius.Identity()
    let comparer: MobiusEqualityComparer = new MobiusEqualityComparer()
    //  Apply the reflections and get the isometries.
    let relations = GroupPresentation.ReadRelations(
      this.Config.GroupRelations,
    )
    let relationTransforms: HashSet<Mobius> = new HashSet<Mobius>(
      comparer,
    )
    for (let reflections: Array<number> in relations) {
      let p3r: Vector3D = p3
      let p1r: Vector3D = p1
      let p2r: Vector3D = p2
      for (let reflection: number in reflections) {
        this.ReflectInMirror(mirrors, reflection, /* ref */ p1r)
        this.ReflectInMirror(mirrors, reflection, /* ref */ p2r)
        this.ReflectInMirror(mirrors, reflection, /* ref */ p3r)
      }

      let m: Mobius = new Mobius()
      m.MapPoints(p1r, p2r, p3r, p1, p2, p3)
      if (!comparer.Equals(m, id)) {
        relationTransforms.Add(m)
      }
    }

    //
    //  We need to add in conjugations of the relations as well
    //
    let m2: Func<Vector3D, number, number, number, Vector3D>
    let rot: Func<Vector3D, number, number, number, Vector3D> = v
    let n: Func<Vector3D, number, number, number, Vector3D>
    let m1: Func<Vector3D, number, number, number, Vector3D>
    for (let i: number = 0; i < n; i++) {
      v = mirrors[m1].ReflectPoint(v)
      v = mirrors[m2].ReflectPoint(v)
    }

    return v

    let max: number =
      this.Config.P * (this.Config.ExpectedNumColors * 2)
    while (relationTransforms.Count < max) {
      for (let p: number = 0; p < this.Config.P; p++) {
        this.AddConjugations(
          relationTransforms,
          source,
          () => {},
          rot(v, p, 0, 1),
          max,
        )
      }

      this.AddConjugations(
        relationTransforms,
        source,
        () => {},
        mirrors[2].ReflectPoint(v),
        max,
      )
    }

    for (let m: Mobius in relationTransforms) {
      result.Add(this.SetupIdent(m))
    }

    return result
  }

  AddConjugations(
    relationTransforms: HashSet<Mobius>,
    source: Array<Vector3D>,
    transform: Func<Vector3D, Vector3D>,
    max: number,
  ) {
    let conjugations: HashSet<Mobius> = new HashSet<Mobius>(
      relationTransforms,
      new MobiusEqualityComparer(),
    )
    let p3: Vector3D = source[2]
    let p1: Vector3D = source[0]
    let p2: Vector3D = source[1]
    for (let m: Mobius in relationTransforms) {
      let points: Array<Vector3D> = [
        p1,
        p2,
        p3,
        m.Apply(p1),
        m.Apply(p2),
        m.Apply(p3),
      ]
      for (let i: number = 0; i < points.Length; i++) {
        points[i] = transform(points[i])
      }

      let m2: Mobius = new Mobius()
      m2.MapPoints(
        points[0],
        points[1],
        points[2],
        points[3],
        points[4],
        points[5],
      )
      conjugations.Add(m2)
      if (conjugations.Count >= max) {
        break
      }
    }

    relationTransforms.UnionWith(conjugations)
  }

  SetupIdent(m: Mobius): PuzzleIdentification {
    let isometry: Isometry = new Isometry(m, null)
    let ident: PuzzleIdentification = new PuzzleIdentification()
    ident.UseMirrored = false
    ident.Unmirrored = isometry
    return ident
  }

  ReflectInMirror(
    mirrors: Array<Circle>,
    index: number,
    /* ref */ point: Vector3D,
  ) {
    point = mirrors[index].ReflectPoint(point)
  }

  get UsingRelations(): boolean {
    return !string.IsNullOrEmpty(this.Config.GroupRelations)
  }

  ///  <summary>
  ///  This is here for puzzle building performance.  We pre-calculate the array of isometries to apply once,
  ///  vs. reflecting everywhere (which is *much* more expensive).
  ///  </summary>
  PrecalcIdentificationIsometries(
    tiling: Tiling,
    template: Tile,
  ): PuzzleIdentifications {
    if (this.UsingRelations) {
      return this.CalcIsometriesFromRelations(tiling, template)
    }

    let result: PuzzleIdentifications = new PuzzleIdentifications()
    let identificationArray: IdentificationArray =
      this.Config.Identifications
    if (identificationArray == null || identificationArray.Count == 0) {
      return result
    }

    for (let identification: Identification in identificationArray) {
      let initialEdges: Array<number> = identification.InitialEdges
      if (initialEdges == null || initialEdges.Count == 0) {
        initialEdges = new Array<number>()
        for (
          let s: number = 0;
          s < template.Boundary.Segments.Count;
          s++
        ) {
          initialEdges.Add(s)
        }
      }

      //  We'll have two edge sets, one for identifications, and one for their mirrors.
      //  ZZZ - we don't always need to fill out the mirrors.
      let edgeSetArray: Array<Array<number>> = new Array<
        Array<number>
      >()
      edgeSetArray.Add(identification.Edges)
      let mirroredEdgeSet: Array<number> = new Array<number>()
      for (let edge: number in identification.Edges) {
        let mirroredEdge: number = this.Config.P - edge
        mirroredEdgeSet.Add(mirroredEdge)
      }

      edgeSetArray.Add(mirroredEdgeSet)
      for (let init: number in initialEdges) {
        let initialEdge: number = init
        //  So we can change during mirroring below if necessary.
        //  Now cycle through the edge sets.
        let ident: PuzzleIdentification = new PuzzleIdentification()
        ident.UseMirrored = identification.UseMirroredEdgeSet
        for (let i: number = 0; i < edgeSetArray.Count; i++) {
          let edgeSet: Array<number> = edgeSetArray[i]
          let mirror: boolean = i == 1
          if (mirror && 0 != initialEdge) {
            initialEdge = this.Config.P - initialEdge
          }

          let boundary: Polygon = template.Boundary.Clone()
          let segment: Segment = boundary.Segments[initialEdge]
          if (identification.InPlaceReflection) {
            let reflect: Segment = Segment.Line(
              new Vector3D(),
              segment.Midpoint,
            )
            boundary.Reflect(reflect)
          }

          boundary.Reflect(segment)
          //  Do all the configured reflections.
          let sIndex: number = initialEdge
          let even: boolean = boundary.Orientation
          for (let offsetIndex: number in edgeSet) {
            if (even) {
              sIndex = sIndex + offsetIndex
            } else {
              sIndex = sIndex - offsetIndex
            }

            even = !even
            if (sIndex < 0) {
              sIndex = sIndex + boundary.Segments.Count
            }

            if (sIndex >= boundary.Segments.Count) {
              sIndex = sIndex - boundary.Segments.Count
            }

            boundary.Reflect(boundary.Segments[sIndex])
          }

          if (identification.EndRotation != 0) {
            let angle: number =
              identification.EndRotation *
              (2 * (System.Math.PI / this.Config.P))
            if (mirror) {
              angle = angle * -1
            }

            let rotate: Mobius = new Mobius()
            if (IsSpherical && Infinity.IsInfinite(boundary.Center)) {
              rotate.Elliptic(
                this.Config.Geometry,
                new Vector3D(),
                angle * -1,
              )
            } else {
              rotate.Elliptic(
                this.Config.Geometry,
                boundary.Center,
                angle,
              )
            }

            boundary.Transform(rotate)
          }

          let isometry: Isometry = new Isometry()
          isometry.CalculateFromTwoPolygons(
            template,
            boundary,
            this.Config.Geometry,
          )
          isometry = isometry.Inverse()
          if (mirror) {
            ident.Mirrored = isometry
          } else {
            ident.Unmirrored = isometry
          }
        }

        result.Add(ident)
      }
    }

    return result
  }

  ///  <summary>
  ///  Populate Neighbors of master cells. A neighbor shares a common edge with a cell. By definition, a cell is its own neighbor
  ///  </summary>
  PopulateNeighbors(
    tiling: Tiling,
    completed: Dictionary<Vector3D, Cell>,
  ) {
    for (let master: Cell in this.m_masters) {
      master.Neighbors.Add(master)
      let masterTile: Tile = tiling.TilePositions[master.Center]
      for (let neighborTile: Tile in masterTile.EdgeIncidences) {
        let neighbor: Cell = completed[neighborTile.Center]
        //  This can happen for cells near the boundary of our recursion.
        if (neighbor.IndexOfMaster < 0) {
          continue
        }

        master.Neighbors.Add(neighbor.MasterOrSelf)
        neighbor.MasterOrSelf.Neighbors.Add(master)
      }
    }
  }

  AddMaster(
    tile: Tile,
    tiling: Tiling,
    identifications: PuzzleIdentifications,
    completed: Dictionary<Vector3D, Cell>,
  ) {
    let master: Cell = this.SetupCell(
      tiling.Tiles.First(),
      tile.Boundary,
      completed,
    )
    master.IndexOfMaster = this.m_masters.Count
    //  Paranoia.
    if (
      0 != this.Config.ExpectedNumColors &&
      master.IndexOfMaster >= this.Config.ExpectedNumColors
    ) {
      // Debug.Assert( false );
      //  It will already have an invalid index.
      master.IndexOfMaster = -1
      return
    }

    this.m_masters.Add(master)
    //  This is to help with recentering on puzzles constructed via group relations.
    //  We need to recurse deeper for some of them, but just for the slaves of the central tile.
    let template: Tile = tiling.Tiles.First()
    let positions: TilingPositions = null
    if (master.IndexOfMaster == 0 && this.UsingRelations) {
      tiling = null
      positions = new TilingPositions()
      positions.Build(
        new TilingConfig(
          this.Config.P,
          this.Config.Q,
          /* maxTiles:*/ this.Config.NumTiles * 5,
        ),
      )
    }

    //  Now add all the slaves for this master.
    let parents: Array<Cell> = new Array<Cell>()
    parents.Add(master)
    this.AddSlavesRecursive(
      master,
      parents,
      tiling,
      positions,
      template,
      identifications,
      completed,
    )
  }

  AddSlavesRecursive(
    master: Cell,
    parents: Array<Cell>,
    tiling: Tiling,
    positions: TilingPositions,
    template: Tile,
    identifications: PuzzleIdentifications,
    completed: Dictionary<Vector3D, Cell>,
  ) {
    //  Are we done?
    if (parents.Count == 0 || identifications.Count == 0) {
      return
    }

    //  To track the cells we add at this level.
    let added: Array<Cell> = new Array<Cell>()
    for (let parent: Cell in parents) {
      for (let identification: PuzzleIdentification in identifications) {
        for (let identIsometry: Isometry in identification.Isometries) {
          let slave: Cell = this.ApplyOneIsometry(
            master,
            parent,
            identIsometry,
            tiling,
            positions,
            template,
            completed,
          )
          if (slave != null) {
            added.Add(slave)
          }
        }
      }
    }

    this.AddSlavesRecursive(
      master,
      added,
      tiling,
      positions,
      template,
      identifications,
      completed,
    )
  }

  ApplyOneIsometry(
    master: Cell,
    parent: Cell,
    identIsometry: Isometry,
    tiling: Tiling,
    positions: TilingPositions,
    template: Tile,
    completed: Dictionary<Vector3D, Cell>,
  ): Cell {
    //  Conjugate to get the identification relative to this parent.
    //  NOTE: When we don't conjugate, some cells near the boundary are missed being identified.
    //          I got around that by configuring the number of colors in the puzzle, and never adding more than that expected amount.
    //          That was maybe a good thing to do anyway.
    //  But conjugating was causing me lots of headaches because, e.g. it was causing extraneous mirroring/rotations
    //  in puzzles like the Klein bottle, which don't have symmetrical identifications.  So I took it out for now.
    //  NOTE: Later I tried conjugating for spherical puzzles, but that just produced bad puzzles (copies would have different colors adjacent).
    //          So I think this is right.
    // Isometry conjugated = parent.Isometry.Inverse() * identIsometry * parent.Isometry;
    let conjugated: Isometry = identIsometry
    //  We can use the conjugates when using relations, because those are regular maps.
    // if( UsingRelations )
    //     conjugated = parent.Isometry.Inverse() * identIsometry * parent.Isometry;
    let newCenter: Vector3D = parent.VertexCircle.CenterNE
    newCenter = conjugated.ApplyInfiniteSafe(newCenter)
    //  ZZZ - Hack for spherical.  Some centers were projecting to very large values rather than DNE.
    if (Infinity.IsInfinite(newCenter)) {
      newCenter = Infinity.InfinityVector2D
    }

    //  In the tiling?
    let tile: Tile
    if (
      tiling != null &&
      !tiling.TilePositions.TryGetValue(newCenter, /* out */ tile)
    ) {
      return null
    }

    if (positions != null && !positions.Positions.Contains(newCenter)) {
      return null
    }

    //  Already done this one?
    if (completed.ContainsKey(newCenter)) {
      return null
    }

    //  New! Add it.
    let boundary: Polygon = parent.Boundary.Clone()
    boundary.Transform(conjugated)
    let slave: Cell = this.SetupCell(template, boundary, completed)
    this.AddSlave(master, slave)
    return slave
  }

  AddSlave(master: Cell, slave: Cell) {
    //  Go ahead and set this.
    slave.Master = master
    slave.IndexOfMaster = master.IndexOfMaster
    let slaves: Array<Cell>
    if (!this.m_slaves.TryGetValue(master, /* out */ slaves)) {
      slaves = new Array<Cell>()
      this.m_slaves[master] = slaves
    }

    slaves.Add(slave)
  }

  ///  <summary>
  ///  Does initial creation/setup of a cell.
  ///  This will also mark this tile as completed.
  ///  NOTE: The passed in boundary should be based on applied identifications (not based on a Tile in the tiling)!
  ///  </summary>
  SetupCell(
    home: Tile,
    boundary: Polygon,
    completed: Dictionary<Vector3D, Cell>,
  ): Cell {
    let cell: Cell = new Cell(boundary, boundary.CircumCircle)
    //  This has to be recalculated, because it may not be the same as the tiling isometries.
    // cell.Isometry = t.Isometry;
    cell.Isometry.CalculateFromTwoPolygons(
      home,
      boundary,
      this.Config.Geometry,
    )
    completed[boundary.Center] = cell
    return cell
  }

  ///  <summary>
  ///  Adds all the stickers to a cell based on template cell stickers.
  ///  NOTE: As a memory optimization, we only want to do this for cells
  ///           involved in state calcs.
  ///  </summary>
  AddStickersToCell(cell: Cell, tStickers: Array<Polygon>) {
    let inv: Isometry = cell.Isometry.Inverse()
    for (let i: number = 0; i < tStickers.Count; i++) {
      let transformed: Polygon = tStickers[i].Clone()
      transformed.Transform(inv)
      let sticker: Sticker = new Sticker(
        cell.IndexOfMaster,
        i,
        transformed,
      )
      cell.Stickers.Add(sticker)
    }
  }

  ///  <summary>
  ///  This will calculate texture coordinates and vertices for all our cells.
  ///  </summary>
  SetupTextureCoords() {
    let firstMaster: Cell = this.MasterCells.First()
    let templateTextureCoords: Array<Vector3D> =
      TextureHelper.TextureCoords(
        firstMaster.Boundary,
        this.Config.Geometry,
      )
    for (let i: number = 0; i < this.MasterCells.Count; i++) {
      let master: Cell = this.MasterCells[i]
      let masterTextureCoords: Array<Vector3D> =
        Isometry.TransformVertices(
          templateTextureCoords,
          master.Isometry.Inverse(),
        )
      //  Actually pre-calculate final values? That would require some knowledge from PuzzleRenderer class though,
      //  i.e. the scaled "factor" of the texture.
      master.TextureCoords = masterTextureCoords
      master.TextureVertices = masterTextureCoords
      for (let slave: Cell in this.SlaveCells(master)) {
        //  NOTE: We don't set the slave TextureCoords, since we can just use the ones in the master directly.
        slave.TextureVertices = Isometry.TransformVertices(
          templateTextureCoords,
          slave.Isometry.Inverse(),
        )
      }
    }

    TextureHelper.SetupElementIndices(firstMaster.Boundary)
  }

  ///  <summary>
  ///  A texture helper for this puzzle.
  ///  </summary>
  /* internal */ get TextureHelper(): TextureHelper {}

  /* internal */ set TextureHelper(value: TextureHelper) {}

  static TransformedTwistDataForCell(
    cell: Cell,
    untransformed: TwistData,
    reverse: boolean,
  ): TwistData {
    let isometry: Isometry = cell.Isometry.Inverse()
    let newCenter: Vector3D = isometry.Apply(untransformed.Center)
    let transformedTwistData: TwistData = new TwistData()
    transformedTwistData.TwistType = untransformed.TwistType
    transformedTwistData.Center = newCenter
    //  NOTE: Can't use InfinitySafe method here! We need this center to stay accurate, for future transformations.
    transformedTwistData.Order = untransformed.Order
    transformedTwistData.Reverse = reverse
    transformedTwistData.NumSlices = untransformed.NumSlices
    if (untransformed.Pants != null) {
      transformedTwistData.Pants = untransformed.Pants.Clone()
      transformedTwistData.Pants.Transform(isometry)
    }

    let transformedCircles: Array<CircleNE> = new Array<CircleNE>()
    for (let circleNE: CircleNE in untransformed.Circles) {
      let copy: CircleNE = circleNE.Clone()
      copy.Transform(isometry)
      transformedCircles.Add(copy)
    }

    transformedTwistData.Circles = transformedCircles.ToArray()
    return transformedTwistData
  }

  ///  <summary>
  ///  A version dependent helper.  This is the current, good way to setup twist data.
  ///  </summary>
  SetupTwistDataForCell_VersionCurrent(
    topology: TopologyAnalyzer,
    cell: Cell,
    templateTwistData: TwistData,
    reverse: boolean,
    twistDataMap: Dictionary<Vector3D, TwistData>,
    collections: Array<IdentifiedTwistData>,
  ) {
    let transformedTwistData: TwistData = TransformedTwistDataForCell(
      cell,
      templateTwistData,
      reverse,
    )
    //  Already have this one?
    let centerSafe: Vector3D = this.InfinitySafe(
      transformedTwistData.Center,
    )
    if (twistDataMap.ContainsKey(centerSafe)) {
      return
    }

    let index: number = topology.GetLogicalElementIndex(
      templateTwistData.TwistType,
      centerSafe,
    )
    if (-1 == index) {
      Debug.Assert(false)
      return
    }

    let collection: IdentifiedTwistData = collections[index]
    collection.TwistDataForDrawing.Add(transformedTwistData)
    if (m_stateCalcCells.Contains(cell)) {
      collection.TwistDataForStateCalcs.Add(transformedTwistData)
    }

    transformedTwistData.IdentifiedTwistData = collection
    twistDataMap[centerSafe] = transformedTwistData
  }

  ///  <summary>
  ///  A version dependent helper.  This is the current, good way to setup twist data.
  ///  </summary>
  SetupTwistDataForFullPuzzle_VersionCurrent(
    tiling: Tiling,
    topology: TopologyAnalyzer,
    templateTwistDataArray: Array<TwistData>,
    twistDataMap: Dictionary<Vector3D, TwistData>,
  ) {
    //  Create collections.
    //  We'll create them for all elements, then remove unused ones at the end.
    let collections: Array<IdentifiedTwistData> =
      new Array<IdentifiedTwistData>()
    let count: number = topology.F + (topology.E + topology.V)
    for (let i: number = 0; i < count; i++) {
      collections.Add(new IdentifiedTwistData())
    }

    for (let master: Cell in this.MasterCells) {
      for (let twistData: TwistData in templateTwistDataArray) {
        let reverse: boolean = false
        this.SetupTwistDataForCell_VersionCurrent(
          topology,
          master,
          twistData,
          reverse,
          twistDataMap,
          collections,
        )
        for (let slave: Cell in this.SlaveCells(master)) {
          reverse = master.Reflected | slave.Reflected
          // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
          this.SetupTwistDataForCell_VersionCurrent(
            topology,
            slave,
            twistData,
            reverse,
            twistDataMap,
            collections,
          )
        }
      }
    }

    //  Remove empty ones, assign indices, and save to puzzle.
    collections = collections
      .Where(() => {}, i.TwistDataForDrawing.Count > 0)
      .ToArray()
    for (let i: number = 0; i < collections.Count; i++) {
      collections[i].Index = i
      this.AllTwistData.Add(collections[i])
    }
  }

  ///  <summary>
  ///  Here for backward compatibility.
  ///  </summary>
  SetupTwistDataForCell_PreviewVersion(
    cell: Cell,
    templateTwistData: TwistData,
    reverse: boolean,
    twistDataMap: Dictionary<Vector3D, TwistData>,
    collection: IdentifiedTwistData,
  ) {
    let transformedTwistData: TwistData = TransformedTwistDataForCell(
      cell,
      templateTwistData,
      reverse,
    )
    collection.TwistDataForDrawing.Add(transformedTwistData)
    if (m_stateCalcCells.Contains(cell)) {
      collection.TwistDataForStateCalcs.Add(transformedTwistData)
    }

    transformedTwistData.IdentifiedTwistData = collection
    twistDataMap[this.InfinitySafe(transformedTwistData.Center)] =
      transformedTwistData
  }

  ///  <summary>
  ///  Here for backward compatibility.
  ///  </summary>
  SetupTwistDataForFullPuzzle_PreviewVersion(
    tiling: Tiling,
    templateTwistDataArray: Array<TwistData>,
    twistDataMap: Dictionary<Vector3D, TwistData>,
  ) {
    //  Map to help track what is done.
    let usedMasterLocation: Dictionary<Vector3D, boolean> =
      new Dictionary<Vector3D, boolean>()
    for (let master: Cell in this.MasterCells) {
      for (let twistData: TwistData in templateTwistDataArray) {
        //  Avoid duplicate vertex/edge circles in our list.
        let centerNE: Vector3D = twistData.Center
        centerNE = master.Isometry.Inverse().Apply(centerNE)
        if (usedMasterLocation.ContainsKey(centerNE)) {
          continue
        }

        usedMasterLocation[centerNE] = true
        let collection: IdentifiedTwistData = new IdentifiedTwistData()
        collection.Index = this.AllTwistData.Count
        this.AllTwistData.Add(collection)
        let reverse: boolean = false
        this.SetupTwistDataForCell_PreviewVersion(
          master,
          twistData,
          false,
          twistDataMap,
          collection,
        )
        for (let slave: Cell in this.SlaveCells(master)) {
          reverse = master.Reflected | slave.Reflected
          // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
          this.SetupTwistDataForCell_PreviewVersion(
            slave,
            twistData,
            reverse,
            twistDataMap,
            collection,
          )
        }
      }
    }
  }

  ///  <summary>
  ///  Sets up the slicing circles and twisting on the full puzzle.
  ///  </summary>
  SetupTwistDataForFullPuzzle(
    tiling: Tiling,
    topology: TopologyAnalyzer,
    templateTwistDataArray: Array<TwistData>,
  ) {
    //  In case this has been built before.
    m_twistDataNearTree.Reset(NearTree.GtoM(this.Config.Geometry))
    //  This is a performance optimization, to avoid doing calculation that results in loops below.
    let isSpherical: boolean = this.IsSpherical
    //  Map to help track what is done.
    let twistDataMap: Dictionary<Vector3D, TwistData> = new Dictionary<
      Vector3D,
      TwistData
    >()
    if (this.Config.Version == Loader.VersionPreview) {
      this.SetupTwistDataForFullPuzzle_PreviewVersion(
        tiling,
        templateTwistDataArray,
        twistDataMap,
      )
    } else if (this.Config.Version == Loader.VersionCurrent) {
      this.SetupTwistDataForFullPuzzle_VersionCurrent(
        tiling,
        topology,
        templateTwistDataArray,
        twistDataMap,
      )
    }

    //  Add opposite twisting circles for spherical puzzles.
    this.AddOppTwisters(twistDataMap)
    //  Mark affected master cells and stickers.
    //  For spherical, we need to do this for all twist data (because we draw everything instead of using textures).
    //  For euclidean/hyperbolic, we only need to do this for the subset of twist data which will be used for state calcs.
    for (let collection: IdentifiedTwistData in this.AllTwistData) {
      let collectionTwistData: Array<TwistData> =
        collection.TwistDataForDrawing
      // TODO: Warning!!!, inline IF is not supported ?
      isSpherical
      collection.TwistDataForStateCalcs
      let twistData: TwistData = collectionTwistData[i]
      //  Mark all the affected master cells.
      for (let master: Cell in this.MasterCells) {
        twistData.WillAffectMaster(master, isSpherical)
      }

      //  Mark all the affected stickers.
      //  Again, for spherical, we have to do more than just the stateCalcCells.
      let cells: IEnumerable<Cell> = this.AllCells
      // TODO: Warning!!!, inline IF is not supported ?
      isSpherical
      m_stateCalcCells
      for (let cell: Cell in cells) {
        for (let sticker: Sticker in cell.Stickers) {
          twistData.WillAffectSticker(sticker, isSpherical)
        }
      }

      // Warning!!! Lambda constructs are not supported
      Parallel.For(0, collectionTwistData.Count, () => {})
    }

    //  Optimization.
    //  We only need to keep around twist data for state calcs that touches masters.
    for (let collection: IdentifiedTwistData in this.AllTwistData) {
      collection.TwistDataForStateCalcs =
        collection.TwistDataForStateCalcs.Where(() => {},
        td.AffectedMasterCells != null && td.AffectedMasterCells.Count > 0).ToArray()
    }

    //  Now build the near tree.
    for (let keyValuePair: KeyValuePair<
      Vector3D,
      TwistData
    > in twistDataMap) {
      //  NearTree doesn't like NaN or +Inf
      let center: Vector3D = this.InfinitySafe(keyValuePair.Key)
      let nearTreeObject: NearTreeObject = new NearTreeObject()
      nearTreeObject.ID = keyValuePair.Value
      nearTreeObject.Location = center
      m_twistDataNearTree.InsertObject(nearTreeObject)
    }
  }

  ///  <summary>
  ///  For spherical puzzles, this will append antipodal twist data (if it exists).
  ///  </summary>
  AddOppTwisters(twistDataMap: Dictionary<Vector3D, TwistData>) {
    for (let td: TwistData in twistDataMap.Values) {
      td.NumSlicesNoOpp = td.Circles.Length
      if (!IsSpherical) {
        continue
      }

      let firstCircle: CircleNE = td.Circles.First()
      let antipode: Vector3D = firstCircle.ReflectPoint(td.Center)
      antipode = this.InfinitySafe(antipode)
      let anti: TwistData
      if (!twistDataMap.TryGetValue(antipode, /* out */ anti)) {
        //  For spherical puzzles, we need to set things to have one more layer.
        //  (to support the slice beyond last circle).
        td.NumSlices = td.Circles.Length + 1
        continue
      }

      //  Puzzles with non-regular colorings can be really weird with slicing,
      //  e.g. the {3,5} 8C.  We just won't allow slicing if the antipodal-twist has any
      //  identified twists that are not it or us (This will still allow hemi-puzzles to have slices).
      //
      //  Another weirdness encountered with the {3,4} 4CA...  The identified antipodal twist had the
      //  same twisting orientation, which makes the orientation of a slice-2 twist undefined.
      //  We need to avoid that situation too.
      let allowed: boolean = true
      for (let identified: TwistData in anti.IdentifiedTwistData
        .TwistDataForDrawing) {
        //  It
        if (identified == anti) {
          continue
        }

        //  Us
        if (
          this.InfinitySafe(identified.Center) ==
          this.InfinitySafe(td.Center)
        ) {
          //  As noted above, we must also have opposite orientation to be allowed.
          if (anti.Reverse | td.Reverse) {
            continue
          }

          // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
        }

        allowed = false
        break
      }

      if (!allowed) {
        continue
      }

      //  Add opposite twist data.
      let list: Array<CircleNE> = td.Circles.ToArray()
      for (let opp: CircleNE in anti.Circles) {
        let clone: CircleNE = opp.Clone()
        clone.CenterNE = firstCircle.CenterNE
        list.Add(clone)
      }

      //  ZZZ - move this block to a function and call for all twist data (for safety).
      //  Sort
      //  We transform all the circles to the origin, then sort by their radius.
      let toOrigin: Mobius = new Mobius()
      toOrigin.Isometry(
        Geometry.Spherical,
        0,
        firstCircle.CenterNE * -1,
      )
      let clone: CircleNE = c.Clone()
      clone.Transform(toOrigin)
      return clone.Radius
      // Warning!!! Lambda constructs are not supported
      list = list.OrderBy(() => {}).ToArray()
      //  Remove dupes.
      //  The equality comparer wasn't working for lines if I didn't normalize them first.
      //  I don't really want to do that inside the comparer, since it edits the objects.
      for (let c: CircleNE in list) {
        if (c.IsLine) {
          c.NormalizeLine()
        }
      }

      td.Circles = list
        .Distinct(new CircleNE_EqualityComparer())
        .ToArray()
      //  For spherical puzzles, we need to set things to have one more layer.
      //  (to support the slice beyond last circle).
      td.NumSlices = td.Circles.Length + 1
    }
  }

  SetupCellNearTree(cellMap: Dictionary<Vector3D, Cell>) {
    m_cellNearTree.Reset(NearTree.GtoM(this.Config.Geometry))
    //  Now build the near tree.
    for (let keyValuePair: KeyValuePair<Vector3D, Cell> in cellMap) {
      //  NearTree doesn't like NaN or +Inf
      let center: Vector3D = this.InfinitySafe(keyValuePair.Key)
      let nearTreeObject: NearTreeObject = new NearTreeObject()
      nearTreeObject.ID = keyValuePair.Value
      nearTreeObject.Location = center
      m_cellNearTree.InsertObject(nearTreeObject)
    }
  }

  ///  <summary>
  ///  Find the closest cocentric slicing circles to a location.
  ///  NOTE: The location should not be transformed by any mouse movements.
  ///  </summary>
  /* internal */ ClosestTwistingCircles(location: Vector3D): TwistData {
    let nearTreeObject: NearTreeObject
    let found: boolean = m_twistDataNearTree.FindNearestNeighbor(
      /* out */ nearTreeObject,
      location,
      double.MaxValue,
    )
    if (!found) {
      return null
    }

    let result: TwistData = nearTreeObject.ID
    return result
  }

  ///  <summary>
  ///  Find the closest cell to a location.
  ///  NOTE: The location should not be transformed by any mouse movements.
  ///  </summary>
  /* internal */ ClosestCell(location: Vector3D): Cell {
    let nearTreeObject: NearTreeObject
    let found: boolean = m_cellNearTree.FindNearestNeighbor(
      /* out */ nearTreeObject,
      location,
      double.MaxValue,
    )
    if (!found) {
      return null
    }

    let result: Cell = nearTreeObject.ID
    return result
  }

  m_twistDataNearTree: NearTree = new NearTree()

  m_cellNearTree: NearTree = new NearTree()

  ///  <summary>
  ///  Marks all the cells we'll need to use for state calcs.
  ///  </summary>
  MarkCellsForStateCalcs(
    tiling: Tiling,
    cells: Dictionary<Vector3D, Cell>,
    templateTwistDataArray: Array<TwistData>,
    topology: TopologyAnalyzer,
  ) {
    m_stateCalcCells.Clear()
    m_stateCalcCellSet.Clear()
    let result: Array<Cell> = new Array<Cell>()
    result.AddRange(this.MasterCells)
    //  Special handlinng for earthquake.
    //  ZZZ - I wonder if this should be the approach in the normal case too (cycling through
    //          masters first and slaves second), but fear changing the existing behavior.
    //          After all, any slave twist will also result in some master twist.
    //          This might speed up code below, and get rid of the complexity of the "hotTwists" code.
    let complete: HashSet<Vector3D> = new HashSet<Vector3D>()
    if (this.Config.Earthquake) {
      //  Get all twist data attached to master cells.
      let toCheck: Array<TwistData> = new Array<TwistData>()
      for (let twistData: TwistData in templateTwistDataArray) {
        for (let master: Cell in this.MasterCells) {
          let dummy: boolean = false
          let transformed: TwistData = TransformedTwistDataForCell(
            master,
            twistData,
            dummy,
          )
          if (complete.Contains(transformed.Center)) {
            continue
          }

          complete.Add(transformed.Center)
          toCheck.Add(transformed)
        }
      }

      let allSlaves: Array<Cell> = this.AllSlaveCells.ToArray()
      let slave: Cell = allSlaves[i]
      for (let td: TwistData in toCheck) {
        if (td.WillAffectCell(slave, this.IsSpherical)) {
          result.Add(slave)
          break
        }
      }

      // Warning!!! Lambda constructs are not supported
      Parallel.For(0, allSlaves.Length, () => {})
      m_stateCalcCells = result.Distinct().ToArray()
      m_stateCalcCellSet = new HashSet<Cell>(m_stateCalcCells)
      return
    }

    let hotTwists: Array<TwistData> = new Array<TwistData>()
    for (let twistData: TwistData in templateTwistDataArray) {
      for (let slave: Cell in this.AllSlaveCells) {
        let dummy: boolean = false
        let transformed: TwistData = TransformedTwistDataForCell(
          slave,
          twistData,
          dummy,
        )
        if (complete.Contains(transformed.Center)) {
          continue
        }

        complete.Add(transformed.Center)
        for (let master: Cell in this.MasterCells) {
          if (transformed.WillAffectCell(master, this.IsSpherical)) {
            result.Add(slave)
            hotTwists.Add(transformed)
            break
          }
        }
      }
    }

    //  Any slaves this twist data touches also have the potential to affect this master.
    //  ZZZ - This ends up adding extraneous cells on {7,3}, assuming only 1/7th turn twists.
    //          If we allowed 3/7th turn twists, it wouldn't be extraneous though.
    //  ZZZ - Nested foreach loops are really slow here.
    for (let td: TwistData in hotTwists) {
      if (td.WillAffectCell(slave, this.IsSpherical)) {
        result.Add(slave)
        break
      }
    }

    // Warning!!! Lambda constructs are not supported
    Parallel.ForEach(this.AllSlaveCells, () => {})
    //  We have to special case things for IRP puzzles with no slicing,
    //  since StateCalc cells will then not include all cells adjacent to masters.
    //  (We rely on StateCalc cells when building up the IRP geometry).
    //  In this block, we just grab masters + incident cells.
    //  NOTE: This is what we initially did for all puzzles, but it was not enough for {3,7} puzzles.
    if (
      this.HasValidIRPConfig &&
      this.MasterCells.Count == result.Count
    ) {
      for (let master: Cell in this.MasterCells) {
        //  ZZZ - could throw.  But what would I do in that case anyway?
        let masterTile: Tile = tiling.TilePositions[master.Center]
        let masterTileAsArray: Array<Tile> = new Array<Tile>()
        masterTileAsArray.Add(masterTile)
        for (let t: Tile in masterTileAsArray.Concat(
          masterTile.EdgeIncidences.Concat(masterTile.VertexIndicences),
        )) {
          let c: Cell = cells[t.Center]
          result.Add(c)
        }
      }
    }

    m_stateCalcCells = result.Distinct().ToArray()
    m_stateCalcCellSet = new HashSet<Cell>(m_stateCalcCells)
  }

  m_stateCalcCells: Array<Cell>

  m_stateCalcCellSet: HashSet<Cell>

  PrepareSurfaceData(callback: IStatusCallback) {
    this.ClearSurfaceVars()
    if (!this.HasSurfaceConfig) {
      return
    }

    let sc: SurfaceConfig = this.Config.SurfaceConfig
    let g: Geometry = Geometry.Euclidean
    if (sc.Surface == Surface.Sphere || sc.Surface == Surface.Boys) {
      //  Build a polygon with arc segments that will make a circle.
      let seg: Segment = Segment.Arc(
        new Vector3D(1, 0),
        new Vector3D(Math.Sqrt(0.5), Math.Sqrt(0.5)),
        new Vector3D(0, 1),
      )
      let segs: Array<Segment> = new Array<Segment>()
      for (let i: number = 0; i < 4; i++) {
        let m: Mobius = new Mobius()
        m.Isometry(Geometry.Euclidean, Math.PI * (i / 2), new Complex())
        let clone: Segment = seg.Clone()
        clone.Transform(m)
        segs.Add(clone)
      }

      SurfacePoly = new Polygon()
      SurfacePoly.Segments = segs
      this.SurfaceRenderingCells = this.AllCells.ToArray()
      g = Geometry.Spherical
      //  This will make the texture verts get calculated correctly.
    } else {
      let p: number = this.Config.P
      let q: number = this.Config.Q
      let b1: Vector3D = new Vector3D(
        sc.Basis1X.Dist(p, q),
        sc.Basis1Y.Dist(p, q),
      )
      let b2: Vector3D = new Vector3D(
        sc.Basis2X.Dist(p, q),
        sc.Basis2Y.Dist(p, q),
      )
      //  Mark the cells we need to render the surface.
      SurfacePoly = Polygon.FromPoints([
        new Vector3D(),
        b1,
        b1 + b2,
        b2,
      ])
      this.SurfaceRenderingCells = this.AllCells.Where(() => {},
      SurfacePoly.Intersects(c.Boundary)).ToArray()
    }

    //  Setup texture coords.
    let lod: number = 6
    SurfaceTextureCoords = this.TextureHelper.TextureCoords(
      SurfacePoly,
      g,
      Math.Pow(2, lod),
    )
    SurfaceElementIndices = this.TextureHelper.CalcElementIndices(
      SurfacePoly,
      lod,
    )[lod]
    let mergedCoords: Array<Vector3D>
    let mergedIndices: Array<number>
    this.TextureHelper.MergeVerts(
      SurfaceTextureCoords,
      SurfaceElementIndices,
      /* out */ mergedCoords,
      /* out */ mergedIndices,
    )
    SurfaceTextureCoords = mergedCoords
    SurfaceElementIndices = mergedIndices
    //  For each triangle of the surface, cache the closest twisting data.
    let elementTwistData1: Array<TwistData> = new Array<TwistData>()
    let elementTwistData2: Array<TwistData> = new Array<TwistData>()
    let elements: Array<number> = SurfaceElementIndices

    for (let i = 0; i < elements.Length; i++) {
      if (i % 3 != 0) {
        continue
      }

      let p1: Vector3D = SurfaceTextureCoords[elements[i + 0]]
      let p2: Vector3D = SurfaceTextureCoords[elements[i + 1]]
      let p3: Vector3D = SurfaceTextureCoords[elements[i + 2]]
      let avg: Vector3D = (p1 + (p2 + p3)) / 3
      let td: TwistData = this.ClosestTwistingCircles(avg)
      elementTwistData1.Add(td)
      //  We have two patches for the sphere.
      if (this.Config.SurfaceConfig.Surface == Surface.Sphere) {
        let m: Mobius = new Mobius()
        m.Elliptic(Geometry.Spherical, Complex.ImaginaryOne, Math.PI)
        avg = m.Apply(avg)
        td = this.ClosestTwistingCircles(avg)
        elementTwistData2.Add(td)
      }
    }

    SurfaceElementTwistData1 = elementTwistData1.ToArray()
    SurfaceElementTwistData2 = elementTwistData2.ToArray()
  }

  ClearSurfaceVars() {
    SurfacePoly = null
    SurfaceTextureCoords = null
    SurfaceElementIndices = null
    SurfaceElementTwistData1 = null
    SurfaceElementTwistData2 = null
  }

  get SurfacePoly(): Polygon {}

  set SurfacePoly(value: Polygon) {}

  get SurfaceTextureCoords(): Array<Vector3D> {}

  set SurfaceTextureCoords(value: Array<Vector3D>) {}

  get SurfaceElementIndices(): Array<number> {}

  set SurfaceElementIndices(value: Array<number>) {}

  get SurfaceElementTwistData1(): Array<TwistData> {}

  set SurfaceElementTwistData1(value: Array<TwistData>) {}

  get SurfaceElementTwistData2(): Array<TwistData> {}

  set SurfaceElementTwistData2(value: Array<TwistData>) {}

  ///  <summary>
  ///  Whether we have a valid IRP data file configured.
  ///  </summary>
  get HasValidIRPConfig(): boolean {
    let irpConfig: IRPConfig = this.Config.IRPConfig
    if (irpConfig == null || string.IsNullOrEmpty(irpConfig.DataFile)) {
      return false
    }

    return true
  }

  get HasValidSkewConfig(): boolean {
    let skewConfig: Skew4DConfig = this.Config.Skew4DConfig
    return skewConfig != null
  }

  BuildSkewGeometry(): Array<Polygon> {
    switch (this.Config.Skew4DConfig.Polytope) {
      case Polytope.Duoprism:
        let num: number = Math.Sqrt(this.Config.ExpectedNumColors)
        return SkewPolyhedron.BuildDuoprism(num)
        break
      case Polytope.Runcinated5Cell:
        return SkewPolyhedron.BuildRuncinated5Cell()
        break
      case Polytope.Bitruncated5Cell:
        return SkewPolyhedron.BuildBitruncated5Cell()
        break
    }

    throw new Error('Unknown skew polytope.')
  }

  GrabIncidenceData(
    cell: Cell,
    allCells: Array<Cell>,
    poincare: boolean,
  ): Array<IncidenceData> {
    let result: Array<IncidenceData> = new Array<IncidenceData>()
    for (let e: number = 0; e < cell.Boundary.Segments.Count; e++) {
      let seg: Segment = cell.Boundary.Segments[e]
      let mid: Vector3D = seg.Midpoint
      for (let compare: Cell in allCells) {
        //  The same? (or logically the same)
        //  ZZZ - The latter check really isn't necessary.
        if (
          compare == cell ||
          (poincare && cell.IndexOfMaster == compare.IndexOfMaster)
        ) {
          continue
        }

        for (
          let ie: number = 0;
          ie < compare.Boundary.Segments.Count;
          ie++
        ) {
          let segCompare: Segment = compare.Boundary.Segments[ie]
          if (segCompare.Midpoint == mid) {
            let reflected: boolean = seg.P1 == segCompare.P1
            //  ZZZ - may be problematic for non-orientable topologies (?)
            let info: IncidenceData = new IncidenceData(
              cell,
              e,
              compare,
              ie,
              reflected,
            )
            result.Add(info)
            break
          }
        }
      }
    }

    return result
  }

  AlterIRPRecursive(
    working: Array<Cell>,
    stateCells: Array<Cell>,
    irps: Array<Cell>,
  ) {
    if (working.Count == 0) {
      return
    }

    //  NOTE: the 'working' irps passed in should already be altered, and in it's final position!
    let altered: Array<Cell> = new Array<Cell>()
    for (let irp: Cell in working) {
      let master: Cell = this.MasterCells[irp.IndexOfMaster]
      //  Grab incidence info.
      let masterIncidences: Array<IncidenceData> =
        this.GrabIncidenceData(master, stateCells, /* poincare:*/ true)
      let irpIncidences: Array<IncidenceData> = this.GrabIncidenceData(
        irp,
        irps,
        /* poincare:*/ false,
      )
      //  Try to update all the adjacent irp cells.
      for (let irpIncidence: IncidenceData in irpIncidences) {
        //  Already done this one?
        let incidentIRP: Cell = irpIncidence.Incident
        if (incidentIRP.IndexOfMaster != -1) {
          continue
        }

        //  Find the corresponding master incidence data.
        let masterIncidence: IncidenceData = masterIncidences.Find(
          () => {},
          i.Edge == irpIncidence.Edge,
        )
        if (masterIncidence == null) {
          //  It should exist.
          Debug.Assert(false)
          continue
        }

        let test: Array<Cell> = irps
          .Where(() => {},
          c.IndexOfMaster == masterIncidence.Incident.IndexOfMaster)
          .ToArray()
        if (test.Count > 0) {
          //  We don't want this to happen.
          Debug.Assert(false)
          continue
        }

        //  Reflect if needed.
        let incidentIRPEdge: number = irpIncidence.IncidentEdge
        if (irpIncidence.Reflected | masterIncidence.Reflected) {
          incidentIRP.Boundary.Reverse()
          // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
          //  This mirrors about the 0th vertex.
          incidentIRPEdge =
            incidentIRP.Boundary.NumSides - 1 - incidentIRPEdge
        }

        //  Rotate if needed.
        let numRotates: number =
          incidentIRPEdge - masterIncidence.IncidentEdge
        if (numRotates < 0) {
          numRotates = numRotates + incidentIRP.Boundary.NumSides
        }

        incidentIRP.Boundary.Cycle(numRotates)
        //  Set the cell index.
        incidentIRP.IndexOfMaster =
          masterIncidence.Incident.IndexOfMaster
        this.CreatePickInfo(incidentIRP)
        altered.Add(incidentIRP)
      }
    }

    this.AlterIRPRecursive(altered, stateCells, irps)
  }

  CreatePickInfo(irpCell: Cell) {
    if (irpCell.IndexOfMaster == -1) {
      throw new System.Exception('wtf, yo?')
    }

    let master: Cell = this.MasterCells[irpCell.IndexOfMaster]
    let boundary: Polygon = irpCell.Boundary.Clone()
    let pickData: Array<PickInfo> = new Array<PickInfo>()
    let circles: SlicingCircles = this.Config.SlicingCircles
    if (circles == null) {
      //  Do nothing.
    } else if (circles.FaceTwisting) {
      let twistData: TwistData = this.ClosestTwistingCircles(
        master.Boundary.Center,
      )
      let info: PickInfo = new PickInfo(boundary, twistData)
      info.Color = Color.White
      pickData.Add(info)
    } else if (circles.EdgeTwisting) {
      for (let s: number = 0; s < boundary.NumSides; s++) {
        let twistData: TwistData = this.ClosestTwistingCircles(
          master.Boundary.Segments[s].Midpoint,
        )
        let seg: Segment = boundary.Segments[s]
        let info: PickInfo = new PickInfo(
          Polygon.FromPoints([boundary.Center, seg.P1, seg.P2]),
          twistData,
        )
        info.Color = Color.Blue
        pickData.Add(info)
      }
    } else if (circles.VertexTwisting) {
      for (let s: number = 0; s < boundary.NumSides; s++) {
        let twistData: TwistData = this.ClosestTwistingCircles(
          master.Boundary.Segments[s].P1,
        )
        let seg1: Segment = boundary.Segments[boundary.NumSides - 1]
        // TODO: Warning!!!, inline IF is not supported ?
        s == 0
        s - 1
        let seg2: Segment = boundary.Segments[s]
        let info: PickInfo = new PickInfo(
          Polygon.FromPoints([
            boundary.Center,
            seg1.Midpoint,
            seg2.P1,
            seg2.Midpoint,
          ]),
          twistData,
        )
        info.Color = Color.Red
        pickData.Add(info)
      }
    }

    //  ZZZ - We're not supporting puzzles with multiple types of twisting right now.
    irpCell.PickInfo = pickData.ToArray()
  }

  AddIRPSlaves(info: VRMLInfo) {
    let dx1: number = info.DX.X
    let dx2: number = info.DX.Y
    let dx3: number = info.DX.Z
    let dy1: number = info.DY.X
    let dy2: number = info.DY.Y
    let dy3: number = info.DY.Z
    let dz1: number = info.DZ.X
    let dz2: number = info.DZ.Y
    let dz3: number = info.DZ.Z
    let max: number = 31
    let nx: number = max
    let ny: number = max
    let nz: number = max
    let translations: Array<Translation> = new Array<Translation>()
    /// /////////////////////////////////////////////////////////////////////////////
    //  This block taken as directly as possible from Vladamir's vec_viewer_proto.wrl
    let x0 =
      (((nx - 1) * dx1 + ((ny - 1) * dx2 + (nz - 1) * dx3)) / 2) * -1
    let y0 =
      (((nx - 1) * dy1 + ((ny - 1) * dy2 + (nz - 1) * dy3)) / 2) * -1
    let z0 =
      (((nx - 1) * dz1 + ((ny - 1) * dz2 + (nz - 1) * dz3)) / 2) * -1
    let ix = 0
    let iy = 0
    let iz = 0
    let x: number = 0
    let y: number = 0
    let z: number = 0
    for (iz = 0; iz < nz; iz++) {
      for (iy = 0; iy < ny; iy++) {
        for (ix = 0; ix < nx; ix++) {
          x = x0 + (ix * dx1 + (iy * dx2 + iz * dx3))
          y = y0 + (ix * dy1 + (iy * dy2 + iz * dy3))
          z = z0 + (ix * dz1 + (iy * dz2 + iz * dz3))
          translations.Add(
            new Translation(
              Math.Abs(ix - (max - 1) / 2),
              Math.Abs(iy - (max - 1) / 2),
              Math.Abs(iz - (max - 1) / 2),
              new Vector3D(x, y, z),
            ),
          )
        }
      }
    }

    /// /////////////////////////////////////////////////////////////////////////////
    this.m_translations = translations.ToArray()
  }

  TraceGraph() {
    Trace.WriteLine('START')
    for (let master: Cell in this.MasterCells) {
      let masterIncidences: Array<IncidenceData> =
        this.GrabIncidenceData(
          master,
          this.m_stateCalcCells,
          /* poincare:*/ true,
        )
      for (let incident: IncidenceData in masterIncidences) {
        Trace.WriteLine(
          string.Format(
            'master{0};master{1}',
            master.IndexOfMaster,
            incident.Incident.IndexOfMaster,
          ),
        )
      }
    }

    Trace.WriteLine('END')
  }

  get IsSpherical(): boolean {
    return this.Config.Geometry == Geometry.Spherical
  }

  ///  <summary>
  ///  For things that don't like NaN, +Inf, or extremely large values.
  ///  </summary>
  InfinitySafe(input: Vector3D): Vector3D {
    if (!this.IsSpherical) {
      return input
    }

    return Infinity.InfinitySafe(input)
  }

  ///  <summary>
  ///  Update the state based on a twist.
  ///  </summary>
  UpdateState(twist: SingleTwist) {
    this.UpdateState(this.Config, this.State, twist)
  }

  ///  <summary>
  ///  Check if puzzle is solved for both normal and toggling modes
  ///  </summary>
  IsSolved: boolean

  ///  <summary>
  ///  Update the state based on a twist.
  ///  </summary>
  ///  <returns>A map of just the updated stickers (old sticker mapped to new)</returns>
  static UpdateState(
    config: PuzzleConfig,
    state: State,
    twist: SingleTwist,
  ): Dictionary<Sticker, Sticker> {
    //  Maps from old sticker position to sticker hash.
    let oldMap: Dictionary<Vector3D, Sticker> = new Dictionary<
      Vector3D,
      Sticker
    >()
    //  Maps from sticker to new sticker position.
    let newMap: Dictionary<Sticker, Vector3D> = new Dictionary<
      Sticker,
      Vector3D
    >()
    let earthquake: boolean = config.Earthquake
    let identifiedTwistData: IdentifiedTwistData =
      twist.IdentifiedTwistData
    let rotation: number = 1
    // TODO: Warning!!!, inline IF is not supported ?
    earthquake
    twist.Magnitude
    if (!twist.LeftClick) {
      rotation = rotation * -1
    }

    let isSpherical: boolean = config.Geometry == Geometry.Spherical
    let count: number = 0
    for (let twistData: TwistData in twist.StateCalcTD) {
      count++
      let mobius: Mobius = twistData.MobiusForTwist(
        config.Geometry,
        twist,
        rotation,
        earthquake,
        count > identifiedTwistData.TwistDataForStateCalcs.Count,
      )
      for (let list: Array<Sticker> in twistData.AffectedStickersForSliceMask(
        twist.SliceMask,
      )) {
        for (let sticker: Sticker in list) {
          //  Old map
          let center: Vector3D = sticker.Poly.Center
          if (isSpherical && Infinity.IsInfinite(center)) {
            center = Infinity.InfinityVector
          }

          oldMap[center] = sticker
          //  New map
          let transformed: Vector3D
          if (isSpherical && Infinity.IsInfinite(center)) {
            transformed = mobius.ApplyToInfinite()
          } else {
            transformed = mobius.Apply(center)
          }

          if (isSpherical && Infinity.IsInfinite(transformed)) {
            transformed = Infinity.InfinityVector
          }

          newMap[sticker] = transformed
        }
      }
    }

    let updated: Dictionary<Sticker, Sticker> = new Dictionary<
      Sticker,
      Sticker
    >()
    for (let kvp: KeyValuePair<Sticker, Vector3D> in newMap) {
      let sticker2: Sticker
      if (!oldMap.TryGetValue(kvp.Value, /* out */ sticker2)) {
        //  XXX - This currenty happens with moves on the boundary of the puzzle for p>=6,
        //  and for points at infinity.
        // assert( false );
        continue
      }

      let sticker1: Sticker = kvp.Key
      //  Sticker has moved from sticker1 -> sticker2.
      state.SetStickerColorIndex(
        sticker2.CellIndex,
        sticker2.StickerIndex,
        state.GetStickerColorIndex(
          sticker1.CellIndex,
          sticker1.StickerIndex,
        ),
      )
      if (
        sticker1.CellIndex == sticker2.CellIndex &&
        sticker1.StickerIndex == sticker2.StickerIndex
      ) {
        continue
      }

      updated[sticker1] = sticker2
    }

    state.CommitChanges()
    return updated
  }
}

export class Translation {
  constructor(x: number, y: number, z: number, trans: Vector3D) {
    m_x = x
    m_y = y
    m_z = z
    m_translation = trans
  }

  m_x: number

  m_y: number

  m_z: number

  m_translation: Vector3D
}
