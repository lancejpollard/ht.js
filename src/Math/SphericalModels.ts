import { UtilsInfinity } from '@Math/Infinity'
import { Sterographic } from './Sterographic'
import { Vector3D } from '../Geometry/Vector3D'
import { isInfinite, Tolerance } from './Utils'
import { Euclidean2D } from '@Geometry/Euclidean2D'

export class SphericalCoords {
  // x,y,z -> r,theta,phi
  static CartesianToSpherical(v: Vector3D): Vector3D {
    let r = v.Abs()
    if (Tolerance.Zero(r)) {
      return Vector3D.construct()
    }

    return Vector3D.construct3d(
      r,
      Math.acos(v.Z / r),
      Math.atan2(v.Y, v.X),
    )
  }

  // r,theta,phi -> x,y,z
  static SphericalToCartesian(v: Vector3D): Vector3D {
    if (Tolerance.Zero(v.Abs())) {
      return Vector3D.construct()
    }

    return Vector3D.construct3d(
      v.X * Math.sin(v.Y) * Math.cos(v.Z),
      v.X * Math.sin(v.Y) * Math.sin(v.Z),
      v.X * Math.cos(v.Y),
    )
  }
}

export enum SphericalModel {
  Sterographic,

  Gnomonic,

  Azimuthal_Equidistant,

  Azimuthal_EqualArea,

  Equirectangular,

  Mercator,

  Orthographic,

  Sinusoidal,

  PeirceQuincuncial,
}

export class SphericalModels {
  static m_gScale: number = 0.5

  static StereoToGnomonic(p: Vector3D): Vector3D {
    let sphere: Vector3D = Sterographic.PlaneToSphere(p)
    //  We can only represent the lower hemisphere.
    if (sphere.Z >= 0) {
      sphere.Z = 0
      sphere.Normalize()
      sphere = sphere.MultiplyWithNumber(UtilsInfinity.FiniteScale)
      return sphere
    }

    let z: number = sphere.Z
    sphere.Z = 0
    return sphere.MultiplyWithNumber(this.m_gScale / z).Negate()
  }

  static GnomonicToStereo(g: Vector3D): Vector3D {
    g = g.Divide(this.m_gScale)

    let dot: number = g.Dot(g)
    //  X^2 + Y^2
    let z: number = (1 / Math.sqrt(dot + 1)) * -1

    return g.MultiplyWithNumber(z / (z - 1))
  }

  static StereoToEqualVolumeWithVector(p: Vector3D): Vector3D {
    let result: Vector3D = p
    result.Normalize()
    result = result.MultiplyWithNumber(
      SphericalModels.StereoToEqualVolume(p.Abs()),
    )
    return result
  }

  static StereoToEqualVolume(dist: number): number {
    if (isInfinite(dist)) {
      return 1
    }

    let dot: number = dist * dist
    //  X^2 + Y^2 + Z^2
    let w: number = (dot - 1) / (dot + 1)
    w = w * -1
    //  Because I derived formula from north pole.
    let t: number =
      Math.PI / 2 - w * Math.sqrt(1 - w * w) - Math.asin(w)

    let r: number = Math.pow(t * (3 / 2), 1 / 3)

    return r
  }

  static StereoToEqualAreaWithVector3D(p: Vector3D): Vector3D {
    let result: Vector3D = p
    result.Normalize()
    result = result.MultiplyWithNumber(
      SphericalModels.StereoToEqualArea(p.Abs()),
    )
    return result
  }

  ///  <summary>
  ///  https://en.wikipedia.org/wiki/Lambert_azimuthal_equal-area_projection
  ///  </summary>
  static StereoToEqualArea(dist: number): number {
    if (isInfinite(dist)) {
      return 1
    }

    let dot: number = dist * dist
    //  X^2 + Y^2 + Z^2
    let w: number = (dot - 1) / (dot + 1)
    let r: number = Math.sqrt(2 * (1 + w))
    return r / 2
  }

  static EqualAreaToStereoWithVector3D(p: Vector3D): Vector3D {
    let result: Vector3D = p
    result.Normalize()
    result = result.MultiplyWithNumber(
      SphericalModels.EqualAreaToStereo(p.Abs()),
    )
    return result
  }

