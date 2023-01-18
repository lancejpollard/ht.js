import { Mobius } from '@Math/Mobius'
import { Complex } from './Complex'
import { Geometry } from './Geometry'
import { SphericalModels } from './SphericalModels'
import { Vector3D } from './Vector3D'

export enum HyperbolicModel {
  Poincare,

  Klein,

  Pseudosphere,

  Hyperboloid,

  Band,

  UpperHalfPlane,

  Orthographic,

  Square,

  InvertedPoincare,

  Joukowsky,

  Ring,

  Azimuthal_Equidistant,

  Azimuthal_EqualArea,

  Schwarz_Christoffel,
}

export class HyperbolicModels {
  static PoincareToKlein(p: Vector3D): Vector3D {
    let mag: number = 2 / (1 + p.Dot(p))
    return p * mag
  }

  static KleinToPoincare(magSquared: number): number {
    let dot: number = magSquared
    if (dot > 1) {
      dot = 1
    }

    return (1 - Math.sqrt(1 - dot)) / dot
  }

  static KleinToPoincare(k: Vector3D): Vector3D {
    let dot: number = k.Dot(k)
    return k * HyperbolicModels.KleinToPoincare(dot)
  }

  static get Upper(): Mobius {
    HyperbolicModels.Cache()
    return m_upper
  }

  static get UpperInv(): Mobius {
    HyperbolicModels.Cache()
    return m_upperInv
  }

  ///  <summary>
  ///  This was needed for performance.  We don't want this Mobius transform calculated repeatedly.
  ///  </summary>
  static Cache() {
    if (m_cached) {
      return
    }

    let m2: Mobius = new Mobius()
    let m1: Mobius = new Mobius()
    m2.Isometry(Geometry.Euclidean, 0, new Complex(0, -1))
    m1.UpperHalfPlane()
    m_upper = m2 * m1
    m_upperInv = m_upper.Inverse()
    m_cached = true
  }

  static m_cached: boolean = false

  static m_upper: Mobius

  static m_upperInv: Mobius

  static PoincareToUpper(v: Vector3D): Vector3D {
    v = Upper.Apply(v)
    return v
  }

  static UpperToPoincare(v: Vector3D): Vector3D {
    v = this.UpperInv.Apply(v)
    return v
  }

  static PoincareToOrtho(v: Vector3D): Vector3D {
    //  This may not be correct.
    //  Should probably project to hyperboloid, then remove z coord.
    return SphericalModels.StereoToGnomonic(v)
  }

  static OrthoToPoincare(v: Vector3D): Vector3D {
    return SphericalModels.GnomonicToStereo(v)
  }

  static PoincareToBand(v: Vector3D): Vector3D {
    let z: Complex = v.ToComplex()
    z = 2 / (Math.PI * Complex.Log((1 + z) / (1 - z)))
    return Vector3D.FromComplex(z)
  }

  static BandToPoincare(v: Vector3D): Vector3D {
    let vc: Complex = v.ToComplex()
    vc =
      (Complex.Exp(Math.PI * (vc / 2)) - 1) /
      (Complex.Exp(Math.PI * (vc / 2)) + 1)
    return Vector3D.FromComplex(vc)
  }

  ///  <param name="a">The Euclidean period of the tiling in the band model.</param>
  static BandToRing(v: Vector3D, P: number, k: number): Vector3D {
    let vc: Complex = v.ToComplex()
    let i: Complex = new Complex(0, 1)
    vc = Complex.Exp(2 * (Math.PI * (i * ((vc + i) / (k * P)))))
    return Vector3D.FromComplex(vc)
  }

  ///  <param name="a">The Euclidean period of the tiling in the band model.</param>
  static RingToBand(v: Vector3D, P: number, k: number): Vector3D {
    let vc: Complex = v.ToComplex()
    let i: Complex = new Complex(0, 1)
    vc = (P * (k * (i * (Complex.Log(vc) / (2 * Math.PI)))) - i) * -1
    return Vector3D.FromComplex(vc)
  }

  static RingToPoincare(v: Vector3D, P: number, k: number): Vector3D {
    let b: Vector3D = HyperbolicModels.RingToBand(v, P, k)
    return HyperbolicModels.BandToPoincare(b)
  }

  static JoukowskyToPoincare(v: Vector3D, cen: Vector3D): Vector3D {
    let w: Complex = v.ToComplex()
    //  Conformally map disk to ellipse with a > 1 and b = 1;
    //  https://math.stackexchange.com/questions/1582608/conformally-mapping-an-ellipse-into-the-unit-circle
    //  https://www.physicsforums.com/threads/conformal-mapping-unit-circle-ellipse.218014/
    let a: number = 0.9
    let b: number = 1
    let alpha: number = (a + b) / 2
    let beta: number = (a - b) / 2
    //  disk -> ellipse
    //  Complex result = alpha * z + beta / z;
    let off: number = cen.Abs()
    let foil: System.Func<Complex, Complex> = (foil = z => {
      //w *= 1 + Math.Sqrt( 2 );
      //Vector3D cen = new Vector3D( -off, -off );
      const rad = 1 + off // cen.Dist( new Vector3D( 1, 0 ) );
      z *= rad
      z += cen.ToComplex()
      return z
    })

    //  ellipse->disk
    let r1: Complex = w + Complex.Sqrt(w * w - 1)
    let r2: Complex = w - Complex.Sqrt(w * w - 1)
    r1 = foil(r1)
    r2 = foil(r2)
    if (r1.Magnitude <= 1) {
      w = r1
    } else {
      w = r2
    }

    return Vector3D.FromComplex(w)
  }

  static EquidistantToPoincare(p: Vector3D): Vector3D {
    let result: Vector3D = p
    result.Normalize()
    result = result * HyperbolicModels.EquidistantToPoincare(p.Abs())
    return result
  }

  static #EquidistantToPoincare(dist: number): number {
    return DonHatch.h2eNorm(dist)
  }

  static EqualAreaToPoincare(p: Vector3D): Vector3D {
    let result: Vector3D = p
    result.Normalize()
    result = result * HyperbolicModels.EqualAreaToPoincare(p.Abs())
    return result
  }

  static #EqualAreaToPoincare(dist: number): number {
    let h: number = 2 * DonHatch.asinh(dist)
    return DonHatch.h2eNorm(h)
  }
}
