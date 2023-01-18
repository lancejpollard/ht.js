// complex number, ported from CSharp
// https://learn.microsoft.com/en-us/dotnet/api/system.numerics.complex?view=net-7.0
export class Complex {
  Real: number

  Imaginary: number

  // Magnitude: number
  // Phase: number

  constructor(Real: number, Imaginary: number) {
    this.Real = Real
    this.Imaginary = Imaginary
  }
}
