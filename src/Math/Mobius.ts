import { Complex } from '@Geometry/Complex'
import { Geometry } from '@Geometry/Geometry'
import { Spherical2D } from '@Geometry/Spherical2D'
import { ITransform } from '@Geometry/Transformable'
import { Vector3D } from '@Geometry/Vector3D'
import { DonHatch } from './DonHatch'
import { UtilsInfinity } from './Infinity'
import { Utils } from './Utils'

export class Mobius implements ITransform {
  constructor() {
    this.A = new Complex(0, 0)
    this.B = new Complex(0, 0)
    this.C = new Complex(0, 0)
    this.D = new Complex(0, 0)
  }

  static construct() {
    const self = new Mobius()
    return self
  }

  static construct4d(a: Complex, b: Complex, c: Complex, d: Complex) {
    const self = new Mobius()
    self.A = a
    self.B = b
    self.C = d
    self.D = d
    return self
  }

  Merge(other: Mobius) {
    this.A = other.A
    this.B = other.B
    this.C = other.C
    this.D = other.D
  }

  // This transform will map z1 to Zero, z2, to One, and z3 to Infinity.

  static construct3d(z1: Complex, z2: Complex, z3: Complex) {
    const self = new Mobius()
    self.MapPoints3d(z1, z2, z3)
    return self
  }

  A: Complex

  B: Complex

  C: Complex

  D: Complex

  ToString(): string {
    return `A: ${this.A} B: ${this.B} C: ${this.C} D: ${this.D}`
  }

  static Multiply(m1: Mobius, m2: Mobius): Mobius {
    let result: Mobius = Mobius.construct4d(
      m1.A.Multiply(m2.A).Add(m1.B.Multiply(m2.C)),
      m1.A.Multiply(m2.B).Add(m1.B.Multiply(m2.D)),
      m1.C.Multiply(m2.A).Add(m1.D.Multiply(m2.C)),
      m1.C.Multiply(m2.B).Add(m1.D.Multiply(m2.D)),
    )
    result.Normalize()
    return result
  }

  Multiply(m2: Mobius): Mobius {
    return Mobius.Multiply(this, m2)
  }

  // Normalize so that ad - bc = 1

  Normalize() {
    //  See Visual Complex Analysis, p150
    let k: Complex = Complex.Reciprocal(
      Complex.Sqrt(
        this.A.Multiply(this.D).Subtract(this.B.Multiply(this.C)),
      ),
    )
    this.ScaleComponents(k)
  }

  ScaleComponents(k: Complex) {
    this.A = this.A.Multiply(k)
    this.B = this.B.Multiply(k)
    this.C = this.C.Multiply(k)
    this.D = this.D.Multiply(k)
  }

  get Trace(): Complex {
    return this.A.Add(this.D)
  }

  get TraceSquared(): Complex {
    return this.Trace.Multiply(this.Trace)
  }

  // This will calculate the Mobius transform that represents an isometry in the given geometry.
  // The isometry will rotate CCW by angle A about the origin, then translate the origin to P (and -P to the origin).

  Isometry(g: Geometry, angle: number, P: Complex) {
    //  As Don notes in the hypebolic case:
    //  Any isometry of the Poincare disk can be expressed as a complex function of z of the form:
    //  (T*z + P)/(1 + conj(P)*T*z), where T and P are complex numbers, |P| < 1 and |T| = 1.
    //  This indicates a rotation by T around the origin followed by moving the origin to P (and -P to the origin).
    //
    //  I figured out that the other cases can be handled with simple variations of the C coefficients.
    let T: Complex = new Complex(Math.cos(angle), Math.sin(angle))

    this.A = T
    this.B = P
    this.D = new Complex(1, 0)

    switch (g) {
      case Geometry.Spherical:
        this.C = Complex.Conjugate(P).Multiply(T.Negate())
        break
      case Geometry.Euclidean:
        this.C = new Complex(0, 0)
        break
      case Geometry.Hyperbolic:
        this.C = Complex.Conjugate(P).Multiply(T)
        break
      default:
        break
    }
  }

  static CreateFromIsometry(
    g: Geometry,
    angle: number,
    P: Complex,
  ): Mobius {
    let m: Mobius = Mobius.construct()
    m.Isometry(g, angle, P)
    return m
  }

  // The identity Mobius transformation.

  Unity() {
    this.A = Complex.One
    this.B = Complex.Zero
    this.C = Complex.Zero
    this.D = Complex.One
  }

  // The pure translation (i.e. moves the origin straight in some direction) that takes p1 to p2.
  // I borrowed this from Don's hyperbolic applet.

  PureTranslation(g: Geometry, p1: Complex, p2: Complex) {
    let A: Complex = p2.Subtract(p1)
    let B: Complex = p2.Multiply(p1)

    let denom: number =
      1 - (B.Real * B.Real + B.Imaginary * B.Imaginary)

    let P: Complex = new Complex(
      (A.Real * (1 + B.Real) + A.Imaginary * B.Imaginary) / denom,
      (A.Imaginary * (1 - B.Real) + A.Real * B.Imaginary) / denom,
    )

    this.Isometry(g, 0, P)
    this.Normalize()
  }

