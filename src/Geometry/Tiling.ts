import { Mobius } from '@Math/Mobius'
import { Circle, CircleNE } from './Circle'
import { Geometry } from './Geometry'
import { Polygon } from './Polygon'
import { PolytopeProjection } from './PolytopeProjection'
import { Slicer } from './Slicer'
import { Tile } from './Tile'
import { TilingConfig } from './TilingConfig'
import { Vector3D } from './Vector3D'

export class Tiling {
  constructor() {
    this.m_tiles = new Array<Tile>()
    this.TilePositions = new Record<Vector3D, Tile>()
  }

  ///  <summary>
  ///  The tiling configuration.
  ///  </summary>
  TilingConfig: TilingConfig

  ///  <summary>
  ///  Our tiles.
  ///  </summary>
  m_tiles: Array<Tile>

  ///  <summary>
  ///  A Record from tile centers to tiles.
  ///  </summary>
  TilePositions: Record<Vector3D, Tile>

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
    tiling1.GenerateInternal(config1, PolytopeProjection.FaceCentered)
    tiling2.GenerateInternal(config2, PolytopeProjection.VertexCentered)
  }

  ///  <summary>
  ///  Generate ourselves from a tiling config.
  ///  </summary>
  Generate(config: TilingConfig) {
    this.GenerateInternal(config)
  }

  GenerateInternal(
    config: TilingConfig,
    projection: PolytopeProjection = PolytopeProjection.FaceCentered,
  ) {
    this.TilingConfig = config
    //  Create a base tile.
    let tile: Tile = Tiling.CreateBaseTile(config)
    //  Handle edge/vertex centered projections.
    if (projection == PolytopeProjection.VertexCentered) {
      let mobius: Mobius = config.VertexCenteredMobius()
      tile.Transform(mobius)
    } else if (projection == PolytopeProjection.EdgeCentered) {
      let mobius: Mobius = config.EdgeMobius()
      tile.Transform(mobius)
    }

    this.TransformAndAdd(tile)
    let tiles: Array<Tile> = new Array<Tile>()
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
  static FillOutIsometries(
    home: Tile,
    tiles: Array<Tile>,
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
  FillOutIncidences() {
    let Edges: Record<Vector3D, Array<Tile>> = new Record<
      Vector3D,
      Array<Tile>
    >()

    let Vertices: Record<Vector3D, Array<Tile>> = new Record<
      Vector3D,
      Array<Tile>
    >()

    for (let t: Tile of this.m_tiles) {
      for (let edge: Vector3D in t.Boundary.EdgeMidpoints) {
        let list: Array<Tile>
        if (!Edges.TryGetValue(edge, /* out */ list)) {
          list = new Array<Tile>()
          Edges[edge] = list
        }

        list.Add(t)
      }

      for (let vertex: Vector3D of t.Boundary.Vertices) {
        let list: Array<Tile>
        if (!Vertices.TryGetValue(vertex, /* out */ list)) {
          list = new Array<Tile>()
          Vertices[vertex] = list
        }

        list.Add(t)
      }
    }

    for (let list: Array<Tile> of Edges.Values) {
      for (let t: Tile in list) {
        t.EdgeIncidences.AddRange(list)
      }
    }

    for (let list: Array<Tile> of Vertices.Values) {
      for (let t: Tile in list) {
        t.VertexIndicences.AddRange(list)
      }
    }

    for (let t: Tile of this.m_tiles) {
      //  Remove duplicates and ourselves from lists.
      t.EdgeIncidences = t.EdgeIncidences.Distinct()
        .Except([t])
        .ToArray()
      t.VertexIndicences = t.VertexIndicences.Distinct()
        .Except([t])
        .ToArray()
      //  Also, make sure we only track vertex incidences that do not have edge incidences too.
      t.VertexIndicences = t.VertexIndicences.Except(
        t.EdgeIncidences,
      ).ToArray()
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
    let tile: Tile = Tile.constructWithBoundary(
      boundary,
      drawn,
      config.Geometry,
    )
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
  TransformAndAdd(tile: Tile): boolean {
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

  ReflectRecursive(
    tiles: Array<Tile>,
    completed: Record<Vector3D, boolean>,
  ) {
    //  Breadth first recursion.
    if (0 == tiles.Count) {
      return
    }

    let reflected: Array<Tile> = new Array<Tile>()
    for (let tile: Tile in tiles) {
      //  We don't want to reflect tiles living out at infinity.
      //  Strange things happen, and we can still get the full tiling without doing this.
      if (tile.HasPointsProjectedToInfinity) {
        continue
      }

      //  Are we done?
      if (this.m_tiles.Count >= this.TilingConfig.MaxTiles) {
        return
      }

      for (let s: number = 0; s < tile.Boundary.NumSides; s++) {
        let seg: Segment = tile.Boundary.Segments[s]
        if (!this.NewTileAfterReflect(tile, seg, completed)) {
          continue
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
