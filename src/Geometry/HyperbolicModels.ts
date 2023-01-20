import { DonHatch } from '@Math/DonHatch'
import { Mobius } from '@Math/Mobius'
import { Complex } from './Complex'
import { Geometry } from './Geometry'
import { SphericalModels } from '../Math/SphericalModels'
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
    return p.MultiplyWithNumber(mag)
  }

  static KleinToPoincareWithNumber(magSquared: number): number {
    let dot: number = magSquared
    if (dot > 1) {
      dot = 1
    }

    return (1 - Math.sqrt(1 - dot)) / dot
  }

  static KleinToPoincareWithVector3D(k: Vector3D): Vector3D {
    let dot: number = k.Dot(k)
    return k.MultiplyWithNumber(
      HyperbolicModels.KleinToPoincareWithNumber(dot),
    )
  }

  static get Upper(): Mobius {
    HyperbolicModels.Cache()
    return this.m_upper
  }

  static get UpperInv(): Mobius {
    HyperbolicModels.Cache()
    return this.m_upperInv
  }

  // This was needed for performance.  We don't want this Mobius transform calculated repeatedly.

  static Cache() {
    if (this.m_cached) {
      return
    }

    let m2: Mobius = Mobius.construct()
    let m1: Mobius = Mobius.construct()
    m2.Isometry(Geometry.Euclidean, 0, new Complex(0, -1))
    m1.UpperHalfPlane()
    this.m_upper = m2.Multiply(m1)
    this.m_upperInv = this.m_upper.Inverse()
    this.m_cached = true
  }

  static m_cached: boolean = false

  static m_upper: Mobius

  static m_upperInv: Mobius

  static PoincareToUpper(v: Vector3D): Vector3D {
    v = this.Upper.ApplyVector3D(v)
    return v
  }

  static UpperToPoincare(v: Vector3D): Vector3D {
    v = this.UpperInv.ApplyVector3D(v)
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
    z = new Complex(2, 0).Divide(
      new Complex(Math.PI, 0).Multiply(
        Complex.Log(
          new Complex(1, 0)
            .Add(z)
            .Divide(new Complex(1, 0).Subtract(z)),
        ),
      ),
    )
    return Vector3D.FromComplex(z)
  }

  static BandToPoincare(v: Vector3D): Vector3D {
    let vc: Complex = v.ToComplex()
    let pivc = new Complex(Math.PI, 0).Multiply(vc)
    let pivc2 = pivc.Divide(new Complex(2, 0))
    let a = Complex.Exp(pivc2).Subtract(new Complex(1, 0))
    let b = Complex.Exp(pivc2.Clone()).Add(new Complex(1, 0))
    let c = a.Divide(b)
    return Vector3D.FromComplex(c)
  }

  // <param name="a">The Euclidean period of the tiling in the band model.</param>
  static BandToRing(v: Vector3D, P: number, k: number): Vector3D {
    let vc: Complex = v.ToComplex()
    let i: Complex = new Complex(0, 1)
    let pi2 = 2 * Math.PI
    let pi2i = new Complex(pi2, 0).Multiply(i)
    let vci = vc.Add(i)
    let pi2i_vci = pi2i.Multiply(vci)
    let kp = k * P
    let div = pi2i_vci.Divide(new Complex(kp, 0))
    let x = Complex.Exp(div)
    return Vector3D.FromComplex(x)
  }

  // <param name="a">The Euclidean period of the tiling in the band model.</param>
  static RingToBand(v: Vector3D, P: number, k: number): Vector3D {
    let vc: Complex = v.ToComplex()
    let i: Complex = new Complex(0, 1)
    let pk = -P * k
    let pki = new Complex(pk, 0).Multiply(i)
    let pkivc = pki.Multiply(Complex.Log(vc))
    let div = pkivc.Divide(new Complex(2 * Math.PI, 0))
    let x = div.Subtract(new Complex(1, 0))
    return Vector3D.FromComplex(x)
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
    // let a: number = 0.9
    // let b: number = 1
    // let alpha: number = (a + b) / 2
    // let beta: number = (a - b) / 2
    //  disk -> ellipse
    //  Complex result = alpha * z + beta / z;
    let off: number = cen.Abs()
    let foil = (z: Complex): Complex => {
      //w *= 1 + Math.Sqrt( 2 );
      //Vector3D cen = new Vector3D( -off, -off );
      let rad = 1 + off // cen.Dist( new Vector3D( 1, 0 ) );
      z = z.Multiply(new Complex(rad, 0))
      z = z.Add(cen.ToComplex())
      return z
    }

    //  ellipse->disk
    let r1: Complex = w.Add(
      Complex.Sqrt(w.Multiply(w).Subtract(new Complex(1, 0))),
    )

    let r2: Complex = w.Subtract(
      Complex.Sqrt(w.Multiply(w).Subtract(new Complex(1, 0))),
    )

    r1 = foil(r1)
    r2 = foil(r2)

    if (r1.Magnitude <= 1) {
      w = r1
    } else {
      w = r2
    }

    return Vector3D.FromComplex(w)
  }

  static EquidistantToPoincareWithVector3D(p: Vector3D): Vector3D {
    let result: Vector3D = p
    result.Normalize()
    result = result.MultiplyWithNumber(
      HyperbolicModels.EquidistantToPoincareWithNumber(p.Abs()),
    )
    return result
  }

  static EquidistantToPoincareWithNumber(dist: number): number {
    return DonHatch.h2eNorm(dist)
  }

  static EqualAreaToPoincareWithVector(p: Vector3D): Vector3D {
    let result: Vector3D = p
    result.Normalize()
    result = result.MultiplyWithNumber(
      HyperbolicModels.EqualAreaToPoincare(p.Abs()),
    )
    return result
  }

  static EqualAreaToPoincare(dist: number): number {
    let h: number = 2 * DonHatch.asinh(dist)
    return DonHatch.h2eNorm(h)
  }
}