  // Move from a point p1 -> p2 along a geodesic.
  // Also somewhat from Don.

  Geodesic(g: Geometry, p1: Complex, p2: Complex) {
    let t: Mobius = Mobius.construct()
    t.Isometry(g, 0, p1.Negate())

    let p2t: Complex = t.ApplyComplex(p2)
    let m2: Mobius = Mobius.construct()
    let m1: Mobius = Mobius.construct()
    m1.Isometry(g, 0, p1.Negate())
    m2.Isometry(g, 0, p2t)

    let m3: Mobius = m1.Inverse()
    this.Merge(m3.Multiply(m2.Multiply(m1)))
  }

  Hyperbolic(g: Geometry, fixedPlus: Complex, scale: number) {
    //  To the origin.
    let m1: Mobius = Mobius.construct()
    m1.Isometry(g, 0, fixedPlus.Negate())

    //  Scale.
    let m2: Mobius = Mobius.construct()
    m2.A = new Complex(scale, 0)
    m2.C = new Complex(0, 0)
    m2.B = new Complex(0, 0)
    m2.D = new Complex(1, 0)

    //  Back.
    // Mobius m3 = m1.Inverse();    // Doesn't work well if fixedPlus is on disk boundary.
    let m3: Mobius = Mobius.construct()
    m3.Isometry(g, 0, fixedPlus)

    //  Compose them (multiply in reverse order).
    this.Merge(m3.Multiply(m2.Multiply(m1)))
  }

  // Allow a hyperbolic transformation using an absolute offset.
  // offset is specified in the respective geometry.

  Hyperbolic2(
    g: Geometry,
    fixedPlus: Complex,
    point: Complex,
    offset: number,
  ) {
    //  To the origin.
    let m: Mobius = Mobius.construct()
    m.Isometry(g, 0, fixedPlus.Negate())

    let eRadius: number = m.ApplyComplex(point).Magnitude
    let scale: number = 1

    switch (g) {
      case Geometry.Spherical:
        let sRadius: number = Spherical2D.e2sNorm(eRadius)
        sRadius = sRadius + offset
        scale = Spherical2D.s2eNorm(sRadius) / eRadius
        break
      case Geometry.Euclidean:
        scale = (eRadius + offset) / eRadius
        break
      case Geometry.Hyperbolic:
        let hRadius: number = DonHatch.e2hNorm(eRadius)
        hRadius = hRadius + offset
        scale = DonHatch.h2eNorm(hRadius) / eRadius
        break
      default:
        break
    }

    this.Hyperbolic(g, fixedPlus, scale)
  }

  Elliptic(g: Geometry, fixedPlus: Complex, angle: number) {
    //  To the origin.
    let origin: Mobius = Mobius.construct()
    origin.Isometry(g, 0, fixedPlus.Negate())

    //  Rotate.
    let rotate: Mobius = Mobius.construct()
    rotate.Isometry(g, angle, new Complex(0, 0))

    //  Conjugate.
    this.Merge(origin.Inverse().Multiply(rotate.Multiply(origin)))
  }

  // This will transform the unit disk to the upper half plane.

  UpperHalfPlane() {
    this.MapPoints3d(
      Complex.ImaginaryOne.Negate(),
      Complex.One,
      Complex.ImaginaryOne,
    )
  }

  // This transform will map z1 to Zero, z2 to One, and z3 to Infinity.
  // http://en.wikipedia.org/wiki/Mobius_transformation#Mapping_first_to_0.2C_1.2C_.E2.88.9E
  // If one of the zi is , then the proper formula is obtained by first
  // dividing all entries by zi and then taking the limit zi � 

  MapPoints3d(z1: Complex, z2: Complex, z3: Complex) {
    if (UtilsInfinity.IsInfiniteComplex(z1)) {
      this.A = new Complex(0, 0)
      this.B = Complex.Multiply(new Complex(-1, 0), z2.Subtract(z3))
      this.C = new Complex(-1, 0)
      this.D = z3
    } else if (UtilsInfinity.IsInfiniteComplex(z2)) {
      this.A = new Complex(1, 0)
      this.B = z1.Negate()
      this.C = new Complex(1, 0)
      this.D = z3.Negate()
    } else if (UtilsInfinity.IsInfiniteComplex(z3)) {
      this.A = new Complex(-1, 0)
      this.B = z1
      this.C = new Complex(0, 0)
      this.D = new Complex(1, 0).Multiply(z2.Subtract(z1)).Negate()
    } else {
      this.A = z2.Subtract(z3)
      this.B = z1.Multiply(z2.Subtract(z3)).Negate()
      this.C = z2.Subtract(z1)
      this.D = z3.Multiply(z2.Subtract(z1)).Negate()
    }

    this.Normalize()
  }

