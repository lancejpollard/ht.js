import { Mobius } from '@Math/Mobius'
import _ from 'lodash'
import { Circle, CircleNE } from './Circle'
import { Geometry } from './Geometry'
import { Polygon, Segment } from './Polygon'
import { PolytopeProjection } from './PolytopeProjection'
import { Slicer } from './Slicer'
import { Tile } from './Tile'
import { TilingConfig } from './TilingConfig'
import { Vector3D } from './Vector3D'

export class Tiling {
  constructor(config: TilingConfig) {
    this.m_tiles = []
    this.TilePositions = {}
    this.TilingConfig = config
  }

  // The tiling configuration.

  TilingConfig: TilingConfig

  // Our tiles.

  m_tiles: Array<Tile>

  // A Record from tile centers to tiles.

  TilePositions: Record<number, Tile>

  // Generate ourselves from a tiling config.

  Generate() {
    this.GenerateInternal()
  }

  GenerateInternal(
    projection: PolytopeProjection = PolytopeProjection.FaceCentered,
  ) {
    //  Create a base tile.
    let tile: Tile = Tiling.CreateBaseTile(this.TilingConfig)
    //  Handle edge/vertex centered projections.
    if (projection == PolytopeProjection.VertexCentered) {
      let mobius: Mobius = this.TilingConfig.VertexCenteredMobius()
      tile.TransformMobius(mobius)
    } else if (projection == PolytopeProjection.EdgeCentered) {
      let mobius: Mobius = this.TilingConfig.EdgeMobius()
      tile.TransformMobius(mobius)
    }

    this.TransformAndAdd(tile)
    let tiles: Array<Tile> = new Array<Tile>()
    tiles.push(tile)
    let completed: Record<number, boolean> = {}
    completed[tile.Boundary.Center.GetHashCode()] = true
    this.ReflectRecursive(tiles, completed)
    Tiling.FillOutIsometries(
      tile,
      this.m_tiles,
      this.TilingConfig.Geometry,
    )
    this.FillOutIncidences()
  }

  // This will fill out all the tiles with the isometry that will take them back to a home tile.

  static FillOutIsometries(
    home: Tile,
    tiles: Array<Tile>,
    g: Geometry,
  ) {
    for (let tile of tiles) {
      tile.Isometry.CalculateFromTwoPolygons(home, tile, g)
    }
  }

  static TryGetTile(
    edges: Record<number, Array<Tile>>,
    edge: Vector3D,
    ref: { passThrough: Array<unknown> },
  ) {
    const resolved = edges[edge.GetHashCode()]
    ref.passThrough = resolved ?? []
    return Boolean(resolved)
  }

  // Fill out all the incidence information.
  // If performance became an issue, we could do some of this at tile generation time.

  FillOutIncidences() {
    const Edges: Record<number, Array<Tile>> = {}
    const Vertices: Record<number, Array<Tile>> = {}

    for (let t of this.m_tiles) {
      for (let edge of t.Boundary.EdgeMidpoints) {
        let list: Array<Tile>
        let state: { passThrough: Array<Tile> } = { passThrough: [] }
        if (!Tiling.TryGetTile(Edges, edge, state)) {
          list = []
          Edges[edge.GetHashCode()] = list
        } else {
          list = state.passThrough
        }

        list.push(t)
      }

      for (let vertex of t.Boundary.Vertices) {
        let list: Array<Tile> = []
        let state: { passThrough: Array<Tile> } = { passThrough: [] }
        if (!Tiling.TryGetTile(Vertices, vertex, state)) {
          list = []
          Vertices[vertex.GetHashCode()] = list
        } else {
          list = state.passThrough
        }

        list.push(t)
      }
    }

    for (let list of Object.values(Edges)) {
      for (let t of list) {
        t.EdgeIncidences.push(...list)
      }
    }

    for (let list of Object.values(Vertices)) {
      for (let t of list) {
        t.VertexIndicences.push(...list)
      }
    }

    for (let t of this.m_tiles) {
      //  Remove duplicates and ourselves from lists.
      t.EdgeIncidences = _.pull(_.uniq(t.EdgeIncidences), t)
      t.VertexIndicences = _.pull(
        _.uniq(t.VertexIndicences),
        t,
        //  Also, make sure we only track vertex incidences that do not have edge incidences too.
        ...t.EdgeIncidences,
      )
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

  // Clips the tiling to the interior of a circle.

  Clip(c: Circle, interior: boolean = true) {
    this.m_tiles = Slicer.Clip(this.m_tiles, c, interior)
  }

  // Will clone the tile, transform it and add it to our tiling.

  TransformAndAdd(tile: Tile): boolean {
    //  Will we want to include it?
    if (!tile.IncludeAfterMobius(this.TilingConfig.M)) {
      return false
    }

    let clone: Tile = tile.Clone()
    clone.TransformMobius(this.TilingConfig.M)
    this.m_tiles.push(clone)
    this.TilePositions[clone.Boundary.Center.GetHashCode()] = clone
    return true
  }

  // This will return whether we'll be a new tile after reflecting through a segment.
  // This allows us to do the check without having to do all the work of reflecting the entire tile.

  NewTileAfterReflect(
    t: Tile,
    s: Segment,
    completed: Record<number, boolean>,
  ): boolean {
    let newVertexCircle: CircleNE = t.VertexCircle.Clone()
    newVertexCircle.ReflectSegment(s)
    let testCenter: Vector3D = this.TilingConfig.M.Apply(
      newVertexCircle.CenterNE,
    )
    return !completed.hasOwnProperty(testCenter.GetHashCode())
  }

  ReflectRecursive(
    tiles: Array<Tile>,
    completed: Record<number, boolean>,
  ) {
    //  Breadth first recursion.
    if (0 == tiles.length) {
      return
    }

    let reflected: Array<Tile> = new Array<Tile>()

    for (let tile of tiles) {
      //  We don't want to reflect tiles living out at infinity.
      //  Strange things happen, and we can still get the full tiling without doing this.
      if (tile.HasPointsProjectedToInfinity) {
        continue
      }

      //  Are we done?
      if (this.m_tiles.length >= this.TilingConfig.MaxTiles) {
        return
      }

      const n = tile.Boundary?.NumSides ?? 0

      for (let s: number = 0; s < n; s++) {
        let seg: Segment | undefined = tile.Boundary?.Segments[s]
        if (!seg || !this.NewTileAfterReflect(tile, seg, completed)) {
          continue
        }

        let newBase: Tile = tile.Clone()
        newBase.Reflect(seg)

        if (this.TransformAndAdd(newBase)) {
          console.assert(
            !completed.hasOwnProperty(
              newBase.Boundary.Center.GetHashCode(),
            ),
          )
          reflected.push(newBase)
          completed[newBase.Boundary.Center.GetHashCode()] = true
        }
      }
    }

    this.ReflectRecursive(reflected, completed)
  }

  // The number of tiles.

  get Count(): number {
    return this.m_tiles.length
  }

  // Access to all the tiles.

  get Tiles(): Array<Tile> {
    return this.m_tiles
  }

  // Retrieve all the polygons in this tiling that we want to draw.

  get Polygons(): Array<Polygon> {
    return this.m_tiles.map(t => t.Drawn).filter(t => Boolean(t))
  }

  // Retreive all the (non-Euclidean) vertex circles in this tiling.

  get Circles(): Array<CircleNE> {
    return this.m_tiles.map(t => t.VertexCircle).filter(t => t)
  }
}
