// complex number, ported from CSharp
// https://github.com/microsoft/referencesource/blob/dae14279dd0672adead5de00ac8f117dcf74c184/System.Numerics/System/Numerics/Complex.cs
// https://learn.microsoft.com/en-us/dotnet/api/system.numerics.complex?view=net-7.0

import { isInfinite } from '@Math/Utils'
import { IEquatable } from './IEquitable'
import { IFormattable } from './IFormattable'

export class Complex implements IEquatable<Complex>, IFormattable {
  //  --------------SECTION: Private Data members ----------- //
  m_real: number

  m_imaginary: number

  //  ---------------SECTION: Necessary Constants ----------- //
  static /* const */ LOG_10_INV: number = 0.43429448190325

  //  --------------SECTION: Public Properties -------------- //
  get Real(): number {
    return this.m_real
  }

  get Imaginary(): number {
    return this.m_imaginary
  }

  get Magnitude(): number {
    return Complex.Abs(this)
  }

  get Phase(): number {
    return Math.atan2(this.m_imaginary, this.m_real)
  }

  //  --------------SECTION: Attributes -------------- //
  static Zero: Complex = new Complex(0, 0)

  static One: Complex = new Complex(1, 0)

  static ImaginaryOne: Complex = new Complex(0, 1)

  constructor(real: number, imaginary: number) {
    this.m_real = real
    this.m_imaginary = imaginary
  }

  static FromPolarCoordinates(
    magnitude: number,
    phase: number,
  ): Complex {
    return new Complex(
      magnitude * Math.cos(phase),
      magnitude * Math.sin(phase),
    )
  }

  Negate(): Complex {
    return Complex.Negate(this)
  }

  Add(right: Complex): Complex {
    return Complex.Add(this, right)
  }

  Subtract(right: Complex): Complex {
    return Complex.Subtract(this, right)
  }

  Multiply(right: Complex): Complex {
    return Complex.Multiply(this, right)
  }

  Divide(divisor: Complex): Complex {
    return Complex.Divide(this, divisor)
  }

  //  --------------SECTION: Arithmetic Operator(unary) Overloading -------------- //
  static Negate(value: Complex): Complex {
    return new Complex(value.m_real * -1, value.m_imaginary * -1)
  }

  //  --------------SECTION: Arithmetic Operator(binary) Overloading -------------- //
  static Add(left: Complex, right: Complex): Complex {
    return new Complex(
      left.m_real + right.m_real,
      left.m_imaginary + right.m_imaginary,
    )
  }

  static Subtract(left: Complex, right: Complex): Complex {
    return new Complex(
      left.m_real - right.m_real,
      left.m_imaginary - right.m_imaginary,
    )
  }

  static Multiply(left: Complex, right: Complex): Complex {
    //  Multiplication:  (a + bi)(c + di) = (ac -bd) + (bc + ad)i
    let result_Realpart: number =
      left.m_real * right.m_real - left.m_imaginary * right.m_imaginary
    let result_Imaginarypart: number =
      left.m_imaginary * right.m_real + left.m_real * right.m_imaginary
    return new Complex(result_Realpart, result_Imaginarypart)
  }

  static Divide(left: Complex, right: Complex): Complex {
    //  Division : Smith's formula.
    let a: number = left.m_real
    let b: number = left.m_imaginary
    let c: number = right.m_real
    let d: number = right.m_imaginary
    if (Math.abs(d) < Math.abs(c)) {
      let doc: number = d / c
      return new Complex(
        (a + b * doc) / (c + d * doc),
        (b - a * doc) / (c + d * doc),
      )
    } else {
      let cod: number = c / d
      return new Complex(
        (b + a * cod) / (d + c * cod),
        (a * -1 + b * cod) / (d + c * cod),
      )
    }
  }

  //  --------------SECTION: Other arithmetic operations  -------------- //
  static Abs(value: Complex): number {
    if (isInfinite(value.m_real) || isInfinite(value.m_imaginary)) {
      return Number.POSITIVE_INFINITY
    }

    //  |value| == sqrt(a^2 + b^2)
    //  sqrt(a^2 + b^2) == a/a * sqrt(a^2 + b^2) = a * sqrt(a^2/a^2 + b^2/a^2)
    //  Using the above we can factor out the square of the larger component to dodge overflow.
    let c: number = Math.abs(value.m_real)
    let d: number = Math.abs(value.m_imaginary)
    if (c > d) {
      let r: number = d / c
      return c * Math.sqrt(1 + r * r)
    } else if (d == 0) {
      return c
      //  c is either 0.0 or NaN
    } else {
      let r: number = c / d
      return d * Math.sqrt(1 + r * r)
    }
  }

  static Conjugate(value: Complex): Complex {
    //  Conjugate of a Complex number: the conjugate of x+i*y is x-i*y
    return new Complex(value.m_real, value.m_imaginary * -1)
  }

  static Reciprocal(value: Complex): Complex {
    //  Reciprocal of a Complex number : the reciprocal of x+i*y is 1/(x+i*y)
    if (value.m_real == 0 && value.m_imaginary == 0) {
      return Complex.Zero
    }

    return Complex.One.Divide(value)
  }

  //  --------------SECTION: Comparison Operator(binary) Overloading -------------- //
  static equals(left: Complex, right: Complex): boolean {
    return (
      left.m_real == right.m_real &&
      left.m_imaginary == right.m_imaginary
    )
  }