  // This transform will map the z points to the respective w points.

  MapPoints6d(
    z1: Complex,
    z2: Complex,
    z3: Complex,
    w1: Complex,
    w2: Complex,
    w3: Complex,
  ) {
    let m2: Mobius = Mobius.construct()
    let m1: Mobius = Mobius.construct()

    m1.MapPoints3d(z1, z2, z3)
    m2.MapPoints3d(w1, w2, w3)

    this.Merge(m2.Inverse().Multiply(m1))
  }

  // Applies a Mobius transformation to a vector.

  // <remarks>Use the complex number version if you can.</remarks>
  ApplyVector3D(z: Vector3D): Vector3D {
    let cInput: Complex = z.ToComplex()
    let cOutput: Complex = this.ApplyComplex(cInput)
    return Vector3D.FromComplex(cOutput)
  }

  // Applies a Mobius transformation to a complex number.

  ApplyComplex(z: Complex): Complex {
    return this.A.Multiply(z)
      .Add(this.B)
      .Divide(this.C.Multiply(z).Add(this.D))
  }

  ApplyInfiniteSafe(z: Vector3D): Vector3D {
    if (UtilsInfinity.IsInfiniteVector3D(z)) {
      return this.ApplyToInfinite()
    }

    let result: Vector3D = this.ApplyVector3D(z)
    if (UtilsInfinity.IsInfiniteVector3D(result)) {
      return UtilsInfinity.InfinityVector
    }

    return result
  }

  // Applies a Mobius transformation to the point at infinity.

  ApplyToInfinite(): Vector3D {
    return Vector3D.FromComplex(this.A.Divide(this.C))
  }

  // Applies a Mobius transformation to a quaternion with a zero k component (handled as a vector).
  // The complex Mobius coefficients are treated as quaternions with zero j,k values.
  // This is also infinity safe.

  ApplyToQuaternion(q: Vector3D): Vector3D {
    if (UtilsInfinity.IsInfiniteVector3D(q)) {
      return this.ApplyToInfinite()
    }

    //  Is this ok?
    let a: Vector3D = Vector3D.FromComplex(this.A)
    let b: Vector3D = Vector3D.FromComplex(this.B)
    let c: Vector3D = Vector3D.FromComplex(this.C)
    let d: Vector3D = Vector3D.FromComplex(this.D)
    return this.DivideQuaternion(
      this.MultiplyQuaternion(a, q).Add(b),
      this.MultiplyQuaternion(c, q).Add(d),
    )
  }

  MultiplyQuaternion(a: Vector3D, b: Vector3D): Vector3D {
    return Vector3D.construct4d(
      a.X * b.X - (a.Y * b.Y - (a.Z * b.Z - a.W * b.W)),
      a.X * b.Y + (a.Y * b.X + (a.Z * b.W - a.W * b.Z)),
      a.X * b.Z - a.Y * b.W + (a.Z * b.X + a.W * b.Y),
      a.X * b.W + (a.Y * b.Z - a.Z * b.Y + a.W * b.X),
    )
  }

  DivideQuaternion(a: Vector3D, b: Vector3D): Vector3D {
    let magSquared: number = b.MagSquared()
    let bInv: Vector3D = Vector3D.construct4d(
      b.X / magSquared,
      (b.Y / magSquared) * -1,
      (b.Z / magSquared) * -1,
      (b.W / magSquared) * -1,
    )
    return this.MultiplyQuaternion(a, bInv)
  }

  // Returns a new Mobius transformation that is the inverse of us.

  Inverse(): Mobius {
    //  See http://en.wikipedia.org/wiki/M�bius_transformation
    let result: Mobius = Mobius.construct4d(
      this.D,
      this.B.Negate(),
      this.C.Negate(),
      this.A,
    )
    result.Normalize()
    return result
  }

  static Identity(): Mobius {
    let m: Mobius = Mobius.construct()
    m.Unity()
    return m
  }

  static Scale(scale: number): Mobius {
    return Mobius.construct4d(
      new Complex(scale, 0),
      Complex.Zero,
      Complex.Zero,
      Complex.One,
    )
  }

  // This is only here for a numerical accuracy hack.
  // Please don't make a habit of using!

  Round(digits: number) {
    let d: number = digits
    this.A = new Complex(
      Utils.Round(this.A.Real, d),
      Utils.Round(this.A.Imaginary, d),
    )
    this.B = new Complex(
      Utils.Round(this.B.Real, d),
      Utils.Round(this.B.Imaginary, d),
    )
    this.C = new Complex(
      Utils.Round(this.C.Real, d),
      Utils.Round(this.C.Imaginary, d),
    )
    this.D = new Complex(
      Utils.Round(this.D.Real, d),
      Utils.Round(this.D.Imaginary, d),
    )
  }
}
