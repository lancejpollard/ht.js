// Information we need for a tiling.

import { Mobius } from '@Math/Mobius'
import { Utils } from '@Math/Utils'
import { Geometry } from './Geometry'
import { Geometry2D } from './Geometry2D'
import { Polygon, Segment } from './Polygon'
import { Vector3D } from './Vector3D'

export class TilingConfig {
  constructor(p: number, q: number, maxTiles: number) {
    this.P = p
    this.Q = q
    m.Unity()
    this.MaxTiles = maxTiles
    this.Shrink = 1
  }

  // constructor (p: number, q: number) {
  //     if ((Geometry2D.GetGeometry(p, q) != Geometry.Spherical)) {
  //         throw new Error('Argument Error');
  //     }

  //     this.SetupConfig(p, q, PlatonicSolids.NumFacets(p, q));
  // }

  P: number

  Q: number

  // The induced geometry.

  get Geometry(): Geometry {
    return Geometry2D.GetGeometry(this.P, this.Q)
  }

  // A Mobius transformation to apply while creating the tiling.

  M: Mobius

  m: Mobius

  // The max number of tiles to include in the tiling.

  MaxTiles: number

  // A shrinkage to apply to the drawn portion of a tile.
  // Default is 1.0 (no shrinkage).

  Shrink: number

  // Returns a Mobius transform that can be used to create a dual {q,p} tiling.
  // This Mobius transform will center the tiling on a vertex.

  VertexCenteredMobius(): Mobius {
    return TilingConfig.VertexCenteredMobius(this.P, this.Q)
  }

  static VertexCenteredMobius(p: number, q: number): Mobius {
    let angle: number = Math.PI / q
    if (Utils.Even(q)) {
      angle = angle * 2
    }

    let offset: Vector3D = Vector3D.construct3d(
      1 * Geometry2D.GetNormalizedCircumRadius(p, q) * -1,
      0,
      0,
    )
    offset.RotateXY(angle)
    let m: Mobius = Mobius.construct()
    this.m.Isometry(
      Geometry2D.GetGeometry(p, q),
      angle,
      offset.ToComplex(),
    )
    return this.m
  }

  // This Mobius transform will center the tiling on an edge.

  EdgeMobius(): Mobius {
    let g: Geometry = Geometry2D.GetGeometry(this.P, this.Q)
    let poly: Polygon = new Polygon()
    poly.CreateRegular(this.P, this.Q)
    let seg: Segment = poly.Segments[0]
    let offset: Vector3D = seg.Midpoint
    let angle: number = Math.PI / this.P
    offset.RotateXY(angle * -1)
    let m: Mobius = Mobius.construct()
    this.m.Isometry(g, angle * -1, offset.Negate())
    return this.m
  }
}
