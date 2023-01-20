//  This code from Don Hatch.
export class DonHatch {
  static expm1(x: number): number {
    let u: number = Math.exp(x)
    if (u == 1) {
      return x
    }

    if (u - 1 == -1) {
      return -1
    }

    return (u - 1) * (x / Math.log(u))
  }

  static log1p(x: number): number {
    let u: number = 1 + x
    return Math.log(u) - (u - 1 - x) / u
  }

  static tanh(x: number): number {
    let u: number = DonHatch.expm1(x)

    return (u / (u * (u + 2.0) + 2.0)) * (u + 2.0)
  }

  static atanh(x: number): number {
    return 0.5 * DonHatch.log1p((2.0 * x) / (1.0 - x))
  }

  static sinh(x: number): number {
    let u: number = DonHatch.expm1(x)
    return ((0.5 * u) / (u + 1)) * (u + 2)
  }

  static asinh(x: number): number {
    return DonHatch.log1p(x * (1 + x / (Math.sqrt(x * x + 1) + 1)))
  }

  static cosh(x: number): number {
    let e_x: number = Math.exp(x)
    return (e_x + 1.0 / e_x) * 0.5
  }

  static acosh(x: number): number {
    return (
      2 * Math.log(Math.sqrt((x + 1) * 0.5) + Math.sqrt((x - 1) * 0.5))
    )
  }

  //  hyperbolic to euclidean norm (distance from 0,0) in Poincare disk.
  static h2eNorm(hNorm: number): number {
    if (Number.isNaN(hNorm)) {
      return 1
    }

    return DonHatch.tanh(0.5 * hNorm)
  }

  static e2hNorm(eNorm: number): number {
    return 2 * DonHatch.atanh(eNorm)
  }
}
