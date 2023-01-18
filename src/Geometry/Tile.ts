import { Isometry } from '@Math/Isometry'
import { Mobius } from '@Math/Mobius'
import { isInfinite } from '@Math/Utils'
import { CircleNE } from './Circle'
import { Geometry } from './Geometry2D'
import { Polygon, Segment } from './Polygon'
import { Vector3D } from './Vector3D'

export class Tile {
  // constructor () {
  //     Isometry = new Isometry();
  //     EdgeIncidences = new Array<Tile>();
  //     VertexIndicences = new Array<Tile>();
  // }

  constructor(boundary: Polygon, drawn: Polygon, geometry: Geometry) {
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

  ///  <summary>
  ///  The center of this tile.
  ///  </summary>
  get Center(): Vector3D {
    return this.Boundary.Center
  }

  ///  <summary>
  ///  This is the isometry that will take us back to the parent tile.
  ///  NOTE: This is not internally updated during transformation,
  ///           or copied during a clone.  It is meant to be set once at tiling
  ///           generation time.
  ///  </summary>
  Isometry: Isometry

  ///  <summary>
  ///  Used to track edge-adjacent tiles in a tiling.
  ///  </summary>
  EdgeIncidences: Array<Tile>

  ///  <summary>
  ///  Used to track vertex-adjacent tiles in a tiling.
  ///  </summary>
  VertexIndicences: Array<Tile>

  Clone(): Tile {
    let newTile: Tile = new Tile()
    newTile.Boundary = this.Boundary.Clone()
    newTile.Drawn = this.Drawn.Clone()
    newTile.VertexCircle = this.VertexCircle.Clone()
    newTile.Geometry = this.Geometry
    return newTile
  }

  Reflect(s: Segment) {
    this.Boundary.Reflect(s)
    this.Drawn.Reflect(s)
    this.VertexCircle.Reflect(s)
  }

  ///  <summary>
  ///  Apply a Mobius transform to us.
  ///  </summary>
  Transform(m: Mobius) {
    this.Boundary.Transform(m)
    this.Drawn.Transform(m)
    this.VertexCircle.Transform(m)
  }

  Transform(i: Isometry) {
    this.Boundary.Transform(i)
    this.Drawn.Transform(i)
    this.VertexCircle.Transform(i)
  }

  ///  <summary>
  ///  Helper method to see if we have points projected to infinity.
  ///  </summary>
  get HasPointsProjectedToInfinity(): boolean {
    //  This can only happen in spherical case.
    if (this.Geometry != Geometry.Spherical) {
      return false
    }

    if (isInfinite(this.Boundary.Center)) {
      return true
    }

    //  We also need to check the edges.
    for (let s of this.Boundary.Segments) {
      if (isInfinite(s.P1) || isInfinite(s.P2)) {
        return true
      }
    }

    return false
  }

  ///  <summary>
  ///  ZZZ - needs to be part of performance setting?
  ///  Returns true if the tile should be included after a Mobius transformation will be applied.
  ///  If the tile is not be included, this method avoids applying the mobious transform to the entire tile.
  ///  </summary>
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

  ///  <summary>
  ///  A correct implementation of shrink tile.
  ///  hmmmm, is "scaling" even well defined in non-E geometries? Am I really looking for an equidistant curve?
  ///  Sadly, even if I figure out what is best, I fear changing out usage of the incorrect one below in MagicTile,
  ///  because of the possibility of breaking existing puzzles.
  ///  </summary>
  static ShrinkTileCorrect(/* ref */ tile: Tile, shrinkFactor: number) {
    let scaleFunc: System.Func<Vector3D, number, Vector3D> = null
    switch (tile.Geometry) {
      case Geometry.Euclidean:
        scaleFunc = (v, s) => v * s
        break
      case Geometry.Spherical:
        scaleFunc = (v, s) => {
          // Move to spherical norm, scale, then move back to euclidean.
          const scale = Spherical2D.s2eNorm(
            Spherical2D.e2sNorm(v.Abs()) * s,
          )
          v.Normalize()
          return v * scale
        }
        break
      case Geometry.Hyperbolic:
        throw new Error('Not implemented')
      default:
        break
    }
  }

  ///  <summary>
  ///  This will trim back the tile using an equidistant curve.
  ///  It assumes the tile is at the origin.
  ///  </summary>
  static ShrinkTile(/* ref */ tile: Tile, shrinkFactor: number) {
    //  This code is not correct in non-Euclidean cases!
    //  But it works reasonable well for small shrink factors.
    //  For example, you can easily use this function to grow a hyperbolic tile beyond the disk.
    let m: Mobius = new Mobius()
    m.Hyperbolic(tile.Geometry, new Vector3D(), shrinkFactor)
    tile.Drawn.Transform(m)
    return
  }
}
