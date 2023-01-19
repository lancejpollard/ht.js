import { Mobius } from '@Math/Mobius'
import { Complex } from './Complex'
import { Euclidean2D } from './Euclidean2D'
import { Geometry } from './Geometry'
import { Geometry2D } from './Geometry2D'
import { HyperbolicModels } from './HyperbolicModels'
import { SphericalModels } from './SphericalModels'
import { Vector3D } from './Vector3D'

export enum EuclideanModel {
  Isometric,

  Conformal,

  Disk,

  UpperHalfPlane,

  Spiral,

  Loxodromic,
}

export class EuclideanModels {
  static DiskToIsometric(v: Vector3D): Vector3D {
    //  ZZZ - Check that this is correct (it's quite close if not!)
    return SphericalModels.StereoToGnomonic(v)
  }

  static UpperHalfPlaneToIsometric(v: Vector3D): Vector3D {
    v = HyperbolicModels.UpperToPoincare(v)
    v = SphericalModels.StereoToGnomonic(v)
    return v
  }

  static SpiralToIsometric(
    v: Vector3D,
    p: number,
    m: number,
    n: number,
  ): Vector3D {
    let vc: Complex = v.ToComplex()
    v = Vector3D.construct2d(Math.log(vc.Magnitude), vc.Phase)
    let e1: Vector3D = Vector3D.construct2d(0, 1)
    let e2: Vector3D
    switch (p) {
      case 3:
        e2 = Vector3D.construct()
        break
      case 4:
        e2 = Vector3D.construct()
        break
      case 6:
        e2 = Vector3D.construct()
        break
      default:
        throw new Error('Argument Error')
        break
    }

    let scale: number = Math.sqrt(m * m + n * n)
    let a: number = Euclidean2D.AngleToClock(
      Vector3D.construct2d(0, 1),
      Vector3D.construct2d(m, n),
    )
    v.RotateXY(a)
    //  Rotate
    v = v * scale
    //  Scale
    v =
      v *
      (Math.sqrt(2) * (Geometry2D.EuclideanHypotenuse / (2 * Math.PI)))
    v.RotateXY(Math.PI / 4)
    return v
  }

  static LoxodromicToIsometric(
    v: Vector3D,
    p: number,
    m: number,
    n: number,
  ): Vector3D {
    let mob: Mobius = Mobius.CreateFromIsometry(
      Geometry.Spherical,
      0,
      new Complex(1, 0),
    )
    v = mob.ApplyVector3D(v)
    return EuclideanModels.SpiralToIsometric(v, p, m, n)
  }
}
