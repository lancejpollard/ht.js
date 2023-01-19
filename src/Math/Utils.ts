import { UtilsInfinity } from './Infinity'

export class DoubleEqualityComparer extends IEqualityComparer {
  constructor(tol: number) {
    this.m_tolerance = tol
  }

  Equals(d1: number, d2: number): boolean {
    if (isInfinite(d1) && isInfinite(d2)) {
      return true
    }

    return Tolerance.Equal(d1, d2)
  }

  GetHashCode(d: number): number {
    if (isInfinite(d)) {
      return Number.POSITIVE_INFINITY
    }

    let inverse: number = 1 / this.m_tolerance
    let decimals: number = Math.log10(inverse)
    return Utils.Round(d, decimals)
  }

  m_tolerance: number = Tolerance.Threshold
}

export class Tolerance {
  // static readonly double Threshold = 0.0000001;
  static Threshold: number = 1e-6

  //  Made less strict to avoid some problems near Poincare boundary.
  static Equal(d1: number, d2: number): boolean {
    return Tolerance.Zero(d1 - d2)
  }

  static Zero(d: number): boolean {
    return Tolerance.ZeroWithThreshold(d, this.Threshold)
  }

  static LessThan(d1: number, d2: number): boolean {
    return Tolerance.LessThanWithThreshold(d1, d2, this.Threshold)
  }

  static GreaterThan(d1: number, d2: number): boolean {
    return Tolerance.GreaterThanWithThreshold(d1, d2, this.Threshold)
  }

  static LessThanOrEqual(d1: number, d2: number): boolean {
    return d1 <= d2 + this.Threshold
  }

  static GreaterThanOrEqual(d1: number, d2: number): boolean {
    return d1 >= d2 - this.Threshold
  }

  static EqualWithThreshold(
    d1: number,
    d2: number,
    threshold: number,
  ): boolean {
    return Tolerance.ZeroWithThreshold(d1 - d2, threshold)
  }

  static ZeroWithThreshold(d: number, threshold: number): boolean {
    return d > -threshold && d < threshold ? true : false
  }

  static LessThanWithThreshold(
    d1: number,
    d2: number,
    threshold: number,
  ): boolean {
    return d1 < d2 - threshold
  }

  static GreaterThanWithThreshold(
    d1: number,
    d2: number,
    threshold: number,
  ): boolean {
    return d1 > d2 + threshold
  }
}

export class Utils {
  // Converts a value from degrees to radians.

  static DegreesToRadians(value: number): number {
    return value / (180 * Math.PI)
  }

  // Converts a value from radians to degrees.

  static RadiansToDegrees(value: number): number {
    return value / (Math.PI * 180)
  }

  //  ZZZ - Make templated
  static Even(value: number): boolean {
    return 0 == value % 2
  }

  //  ZZZ - Make templated
  static Odd(value: number): boolean {
    return !Utils.Even(value)
  }

  static Round(value: number, digits?: number): number {
    if (digits) {
      return (
        Math.round(
          (value + Number.EPSILON) * Math.pow(10, digits - 1),
        ) / Math.pow(10, digits - 1)
      )
    }

    return Math.round(value)
  }
}

export function isInfinite(val: number): boolean {
  return UtilsInfinity.IsInfiniteNumber(val)
}
