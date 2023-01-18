import { Tolerance } from '@Math/Utils'
import { Complex } from './Complex'

export class Vector3D {
  constructor(x: number, y: number, z: number, w: number) {
    this.X = x
    this.Y = y
    this.Z = z
    this.W = w
  }

  static construct4d(x: number, y: number, z: number, w: number) {
    const self = new Vector3D(x, y, z, w)
    return self
  }

  static constructFrom4dArray (vals: number[]) {
    const self = new Vector3D(
      vals[0],
      vals[1],
      vals[2],
      vals[3],
    )
    return self
  }

  static construct3d (x: number, y: number, z: number) {
    const self = new Vector3D(
      x,
      y,
      z,
      0,
    )
    return self
  }

  static construct2d (x: number, y: number) {
    const self = new Vector3D(
      x,
      y,
      0,
      0,
    )
    return self
  }

  static construct () {
    const self = new Vector3D(
      0,
      0,
      0,
      0,
    )
    return self
  }

  X: number

  Y: number

  Z: number

  W: number

  /* override */ ToString(): string {
    return string.Format(
      '{0},{1},{2},{3}',
      this.X,
      this.Y,
      this.Z,
      this.W,
    )
  }

  Save(): string {
    return this.ToString()
  }

  ToStringXYZOnly(): string {
    return string.Format('{0},{1},{2}', this.X, this.Y, this.Z)
  }

  Load(s: string) {
    let split: Array<string> = s.Split(',')
    if (split.Length == 3 || split.Length == 4) {
      this.X = number.Parse(split[0], CultureInfo.InvariantCulture)
      this.Y = number.Parse(split[1], CultureInfo.InvariantCulture)
      this.Z = number.Parse(split[2], CultureInfo.InvariantCulture)
    }

    if (split.Length == 4) {
      this.W = number.Parse(split[3], CultureInfo.InvariantCulture)
    }
  }

  // Implicit vector to complex conversion operator.
  >
  static implicitOperator(v: Vector3D): Complex {
    return v.ToComplex()
  }

  static Operator(v1: Vector3D, v2: Vector3D): boolean {
    return v1.Compare(v2)
  }

  static Operator(v1: Vector3D, v2: Vector3D): boolean {
    return !(v1 == v2)
  }

  /* override */ Equals(obj: Object): boolean {
    let v: Vector3D = obj
    return v == this
  }

  /* override */ GetHashCode(): number {
    return this.GetHashCode(Tolerance.Threshold)
  }

  GetHashCode(tolerance: number): number {
    //  Normalize DNE vectors (since we consider any with any NaN component the same).
    if (this.DNE) {
      return number.GetHashCode()
    }

    //  The hash code is dependent on the tolerance: more precision -> less rounding.
    //  Rounding the hashcodes is necessary, since for a given tolerence we might
    //  consider two quantities to be equal, but their hashcodes might differ
    //  without the rounding.
    let inverse: number = 1 / tolerance
    let decimals: number = Math.log10(inverse)
    return (
      Math.round(this.X, decimals).GetHashCode() |
      (Math.round(this.Y, decimals).GetHashCode() |
        (Math.round(this.Z, decimals).GetHashCode() |
          Math.round(this.W, decimals).GetHashCode()))
    )
    // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
    // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
    // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
    //  if 0 tolerance
    // return X.GetHashCode() ^ Y.GetHashCode() ^ Z.GetHashCode();
  }

  Compare(other: Vector3D, threshold: number): boolean {
    //  NOTE: This is here because when the vector is infinite, it fails the tolerance checks below.
    if (
      this.X == other.X &&
      this.Y == other.Y &&
      this.Z == other.Z &&
      this.W == other.W
    ) {
      return true
    }

    if (this.DNE && other.DNE) {
      return true
    }

    if (this.DNE || other.DNE) {
      return false
    }

    return (
      Tolerance.Equal(this.X, other.X, threshold) &&
      Tolerance.Equal(this.Y, other.Y, threshold) &&
      Tolerance.Equal(this.Z, other.Z, threshold) &&
      Tolerance.Equal(this.W, other.W, threshold)
    )
  }

  Compare(other: Vector3D): boolean {
    return this.Compare(other, Tolerance.Threshold)
  }

  static Operator(v: Vector3D, s: number): Vector3D {
    return Vector3D.construct4d(v.X * s, v.Y * s, v.Z * s, v.W * s)
  }

  static Operator(s: number, v: Vector3D): Vector3D {
    return v * s
  }

  static Operator(v: Vector3D, s: number): Vector3D {
    return Vector3D.construct4d(v.X / s, v.Y / s, v.Z / s, v.W / s)
  }

