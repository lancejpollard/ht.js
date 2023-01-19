import { Tolerance } from '@Math/Utils'
import { Vector3D } from './Vector3D'

export class Spherical2D {
  //  The next two methods mimic Don's stuff for the hyperbolic plane.
  static s2eNorm(sNorm: number): number {
    // if( double.IsNaN( sNorm ) )
    //     return 1.0;
    return Math.tan(0.5 * sNorm)
  }

  static e2sNorm(eNorm: number): number {
    return 2 * Math.atan(eNorm)
  }

  ///  <summary>
  ///  Sphere geometry is implicit.  A radius 1 sphere with the center at the origin.
  ///  </summary>
  static SphereToPlane(spherePoint: Vector3D): Vector3D {
    let projected: Vector3D = spherePoint.CentralProject(1)
    return projected
  }

  ///  <summary>
  ///  Sphere geometry is implicit.  A radius 1 sphere with the center at the origin.
  ///  </summary>
  static PlaneToSphere(planePoint: Vector3D): Vector3D {
    planePoint.Z = 0

    //  Just to be safe.
    let magSquared: number = planePoint.MagSquared()

    let result: Vector3D = Vector3D.construct3d(
      2 * (planePoint.X / (1 + magSquared)),
      2 * (planePoint.Y / (1 + magSquared)),
      (magSquared - 1) / (magSquared + 1),
    )

    return result
  }

  ///  <summary>
  ///  Calculates the two poles of a great circle defined by two points.
  ///  </summary>
  static GreatCirclePoleWithCenter(
    sphereCenter: Vector3D,
    p1: Vector3D,
    p2: Vector3D,
  ) {
    let sphereRadius: number = p1.Dist(sphereCenter)

    console.assert(Tolerance.Equal(sphereRadius, p2.Dist(sphereCenter)))

    let v1: Vector3D = p1.Subtract(sphereCenter)
    let v2: Vector3D = p2.Subtract(sphereCenter)

    const pole1 = v1.Cross(v2).Add(sphereCenter)
    const pole2 = v2.Cross(v1).Add(sphereCenter)

    return [pole1, pole2]
  }

  ///  <summary>
  ///  Same as above, but with implicit sphere geometry.  A radius 1 sphere with the center at the origin.
  ///  </summary>
  static GreatCirclePole(p1: Vector3D, p2: Vector3D) {
    Spherical2D.GreatCirclePoleWithCenter(
      Vector3D.construct3d(0, 0, 0),
      p1,
      p2,
    )
  }

  ///  <summary>
  ///  Spherical distance between two points on the plane.
  ///  </summary>
  static SDist(p1: Vector3D, p2: Vector3D): number {
    p1 = Spherical2D.PlaneToSphere(p1)
    p2 = Spherical2D.PlaneToSphere(p2)

    return p1.AngleTo(p2)
  }
}
