///  <summary>
///  For objects that can transform.
///  </summary>
export interface ITransform {
  Apply: (input: Vector3D) => Vector3D

  Apply: (input: Complex) => Complex
}

///  <summary>
///  For objects that can be transformed.
///  </summary>
export interface ITransformable {
  //  ZZZ - Make this take in an ITransform?
  Transform: (m: Mobius) => void

  Transform: (m: Isometry) => void
}