  ///  <summary>
  ///  https://en.wikipedia.org/wiki/Lambert_azimuthal_equal-area_projection
  ///  </summary>
  static EqualAreaToStereo(dist: number): number {
    if (dist > 1) {
      throw new Error('Argument Error')
    }

    let v: Vector3D = Vector3D.construct3d(1, 2 * Math.acos(dist), 0)
    v = Sterographic.SphereToPlane(
      SphericalCoords.SphericalToCartesian(v),
    )
    return v.Abs()
  }

  static StereoToEquidistantWithVector3D(p: Vector3D): Vector3D {
    let result: Vector3D = p
    result.Normalize()
    result = result.MultiplyWithNumber(
      SphericalModels.StereoToEquidistant(p.Abs()),
    )
    return result
  }

  static StereoToEquidistant(dist: number): number {
    if (isInfinite(dist)) {
      return 1
    }

    let dot: number = dist * dist
    //  X^2 + Y^2 + Z^2
    let w: number = (dot - 1) / (dot + 1)
    let x: number = Math.sqrt(1 - w * w)
    let r: number = Euclidean2D.AngleToCounterClock(
      Vector3D.construct2d(0, -1),
      Vector3D.construct2d(x, w),
    )

    return r / Math.PI
  }

  static EquidistantToStereoWithVector3D(p: Vector3D): Vector3D {
    let result: Vector3D = p
    result.Normalize()
    result = result.MultiplyWithNumber(
      SphericalModels.EquidistantToStereo(p.Abs()),
    )
    return result
  }

  static EquidistantToStereo(dist: number): number {
    if (dist > 1) {
      throw new Error('Argument Error')
    }

    let v: Vector3D = Vector3D.construct2d(0, -1)
    v.RotateXY(dist * Math.PI)
    v = Sterographic.SphereToPlane(Vector3D.construct3d(v.X, 0, v.Y))

    return v.Abs()
  }

  static EquirectangularToStereo(v: Vector3D): Vector3D {
    //  http://mathworld.wolfram.com/EquirectangularProjection.html
    //  y is the latitude
    //  x is the longitude
    //  Assume inputs go from -1 to 1.
    let spherical: Vector3D = Vector3D.construct3d(
      1,
      Math.PI / (2 * (1 - v.Y)),
      v.X * Math.PI,
    )

    let onBall: Vector3D =
      SphericalCoords.SphericalToCartesian(spherical)

    return Sterographic.SphereToPlane(onBall)
  }

  static SinusoidalToStereo(v: Vector3D): Vector3D {
    let lat: number = Math.PI / (2 * (1 - v.Y))
    let spherical: Vector3D = Vector3D.construct3d(
      1,
      lat,
      Math.PI * (v.X / Math.cos(lat - Math.PI / 2)),
    )

    let onBall: Vector3D =
      SphericalCoords.SphericalToCartesian(spherical)

    return Sterographic.SphereToPlane(onBall)
  }

  ///  <summary>
  ///  2-dimensional function.
  ///  http://archive.bridgesmathart.org/2013/bridges2013-217.pdf
  ///  </summary>
  static MercatorToStereo(v: Vector3D): Vector3D {
    v = v.MultiplyWithNumber(Math.PI)

    //  Input is [-1,1]
    let lat: number = 2 * Math.atan(Math.exp(v.Y)) - Math.PI / 2
    let inclination: number = lat + Math.PI / 2
    let spherical: Vector3D = Vector3D.construct3d(1, inclination, v.X)
    let onBall: Vector3D =
      SphericalCoords.SphericalToCartesian(spherical)

    return Sterographic.SphereToPlane(onBall)
  }

  ///  <summary>
  ///  2-dimensional function.
  ///  ZZZ - Should make this general.
  ///  </summary>
  static OrthographicToStereo(v: Vector3D): Vector3D {
    //  We can only do the projection for half of the sphere.
    let t: number = v.X * v.X + v.Y * v.Y
    if (t > 1) {
      t = 1
    }

    v.Z = Math.sqrt(1 - t)
    return Sterographic.SphereToPlane(v)
  }
}
