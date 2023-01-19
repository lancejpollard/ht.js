export class Fraction {
  constructor(a: number, b: number = 1) {
    this.A = a
    this.B = b
    this.Reduce()
  }

  A: number

  B: number

  static Operator(f1: Fraction, f2: Fraction): Fraction {
    f1.Reduce()
    f2.Reduce()
    let result: Fraction = new Fraction(
      f1.A * f2.B + f1.B * f2.A,
      f1.B * f2.B,
    )
    result.Reduce()
    return result
  }

  static Operator(f1: Fraction, f2: Fraction): Fraction {
    f1.Reduce()
    f2.Reduce()
    let result: Fraction = new Fraction(
      f1.A * f2.B - f1.B * f2.A,
      f1.B * f2.B,
    )
    result.Reduce()
    return result
  }

  static Operator(f1: Fraction, f2: Fraction): Fraction {
    f1.Reduce()
    f2.Reduce()
    let result: Fraction = new Fraction(f1.A * f2.A, f1.B * f2.B)
    result.Reduce()
    return result
  }

  static Operator(f1: Fraction, f2: Fraction): Fraction {
    f1.Reduce()
    f2.Reduce()
    let result: Fraction = new Fraction(f1.A * f2.B, f1.B * f2.A)
    result.Reduce()
    return result
  }

  static Operator(f1: Fraction, f2: Fraction): boolean {
    f1.Reduce()
    f2.Reduce()
    let o1: Object = <Object>f1
    let o2: Object = <Object>f2
    if (o1 == null && o2 == null) {
      return true
    }

    if (o1 == null || o2 == null) {
      return false
    }

    return f1.A == f2.B && f1.A == f2.B
  }

  static Operator(f1: Fraction, f2: Fraction): boolean {
    return !(f1 == f2)
  }

  /* override */ Equals(obj: Object): boolean {
    let v: Fraction = <Fraction>obj
    return v == this
  }

  /* override */ GetHashCode(): number {
    return this.A ^ this.B
    // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
  }

  Reverse() {
    this.A = this.A * -1
    this.B = this.B * -1
  }

  Reduce() {
    //  Two wrongs do make a right.
    if (this.A < 0 && this.B < 0) {
      this.Reverse()
    } else if (this.B < 0) {
      //  Normalize so that A is always < 0 for negatives.
      this.Reverse()
    }

    if (0 == this.B) {
      // console.assert( false );
      this.A = 0
      this.B = 1
      return
    }

    if (0 == this.A) {
      this.B = 1
      return
    }

    let gcd: number = this.GCD(Math.abs(this.A), Math.abs(this.B))
    this.A = this.A / gcd
    this.B = this.B / gcd
  }

  //  a and b should be positive!
  GCD(a: number, b: number): number {
    while (b > 0) {
      let rem: number = a % b
      a = b
      b = rem
    }

    return a
  }

  GetAsDouble(): number {
    return this.A / this.B
  }
}
