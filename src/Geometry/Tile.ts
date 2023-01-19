import { UtilsInfinity } from '@Math/Infinity'
import { Isometry } from '@Math/Isometry'
import { Mobius } from '@Math/Mobius'
import { CircleNE } from './Circle'
import { Geometry } from './Geometry'
import { Polygon, Segment } from './Polygon'
import { Spherical2D } from './Spherical2D'
import { Vector3D } from './Vector3D'

export class Tile {
  constructor(boundary: Polygon, drawn: Polygon, geometry: Geometry) {
    this.Isometry = Isometry.constructUnity()
    this.EdgeIncidences = new Array<Tile>()
    this.VertexIndicences = new Array<Tile>()
    this.Boundary = boundary
    this.Drawn = drawn
    this.Geometry = geometry
    //  Make the vertex circle.
    this.VertexCircle = boundary.CircumCircle
    //  ZZZ - we shouldn't do this here (I did it for the slicing study page).
    // VertexCircle.Radius = 1.0;
    //
    //  Below are experimentations with different vertex circle sizes.
    //
    // VertexCircle.Radius *= (1+1.0/9);
    //  cuts adjacent cells at midpoint
    //  Math.sqrt(63)/6 for {3,6}
    //  (1 + 1.0/5) for {3,7}
    //  (1 + 1.0/9) for {3,8}
    //  (1 + 1.0/20) for {3,9}
    //  cuts at 1/3rd
    //  2/Math.sqrt(3) for {3,6}
  }

  Boundary: Polygon

  Drawn: Polygon

  VertexCircle: CircleNE

  Geometry: Geometry

  // The center of this tile.

  get Center(): Vector3D | undefined {
    return this.Boundary?.Center
  }

  // This is the isometry that will take us back to the parent tile.
  // NOTE: This is not internally updated during transformation,
  // or copied during a clone.  It is meant to be set once at tiling
  // generation time.

  Isometry: Isometry

  // Used to track edge-adjacent tiles in a tiling.

  EdgeIncidences: Array<Tile>

  // Used to track vertex-adjacent tiles in a tiling.

  VertexIndicences?: Array<Tile>

  Clone(): Tile {
    let next: Tile = new Tile(this.Boundary, this.Drawn, this.Geometry)
    next.VertexCircle = this.VertexCircle?.Clone()
    return next
  }

  Reflect(s: Segment) {
    this.Boundary.Reflect(s)
    this.Drawn.Reflect(s)
    this.VertexCircle.ReflectSegment(s)
  }

  // Apply a Mobius transform to us.

  TransformMobius(m: Mobius) {
    this.Boundary.Transform(m)
    this.Drawn.Transform(m)
    this.VertexCircle.Transform(m)
  }

  TransformIsometry(i: Isometry) {
    this.Boundary.Transform(i)
    this.Drawn.Transform(i)
    this.VertexCircle.Transform(i)
  }

  // Helper method to see if we have points projected to infinity.

  get HasPointsProjectedToInfinity(): boolean {
    //  This can only happen in spherical case.
    if (this.Geometry != Geometry.Spherical) {
      return false
    }

    if (UtilsInfinity.IsInfiniteVector3D(this.Boundary.Center)) {
      return true
    }

    //  We also need to check the edges.
    for (let s of this.Boundary.Segments) {
      if (
        UtilsInfinity.IsInfiniteVector3D(s.P1) ||
        UtilsInfinity.IsInfiniteVector3D(s.P2)
      ) {
        return true
      }
    }

    return false
  }

  // ZZZ - needs to be part of performance setting?
  // Returns true if the tile should be included after a Mobius transformation will be applied.
  // If the tile is not be included, this method avoids applying the mobious transform to the entire tile.

  IncludeAfterMobius(m: Mobius): boolean {
    switch (this.Geometry) {
      case Geometry.Spherical:
        return true
      case Geometry.Euclidean:
        return true
      //  We'll let the number of tiles specified in the tiling control this..
      case Geometry.Hyperbolic:
        // Polygon poly = Boundary.Clone();
        // poly.Transform( m );
        // bool use = (poly.Length > 0.01);
        //  ZZZ - DANGER! Some transforms can cause this to lead to stackoverflow (the ones that scale the tiling up).
        // bool use = ( poly.Length > 0.01 ) && ( poly.Center.Abs() < 10 );
        // bool use = ( poly.Center.Abs() < 0.9 );    // Only disk
        let c: CircleNE = this.VertexCircle
        let use: boolean = c.CenterNE.Abs() < 0.9999
        return use
      default:
        break
    }

    console.assert(false)
    return false
  }

  // A correct implementation of shrink tile.
  // hmmmm, is "scaling" even well defined in non-E geometries? Am I really looking for an equidistant curve?
  // Sadly, even if I figure out what is best, I fear changing out usage of the incorrect one below in MagicTile,
  // because of the possibility of breaking existing puzzles.

  static ShrinkTileCorrect(/* ref */ tile: Tile, shrinkFactor: number) {
    let scaleFunc: (v: Vector3D, s: number) => Vector3D
    switch (tile.Geometry) {
      case Geometry.Euclidean:
        scaleFunc = (v: Vector3D, s: number) => v.MultiplyWithNumber(s)
        break
      case Geometry.Spherical:
        scaleFunc = (v: Vector3D, s: number) => {
          // Move to spherical norm, scale, then move back to euclidean.
          const scale = Spherical2D.s2eNorm(
            Spherical2D.e2sNorm(v.Abs()) * s,
          )
          v.Normalize()
          return v.MultiplyWithNumber(scale)
        }
        break
      case Geometry.Hyperbolic:
        throw new Error('Not implemented')
      default:
        break
    }
  }

  // This will trim back the tile using an equidistant curve.
  // It assumes the tile is at the origin.

  static ShrinkTile(tile: Tile, shrinkFactor: number) {
    //  This code is not correct in non-Euclidean cases!
    //  But it works reasonable well for small shrink factors.
    //  For example, you can easily use this function to grow a hyperbolic tile beyond the disk.
    let m: Mobius = Mobius.construct()
    m.Hyperbolic(
      tile.Geometry,
      Vector3D.construct().ToComplex(),
      shrinkFactor,
    )
    tile.Drawn.Transform(m)
    return
  }
}