  Divide(s: number) {
    this.X /= s
    this.Y /= s
    this.Z /= s
    this.W /= s
  }

  static Operator(v1: Vector3D, v2: Vector3D): Vector3D {
    return Vector3D.construct4d(
      v1.X + v2.X,
      v1.Y + v2.Y,
      v1.Z + v2.Z,
      v1.W + v2.W,
    )
  }

  static Operator(v: Vector3D): Vector3D {
    return Vector3D.construct4d(v.X * -1, v.Y * -1, v.Z * -1, v.W * -1)
  }

  static Operator(v1: Vector3D, v2: Vector3D): Vector3D {
    return v1 + v2 * -1
  }

  Round(digits: number) {
    this.X = Math.round(this.X, digits)
    this.Y = Math.round(this.Y, digits)
    this.Z = Math.round(this.Z, digits)
    this.W = Math.round(this.W, digits)
  }

  get Item(i: number): number {
    switch (i) {
      case 0:
        return this.X
        break
      case 1:
        return this.Y
        break
      case 2:
        return this.Z
        break
      case 3:
        return this.W
        break
    }

    throw new Error('Argument Error')
  }

  set Item(value: number, i: number) {
    switch (i) {
      case 0:
        this.X = value
        break
      case 1:
        this.Y = value
        break
      case 2:
        this.Z = value
        break
      case 3:
        this.W = value
        break
    }
  }

  Valid(): boolean {
    //  ZZZ - This is what I did in MagicTile, but what about infinities?.
    //  ZZZ - Make a property
    return (
      !Number.isNaN(this.X) &&
      !Number.isNaN(this.Y) &&
      !Number.isNaN(this.Z) &&
      !Number.isNaN(this.W)
    )
  }

  get DNE(): boolean {
    return (
      Number.isNaN(this.X) ||
      Number.isNaN(this.Y) ||
      Number.isNaN(this.Z) ||
      Number.isNaN(this.W)
    )
  }

  static DneVector(): Vector3D {
    return Vector3D.construct4d(NaN, NaN, NaN, NaN)
  }

  Empty() {
    this.W = 0
    this.Z = 0
    this.Y = 0
    this.X = 0
  }

  Normalize(): boolean {
    let magnitude: number = this.Abs()
    if (Tolerance.Zero(magnitude, 1e-10)) {
      return false
    }

    this.Divide(magnitude)
    return true
  }


  // Normalize and scale.

  Normalize(scale: number): boolean {
    if (!this.Normalize()) {
      return false
    }

    this = this * scale
    return true
  }

  MagSquared(): number {
    return (
      this.X * this.X +
      (this.Y * this.Y + (this.Z * this.Z + this.W * this.W))
    )
  }

  Abs(): number {
    return Math.sqrt(this.MagSquared())
  }

  get IsOrigin(): boolean {
    return this == Vector3D.construct()
  }

  get IsZAxis(): boolean {
    let copy: Vector3D = this
    copy.Normalize()
    return Tolerance.Equal(1, Math.abs(copy.Z))
  }

  Dist(v: Vector3D): number {
    return (this - v).Abs()
  }

  Dot(v: Vector3D): number {
    return this.X * v.X + (this.Y * v.Y + (this.Z * v.Z + this.W * v.W))
  }


  // 3D cross product.
  // 4th component does not enter into calculations.

  Cross(v: Vector3D): Vector3D {
    let xVal: number = this.Y * v.Z - this.Z * v.Y
    let yVal: number = this.Z * v.X - this.X * v.Z
    let zVal: number = this.X * v.Y - this.Y * v.X
    return Vector3D.construct3d(xVal, yVal, zVal)
  }


  // Rotate CCW in the XY plane by an angle in radians.

  RotateXY(angle: number) {
    let component1: number = this.X
    let component2: number = this.Y
    this.X = Math.cos(angle) * component1 - Math.sin(angle) * component2
    this.Y = Math.sin(angle) * component1 + Math.cos(angle) * component2
  }


  // Rotate CCW in the XY plane about a center.  Angle is in radians.

  RotateXY(center: Vector3D, angle: number) {
    this = this - center
    this.RotateXY(angle)
    this = this + center
  }

