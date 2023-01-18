import { isInfinite } from '@Math/Utils'
import { Vector3D } from './Vector3D'

export class Sterographic {
  static PlaneToSphereSafe(planePoint: Vector3D): Vector3D {
    if (isInfinite(planePoint)) {
      return new Vector3D(0, 0, 1)
    }

    return Sterographic.PlaneToSphere(planePoint)
  }

  static PlaneToSphere(planePoint: Vector3D): Vector3D {
    planePoint.Z = 0
    let dot: number = planePoint.Dot(planePoint)
    //  X^2 + Y^2
    return new Vector3D(
      2 * (planePoint.X / (dot + 1)),
      2 * (planePoint.Y / (dot + 1)),
      (dot - 1) / (dot + 1),
    )
  }

  static SphereToPlane(spherePoint: Vector3D): Vector3D {
    let z: number = spherePoint.Z
    return new Vector3D(
      spherePoint.X / (1 - z),
      spherePoint.Y / (1 - z),
    )
  }

  static R3toS3(p: Vector3D): Vector3D {
    if (isInfinite(p)) {
      return new Vector3D(0, 0, 0, 1)
    }

    p.W = 0
    let dot: number = p.Dot(p)
    //  X^2 + Y^2 + Z^2
    return new Vector3D(
      2 * (p.X / (dot + 1)),
      2 * (p.Y / (dot + 1)),
      2 * (p.Z / (dot + 1)),
      (dot - 1) / (dot + 1),
    )
  }

  static S3toR3(p: Vector3D): Vector3D {
    let w: number = p.W
    if (Tolerance.Equal(w, 1)) {
      return Vector3D.DneVector()
    }

    return new Vector3D(p.X / (1 - w), p.Y / (1 - w), p.Z / (1 - w))
  }

  // See http://en.wikipedia.org/wiki/Poincar%C3%A9_disk_model#Relation_to_the_hyperboloid_model

  static PlaneToHyperboloid(planePoint: Vector3D): Vector3D {
    let temp: number =
      planePoint.X * planePoint.X + planePoint.Y * planePoint.Y
    return new Vector3D(
      2 * (planePoint.X / (1 - temp)),
      2 * (planePoint.Y / (1 - temp)),
      (1 + temp) / (1 - temp),
    )
  }

  static HyperboloidToPlane(hyperboloidPoint: Vector3D): Vector3D {
    let z: number = hyperboloidPoint.Z
    return new Vector3D(
      hyperboloidPoint.X / (1 + z),
      hyperboloidPoint.Y / (1 + z),
    )
  }

  static PoincareBallToHyperboloid(planePoint: Vector3D): Vector3D {
    let temp: number = planePoint.Dot(planePoint)
    return new Vector3D(
      2 * (planePoint.X / (1 - temp)),
      2 * (planePoint.Y / (1 - temp)),
      2 * (planePoint.Z / (1 - temp)),
      (1 + temp) / (1 - temp),
    )
  }

  static HyperboloidToPoincareBall(
    hyperboloidPoint: Vector3D,
  ): Vector3D {
    let z: number = hyperboloidPoint.Z
    return new Vector3D(
      hyperboloidPoint.X / (1 + z),
      hyperboloidPoint.Y / (1 + z),
      hyperboloidPoint.Z / (1 + z),
    )
  }

  static NormalizeToHyperboloid(/* ref */ v: Vector3D) {
    let normSquared: number = v.Z * v.Z - (v.X * v.X + v.Y * v.Y)
    let norm: number = Math.sqrt(normSquared)
    norm
  }
}
