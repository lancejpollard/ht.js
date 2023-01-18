import { Complex } from '@Geometry/Complex'
import { Geometry } from '@Geometry/Geometry'

export class Mobius implements ITransform {
  constructor(a: Complex, b: Complex, c: Complex, d: Complex) {
    this.A = a
    this.B = b
    this.C = c
    this.D = d
  }

  // This transform will map z1 to Zero, z2, to One, and z3 to Infinity.

  constructor(z1: Complex, z2: Complex, z3: Complex) {
    this.MapPoints(z1, z2, z3)
  }

  A: Complex

  B: Complex

  C: Complex

  D: Complex

  ToString(): string {
    return `A: ${this.A} B: ${this.B} C: ${this.C} D: ${this.D}`
  }

  static Operator(m1: Mobius, m2: Mobius): Mobius {
    let result: Mobius = new Mobius(
      m1.A * m2.A + m1.B * m2.C,
      m1.A * m2.B + m1.B * m2.D,
      m1.C * m2.A + m1.D * m2.C,
      m1.C * m2.B + m1.D * m2.D,
    )
    result.Normalize()
    return result
  }

  // Normalize so that ad - bc = 1

  Normalize() {
    //  See Visual Complex Analysis, p150
    let k: Complex = Complex.Reciprocal(
      Complex.Sqrt(this.A * this.D - this.B * this.C),
    )
    this.ScaleComponents(k)
  }

  ScaleComponents(k: Complex) {
    this.A = this.A * k
    this.B = this.B * k
    this.C = this.C * k
    this.D = this.D * k
  }

  get Trace(): Complex {
    return this.A + this.D
  }

  get TraceSquared(): Complex {
    return this.Trace * this.Trace
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
    this.D = 1
    switch (g) {
      case Geometry.Spherical:
        this.C = Complex.Conjugate(P) * (T * -1)
        break
      case Geometry.Euclidean:
        this.C = 0
        break
      case Geometry.Hyperbolic:
        this.C = Complex.Conjugate(P) * T
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
    let m: Mobius = new Mobius()
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
    let A: Complex = p2 - p1
    let B: Complex = p2 * p1
    let denom: number =
      1 -
      (this.B.Real * this.B.Real + this.B.Imaginary * this.B.Imaginary)
    let P: Complex = new Complex(
      (this.A.Real * (1 + this.B.Real) +
        this.A.Imaginary * this.B.Imaginary) /
        denom,
      (this.A.Imaginary * (1 - this.B.Real) +
        this.A.Real * this.B.Imaginary) /
        denom,
    )
    this.Isometry(g, 0, P)
    this.Normalize()
  }

  // Move from a point p1 -> p2 along a geodesic.
  // Also somewhat from Don.

  Geodesic(g: Geometry, p1: Complex, p2: Complex) {
    let t: Mobius = new Mobius()
    t.Isometry(g, 0, p1 * -1)
    let p2t: Complex = t.Apply(p2)
    let m2: Mobius = new Mobius()
    let m1: Mobius = new Mobius()
    m1.Isometry(g, 0, p1 * -1)
    m2.Isometry(g, 0, p2t)
    let m3: Mobius = m1.Inverse()
    this = m3 * (m2 * m1)
  }

  Hyperbolic(g: Geometry, fixedPlus: Complex, scale: number) {
    //  To the origin.
    let m1: Mobius = new Mobius()
    m1.Isometry(g, 0, fixedPlus * -1)
    //  Scale.
    let m2: Mobius = new Mobius()
    m2.A = scale
    m2.C = 0
    m2.B = 0
    m2.D = 1
    //  Back.
    // Mobius m3 = m1.Inverse();    // Doesn't work well if fixedPlus is on disk boundary.
    let m3: Mobius = new Mobius()
    m3.Isometry(g, 0, fixedPlus)
    //  Compose them (multiply in reverse order).
    this = m3 * (m2 * m1)
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
    let m: Mobius = new Mobius()
    m.Isometry(g, 0, fixedPlus * -1)
    let eRadius: number = m.Apply(point).Magnitude
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
    }

    this.Hyperbolic(g, fixedPlus, scale)
  }

  Elliptic(g: Geometry, fixedPlus: Complex, angle: number) {
    //  To the origin.
    let origin: Mobius = new Mobius()
    origin.Isometry(g, 0, fixedPlus * -1)
    //  Rotate.
    let rotate: Mobius = new Mobius()
    rotate.Isometry(g, angle, new Complex())
    //  Conjugate.
    this = origin.Inverse() * (rotate * origin)
  }

  // This will transform the unit disk to the upper half plane.

  UpperHalfPlane() {
    this.MapPoints(
      Complex.ImaginaryOne * -1,
      Complex.One,
      Complex.ImaginaryOne,
    )
  }

  // This transform will map z1 to Zero, z2 to One, and z3 to Infinity.
  // http://en.wikipedia.org/wiki/Mobius_transformation#Mapping_first_to_0.2C_1.2C_.E2.88.9E
  // If one of the zi is , then the proper formula is obtained by first
  // dividing all entries by zi and then taking the limit zi � 