  //  NOTE: angle should be in radians.
  RotateAboutAxis(axis: Vector3D, angle: number) {
    //  normalize the axis
    axis.Normalize()
    let _x: number = axis.X
    let _y: number = axis.Y
    let _z: number = axis.Z
    //  build the rotation matrix - I got this from http://www.makegames.com/3dRotation/
    let c: number = Math.cos(angle)
    let s: number = 1 * Math.sin(angle) * -1
    const t = 1 - c
    const mRot: Array<[number, number, number]> = [
      [t * _x * _x + c, t * _x * _y - s * _z, t * _x * _z + s * _y],
      [t * _x * _y + s * _z, t * _y * _y + c, t * _y * _z - s * _x],
      [t * _x * _z - s * _y, t * _y * _z + s * _x, t * _z * _z + c],
    ]

    let x: number = this.X
    let y: number = this.Y
    let z: number = this.Z
    //  do the multiplication
    this = Vector3D.construct3d(
      mRot[(0, 0)] * x + (mRot[(1, 0)] * y + mRot[(2, 0)] * z),
      mRot[(0, 1)] * x + (mRot[(1, 1)] * y + mRot[(2, 1)] * z),
      mRot[(0, 2)] * x + (mRot[(1, 2)] * y + mRot[(2, 2)] * z),
    )
  }


  // Unsigned (not handed) angle between 0 and pi.

  AngleTo(p2: Vector3D): number {
    let magmult: number = this.Abs() * p2.Abs()
    if (Tolerance.Zero(magmult)) {
      return 0
    }

    //  Make sure the val we take acos() of is in range.
    //  Floating point errors can make us slightly off and cause acos() to return bad values.
    let val: number = this.Dot(p2) / magmult
    if (val > 1) {
      console.assert(Tolerance.Zero(1 - val))
      val = 1
    }

    if (val < -1) {
      console.assert(Tolerance.Zero((1 - val) * -1))
      val = -1
    }

    return Math.acos(val)
  }


  // Finds a perpendicular vector (just one of many possible).
  // Result will be normalized.

  Perpendicular(): Vector3D {
    if (this.IsOrigin) {
      return Vector3D.construct()
    }

    let perp: Vector3D = this.Cross(Vector3D.construct3d(0, 0, 1))
    //  If we are a vector on the z-axis, the above will result in the zero vector.
    if (perp.IsOrigin) {
      perp = this.Cross(Vector3D.construct3d(1, 0, 0))
    }

    if (!perp.Normalize()) {
      throw new Error('Failed to find perpendicular.')
    }

    return perp
  }


  // 4D -> 3D projection.
  // The "safe" part is that we won't make any points invalid (only large).

  ProjectTo3DSafe(cameraDist: number): Vector3D {
    const minDenom: number = 0.0001
    //  The safe part.
    let denominator: number = cameraDist - this.W
    if (Tolerance.Zero(denominator)) {
      denominator = minDenom
    }

    if (denominator < 0) {
      denominator = minDenom
    }

    let result: Vector3D = Vector3D.construct4d(
      this.X * (cameraDist / denominator),
      this.Y * (cameraDist / denominator),
      this.Z * (cameraDist / denominator),
      0,
    )
    return result
  }


  // 3D -> 2D projection.

  CentralProject(cameraDist: number): Vector3D {
    let denominator: number = cameraDist - this.Z
    if (Tolerance.Zero(denominator)) {
      denominator = 0
    }

    //  Make points with a negative denominator invalid.
    if (denominator < 0) {
      denominator = 0
    }

    let result: Vector3D = Vector3D.construct3d(
      this.X * (cameraDist / denominator),
      this.Y * (cameraDist / denominator),
      0,
    )
    return result
  }

  ToComplex(): Complex {
    return new Complex(this.X, this.Y)
  }

  static FromComplex(value: Complex): Vector3D {
    return Vector3D.construct2d(value.Real, value.Imaginary)
  }
}


// For comparing vectors (for ordering, etc.)
// NOTE: I made the comparison tolerance safe.

export class Vector3DComparer extends IComparer {
  Compare(v1: Vector3D, v2: Vector3D): number {
    const less: number = -1
    const greater: number = 1
    if (Tolerance.LessThan(v1.X, v2.X)) {
      return less
    }

    if (Tolerance.GreaterThan(v1.X, v2.X)) {
      return greater
    }

    if (Tolerance.LessThan(v1.Y, v2.Y)) {
      return less
    }

    if (Tolerance.GreaterThan(v1.Y, v2.Y)) {
      return greater
    }

    if (Tolerance.LessThan(v1.Z, v2.Z)) {
      return less
    }

    if (Tolerance.GreaterThan(v1.Z, v2.Z)) {
      return greater
    }

    if (Tolerance.LessThan(v1.W, v2.W)) {
      return less
    }

    if (Tolerance.GreaterThan(v1.W, v2.W)) {
      return greater
    }

    //  Making it here means we are equal.
    return 0
  }
}