  static notEquals(left: Complex, right: Complex): boolean {
    return (
      left.m_real != right.m_real ||
      left.m_imaginary != right.m_imaginary
    )
  }

  //  --------------SECTION: Comparison operations (methods implementing IEquatable<ComplexNumber>,IComparable<ComplexNumber>) -------------- //
  /* override */ EqualsObject(obj: Object): boolean {
    if (!(obj instanceof Complex)) {
      return false
    }

    return this == (obj as Complex)
  }

  Equals(value: Complex): boolean {
    return (
      this.m_real == value.m_real &&
      this.m_imaginary == value.m_imaginary
    )
  }

  /* override */ GetHashCode(): number {
    let n1: number = 99999997
    let hash_real: number = this.m_real % n1
    let hash_imaginary: number = this.m_imaginary
    let final_hashcode: number = hash_real ^ hash_imaginary
    // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
    return final_hashcode
  }

  //  --------------SECTION: Trigonometric operations (methods implementing ITrigonometric)  -------------- //
  static Sin(value: Complex): Complex {
    let a: number = value.m_real
    let b: number = value.m_imaginary
    return new Complex(
      Math.sin(a) * Math.cosh(b),
      Math.cos(a) * Math.sinh(b),
    )
  }

  static Sinh(value: Complex): Complex {
    let a: number = value.m_real
    let b: number = value.m_imaginary
    return new Complex(
      Math.sinh(a) * Math.cos(b),
      Math.cosh(a) * Math.sin(b),
    )
  }

  static Asin(value: Complex): Complex {
    return this.Negate(this.ImaginaryOne).Multiply(
      Complex.Log(
        this.ImaginaryOne.Multiply(value).Add(
          Complex.Sqrt(this.One.Subtract(value.Multiply(value))),
        ),
      ),
    )
  }

  static Cos(value: Complex): Complex {
    let a: number = value.m_real
    let b: number = value.m_imaginary
    return new Complex(
      Math.cos(a) * Math.cosh(b),
      Math.sin(a) * Math.sinh(b) * -1,
    )
  }

  static Cosh(value: Complex): Complex {
    let a: number = value.m_real
    let b: number = value.m_imaginary
    return new Complex(
      Math.cosh(a) * Math.cos(b),
      Math.sinh(a) * Math.sin(b),
    )
  }

  static Acos(value: Complex): Complex {
    return Complex.ImaginaryOne.Negate().Multiply(
      Complex.Log(
        value.Add(
          Complex.ImaginaryOne.Multiply(
            Complex.Sqrt(Complex.One.Subtract(value.Multiply(value))),
          ),
        ),
      ),
    )
  }

  static Tan(value: Complex): Complex {
    return Complex.Sin(value).Divide(Complex.Cos(value))
  }

  static Tanh(value: Complex): Complex {
    return Complex.Sinh(value).Divide(Complex.Cosh(value))
  }

  static Atan(value: Complex): Complex {
    let Two: Complex = new Complex(2, 0)
    return this.ImaginaryOne.Divide(Two).Multiply(
      Complex.Log(
        this.One.Subtract(this.ImaginaryOne.Multiply(value)),
      ).Subtract(
        Complex.Log(this.One.Add(this.ImaginaryOne.Multiply(value))),
      ),
    )
  }

  //  --------------SECTION: Other numerical functions  -------------- //
  static Log(value: Complex): Complex {
    return new Complex(
      Math.log(Complex.Abs(value)),
      Math.atan2(value.m_imaginary, value.m_real),
    )
  }

  static LogWithBase(value: Complex, baseValue: number): Complex {
    return Complex.Log(value).Divide(
      Complex.Log(new Complex(baseValue, 0)),
    )
  }

  static Log10(value: Complex): Complex {
    let temp_log: Complex = Complex.Log(value)
    return Complex.Scale(temp_log, Complex.LOG_10_INV)
  }

  static Exp(value: Complex): Complex {
    let temp_factor: number = Math.exp(value.m_real)
    let result_re: number = temp_factor * Math.cos(value.m_imaginary)
    let result_im: number = temp_factor * Math.sin(value.m_imaginary)
    return new Complex(result_re, result_im)
  }

  static Sqrt(value: Complex): Complex {
    return Complex.FromPolarCoordinates(
      Math.sqrt(value.Magnitude),
      value.Phase / 2,
    )
  }

  static PowComplex(value: Complex, power: Complex): Complex {
    if (power == Complex.Zero) {
      return Complex.One
    }

    if (value == Complex.Zero) {
      return Complex.Zero
    }

    let a: number = value.m_real
    let b: number = value.m_imaginary
    let c: number = power.m_real
    let d: number = power.m_imaginary
    let rho: number = Complex.Abs(value)
    let theta: number = Math.atan2(b, a)
    let newRho: number = c * theta + d * Math.log(rho)
    let t: number = Math.pow(rho, c) * Math.pow(Math.E, d * theta * -1)
    return new Complex(t * Math.cos(newRho), t * Math.sin(newRho))
  }

  static Pow(value: Complex, power: number): Complex {
    return Complex.PowComplex(value, new Complex(power, 0))
  }

  // --------------- SECTION: Private member functions for internal use -----------------------------------//
  static Scale(value: Complex, factor: number): Complex {
    let result_re: number = factor * value.m_real
    let result_im: number = factor * value.m_imaginary
    return new Complex(result_re, result_im)
  }
}