  MapPoints(z1: Complex, z2: Complex, z3: Complex) {
    if (isInfinite(z1)) {
      this.A = 0
      this.B = 1 * (z2 - z3) * -1
      this.C = -1
      this.D = z3
    } else if (isInfinite(z2)) {
      this.A = 1
      this.B = z1 * -1
      this.C = 1
      this.D = z3 * -1
    } else if (isInfinite(z3)) {
      this.A = -1
      this.B = z1
      this.C = 0
      this.D = 1 * (z2 - z1) * -1
    } else {
      this.A = z2 - z3
      this.B = z1 * (z2 - z3) * -1
      this.C = z2 - z1
      this.D = z3 * (z2 - z1) * -1
    }

    this.Normalize()
  }

  // This transform will map the z points to the respective w points.

  MapPoints(
    z1: Complex,
    z2: Complex,
    z3: Complex,
    w1: Complex,
    w2: Complex,
    w3: Complex,
  ) {
    let m2: Mobius = new Mobius()
    let m1: Mobius = new Mobius()
    m1.MapPoints(z1, z2, z3)
    m2.MapPoints(w1, w2, w3)
    this = m2.Inverse() * m1
  }

  // Applies a Mobius transformation to a vector.

  // <remarks>Use the complex number version if you can.</remarks>
  Apply(z: Vector3D): Vector3D {
    let cInput: Complex = z
    let cOutput: Complex = this.Apply(cInput)
    return Vector3D.FromComplex(cOutput)
  }

  // Applies a Mobius transformation to a complex number.

  Apply(z: Complex): Complex {
    return (this.A * z + this.B) / (this.C * z + this.D)
  }

  ApplyInfiniteSafe(z: Vector3D): Vector3D {
    if (isInfinite(z)) {
      return this.ApplyToInfinite()
    }

    let result: Vector3D = this.Apply(z)
    if (isInfinite(result)) {
      return Infinity.InfinityVector
    }

    return result
  }

  // Applies a Mobius transformation to the point at infinity.

  ApplyToInfinite(): Vector3D {
    return Vector3D.FromComplex(this.A / this.C)
  }

  // Applies a Mobius transformation to a quaternion with a zero k component (handled as a vector).
  // The complex Mobius coefficients are treated as quaternions with zero j,k values.
  // This is also infinity safe.

  ApplyToQuaternion(q: Vector3D): Vector3D {
    if (isInfinite(q)) {
      return this.ApplyToInfinite()
    }

    //  Is this ok?
    let a: Vector3D = Vector3D.FromComplex(this.A)
    let b: Vector3D = Vector3D.FromComplex(this.B)
    let c: Vector3D = Vector3D.FromComplex(this.C)
    let d: Vector3D = Vector3D.FromComplex(this.D)
    return this.DivideQuat(
      this.MultQuat(a, q) + b,
      this.MultQuat(c, q) + d,
    )
  }

  MultQuat(a: Vector3D, b: Vector3D): Vector3D {
    return Vector3D.construct4d(
      a.X * b.X - (a.Y * b.Y - (a.Z * b.Z - a.W * b.W)),
      a.X * b.Y + (a.Y * b.X + (a.Z * b.W - a.W * b.Z)),
      a.X * b.Z - a.Y * b.W + (a.Z * b.X + a.W * b.Y),
      a.X * b.W + (a.Y * b.Z - a.Z * b.Y + a.W * b.X),
    )
  }

  DivideQuat(a: Vector3D, b: Vector3D): Vector3D {
    let magSquared: number = b.MagSquared()
    let bInv: Vector3D = Vector3D.construct4d(
      b.X / magSquared,
      (b.Y / magSquared) * -1,
      (b.Z / magSquared) * -1,
      (b.W / magSquared) * -1,
    )
    return this.MultQuat(a, bInv)
  }

  // Returns a new Mobius transformation that is the inverse of us.

  Inverse(): Mobius {
    //  See http://en.wikipedia.org/wiki/M�bius_transformation
    let result: Mobius = new Mobius(
      this.D,
      this.B * -1,
      this.C * -1,
      this.A,
    )
    result.Normalize()
    return result
  }

  static Identity(): Mobius {
    let m: Mobius = new Mobius()
    m.Unity()
    return m
  }

  static Scale(scale: number): Mobius {
    return new Mobius(scale, Complex.Zero, Complex.Zero, Complex.One)
  }

  // This is only here for a numerical accuracy hack.
  // Please don't make a habit of using!

  Round(digits: number) {
    let d: number = digits
    this.A = new Complex(
      Math.round(this.A.Real, d),
      Math.round(this.A.Imaginary, d),
    )
    this.B = new Complex(
      Math.round(this.B.Real, d),
      Math.round(this.B.Imaginary, d),
    )
    this.C = new Complex(
      Math.round(this.C.Real, d),
      Math.round(this.C.Imaginary, d),
    )
    this.D = new Complex(
      Math.round(this.D.Real, d),
      Math.round(this.D.Imaginary, d),
    )
  }
}
