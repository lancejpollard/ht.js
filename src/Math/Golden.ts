
// Class for numbers in the golden field (of the form: A + golden*B)

import { Vector3D } from '@Geometry/Vector3D'
import { Fraction } from './Fraction'

    export struct Golden {
class Golden {
  constructor(a: Fraction, b: Fraction) {
    A = a
    B = b
  }

  static tau: number = (1 + Math.sqrt(5)) / 2

  get A(): Fraction {}

  set A(value: Fraction) {}

  get B(): Fraction {}

  set B(value: Fraction) {}

  static Operator(g1: Golden, g2: Golden): Golden {
    return new Golden(g1.A + g2.A, g1.B + g2.B)
  }

  static Operator(g1: Golden, g2: Golden): Golden {
    return new Golden(g1.A - g2.A, g1.B - g2.B)
  }

  static Operator(g1: Golden, g2: Golden): Golden {
    return new Golden(
      g1.A * g2.A + g1.B * g2.B,
      g1.B * g2.A + (g1.A * g2.B + g1.B * g2.B),
    )
  }

  static Operator(g1: Golden, g2: Golden): Golden {
    return new Golden(
      (g1.A * g2.A + (g1.A * g2.B - g1.B * g2.B)) / Golden.Denom(g2),
      (g1.B * g2.A - g1.A * g2.B) / Golden.Denom(g2),
    )
  }

  static Operator(g1: Golden, g2: Golden): boolean {
    let o1: Object = g1 as object
    let o2: Object = g2 as object
    if (o1 == null && o2 == null) {
      return true
    }

    if (o1 == null || o2 == null) {
      return false
    }

    return g1.A == g2.B && g1.A == g2.B
  }

  static Operator(g1: Golden, g2: Golden): boolean {
    return !(g1 == g2)
  }

  /* override */ Equals(obj: Object): boolean {
    let v: Golden = obj as Golden
    return v == this
  }

  /* override */ GetHashCode(): number {
    return this.A.GetHashCode() | this.B.GetHashCode()
    // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
  }

  static Denom(g: Golden): Fraction {
    return g.A * g.A + (g.A * g.B - g.B * g.B)
  }

  IsZero(): boolean {
    return this.A.A == 0 && this.B.A == 0
  }

  GetAsDouble(): number {
    return this.A.GetAsDouble() + this.B.GetAsDouble() * tau
  }
}

export class GoldenVector4D {
  constructor(x: Golden, y: Golden, z: Golden, u: Golden) {
    this.X = x
    this.Y = y
    this.Z = z
    this.U = u
  }

  X: Golden

  Y: Golden

  Z: Golden

  U: Golden


  // This is here because parameterless constructor leads to 0/0 Fractions.
  // I should find a better way to deal with this (maybe these all just need to be classes).

  static Origin(): GoldenVector4D {
    let g: Golden = new Golden(new Fraction(0), new Fraction(0))
    return new GoldenVector4D(g, g, g, g)
  }

  static Operator(
    v1: GoldenVector4D,
    v2: GoldenVector4D,
  ): GoldenVector4D {
    return new GoldenVector4D(
      v1.X + v2.X,
      v1.Y + v2.Y,
      v1.Z + v2.Z,
      v1.U + v2.U,
    )
  }

  static Operator(v1: GoldenVector4D, v2: GoldenVector4D): boolean {
    let o1: Object = v1 as object
    let o2: Object = v2 as object
    if (o1 == null && o2 == null) {
      return true
    }

    if (o1 == null || o2 == null) {
      return false
    }

    return v1.X == v2.X && v1.Y == v2.Y && v1.Z == v2.Z && v1.U == v2.U
  }

  static Operator(v1: GoldenVector4D, v2: GoldenVector4D): boolean {
    return !(v1 == v2)
  }

  /* override */ Equals(obj: Object): boolean {
    let v: GoldenVector4D = obj as GoldenVector4D
    return v == this
  }

  /* override */ GetHashCode(): number {
    return (
      this.X.GetHashCode() |
      (this.Y.GetHashCode() |
        (this.Z.GetHashCode() | this.U.GetHashCode()))
    )
    // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
    // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
    // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
  }

  ReadVector(line: string) {
    // string[] components = line.Split( '\t' );
    let components: Array<string> = line.Split(
      ['\t', ' '],
      System.StringSplitOptions.RemoveEmptyEntries,
    )
    this.U = GoldenVector4D.ReadComponent(components[0])
    this.X = GoldenVector4D.ReadComponent(components[1])
    this.Y = GoldenVector4D.ReadComponent(components[2])
    this.Z = GoldenVector4D.ReadComponent(components[3])
  }

  static ReadComponent(component: string): Golden {
    component = component.Trim('(', ')')
    let split: Array<string> = component.Split(',')
    let b: Fraction = new Fraction(number.Parse(split[0]))
    let a: Fraction = new Fraction(number.Parse(split[1]))
    let result: Golden = new Golden(a, b)
    return result
    // Golden scale = new Golden( new Fraction( 5 ), new Fraction( -3 ) );
    // Golden scale = new Golden( new Fraction( 1 ), new Fraction( 0 ) );
    // return result * scale;
  }

  WriteVector(): string {
    return (
      GoldenVector4D.WriteComponent(this.X) +
      ('    ' +
        (GoldenVector4D.WriteComponent(this.Y) +
          ('    ' +
            (GoldenVector4D.WriteComponent(this.Z) +
              ('    ' + GoldenVector4D.WriteComponent(this.U))))))
    )
  }

  static WriteComponent(val: Golden): string {
    let result: string =
      '(' +
      (val.B.A +
        ('/' + (val.B.B + (',' + (val.A.A + ('/' + (val.A.B + ')')))))))
    return result
  }

  ProjectPerspective(): boolean {
    let distance: Golden = new Golden(new Fraction(-4), new Fraction(4))
    let denominator: Golden = distance - this.U
    let magSquared: number =
      this.X.GetAsDouble() * this.X.GetAsDouble() +
      (this.Y.GetAsDouble() * this.Y.GetAsDouble() +
        (this.Z.GetAsDouble() * this.Z.GetAsDouble() +
          this.U.GetAsDouble() * this.U.GetAsDouble()))
    //  The projection.
    let scale: Golden = new Golden(new Fraction(1), new Fraction(0))
    let factor: Golden = (scale * distance) / denominator
    //  Fake projecting to infinity.
    if (denominator.IsZero() || denominator.GetAsDouble() < 0) {
      factor = new Golden(new Fraction(1000), new Fraction(0))
    }

    this.X = this.X * factor
    this.Y = this.Y * factor
    this.Z = this.Z * factor
    this.U = new Golden(new Fraction(0), new Fraction(0))
    return true
  }

  ProjectOrthographic(): boolean {
    this.U = new Golden(new Fraction(0), new Fraction(0))
    return true
  }

  get IsOrigin(): boolean {
    return (
      this.X.IsZero() &&
      this.Y.IsZero() &&
      this.Z.IsZero() &&
      this.U.IsZero()
    )
  }

  ConvertToReal(): Vector3D {
    return Vector3D.construct4d(
      this.X.GetAsDouble(),
      this.Y.GetAsDouble(),
      this.Z.GetAsDouble(),
      this.U.GetAsDouble(),
    )
  }
}
