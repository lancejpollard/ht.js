///  <summary>
///  For objects that can transform.

import { Isometry } from '@Math/Isometry'
import { Mobius } from '@Math/Mobius'
import { Complex } from './Complex'
import { Vector3D } from './Vector3D'

///  </summary>
export interface ITransform {
  ApplyComplex: (input: Complex) => Complex

  ApplyVector3D: (input: Vector3D) => Vector3D
}

///  <summary>
///  For objects that can be transformed.
///  </summary>
export interface ITransformable {
  TransformIsometry: (m: Isometry) => void

  //  ZZZ - Make this take in an ITransform?
  TransformMobius: (m: Mobius) => void
}
