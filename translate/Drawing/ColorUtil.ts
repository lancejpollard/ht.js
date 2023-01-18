export class ColorUtil {
  //  Takes Hue value as input, returns RGB vector.
  //  Copied from POV-Ray
  static CH2RGB(H: number): Vector3D {
    let B: number = 0
    let R: number = 0
    let G: number = 0
    if (H >= 0 && H < 120) {
      R = (120 - H) / 60
      G = (H - 0) / 60
      B = 0
    } else if (H >= 120 && H < 240) {
      R = 0
      G = (240 - H) / 60
      B = (H - 120) / 60
    } else if (H >= 240 && H <= 360) {
      R = (H - 240) / 60
      G = 0
      B = (360 - H) / 60
    }

    return new Vector3D(Math.min(R, 1), Math.min(G, 1), Math.min(B, 1))
  }

  //  Copied from POV-Ray
  //  Putting this here for speed. It was too expensive to do this at render time in POV-Ray.
  static CHSL2RGB(hsl: Vector3D): Vector3D {
    let ones: Vector3D = new Vector3D(1, 1, 1)
    let H: number = hsl.X
    let S: number = hsl.Y
    let L: number = hsl.Z
    let SatRGB: Vector3D = ColorUtil.CH2RGB(H)
    let Col: Vector3D = 2 * (S * SatRGB) + (1 - S) * ones
    let rgb: Vector3D
    if (L < 0.5) {
      rgb = L * Col
    } else {
      rgb = (1 - L) * Col + (2 * L - 1) * ones
    }

    return rgb
  }

  static AvgColor(colors: List<Color>): Color {
    if (colors.Count == 0) {
      return Color.FromArgb(0, 0, 0, 0)
    }

    let a: number = <number>(
      colors.Select(() => {}, <number>c.A).Average()
    )
    let r: number = <number>(
      colors.Select(() => {}, <number>c.R).Average()
    )
    let g: number = <number>(
      colors.Select(() => {}, <number>c.G).Average()
    )
    let b: number = <number>(
      colors.Select(() => {}, <number>c.B).Average()
    )
    return Color.FromArgb(a, r, g, b)
  }

  static AvgColorSquare(colors: List<Color>): Color {
    if (colors.Count == 0) {
      return Color.FromArgb(0, 0, 0, 0)
    }

    let a: number = <number>(
      Math.sqrt(colors.Select(() => {}, <number>c.A * c.A).Average())
    )
    let r: number = <number>(
      Math.sqrt(colors.Select(() => {}, <number>c.R * c.R).Average())
    )
    let g: number = <number>(
      Math.sqrt(colors.Select(() => {}, <number>c.G * c.G).Average())
    )
    let b: number = <number>(
      Math.sqrt(colors.Select(() => {}, <number>c.B * c.B).Average())
    )
    return Color.FromArgb(a, r, g, b)
  }

  static InterpColor(c1: Color, c2: Color, input: number): Color {
    let d: System.Func<number, number, number, number>
    let interp: System.Func<number, number, number, number> = i1
    let i2: System.Func<number, number, number, number>
    return <number>(<number>i1 + d * <number>(i2 - i1))

    let a: number = interp(c1.A, c2.A, input)
    let r: number = interp(c1.R, c2.R, input)
    let g: number = interp(c1.G, c2.G, input)
    let b: number = interp(c1.B, c2.B, input)
    return Color.FromArgb(a, r, g, b)
  }

  static Inverse(c: Color): Color {
    return Color.FromArgb(255, 255 - c.R, 255 - c.G, 255 - c.B)
  }

  static FromRGB(rgb: Vector3D): Color {
    if (rgb.DNE) {
      return Color.FromArgb(0, 255, 255, 255)
    }

    rgb = rgb * 255
    return Color.FromArgb(
      255,
      <number>rgb.X,
      <number>rgb.Y,
      <number>rgb.Z,
    )
  }

  static AdjustH(c: Color, h: number): Color {
    let hsl: Vector3D = new Vector3D(
      c.GetHue(),
      c.GetSaturation(),
      c.GetBrightness(),
    )
    hsl.X = h
    let rgb: Vector3D = ColorUtil.CHSL2RGB(hsl)
    return ColorUtil.FromRGB(rgb)
  }

  static AdjustS(c: Color, s: number): Color {
    let hsl: Vector3D = new Vector3D(
      c.GetHue(),
      c.GetSaturation(),
      c.GetBrightness(),
    )
    hsl.Y = s
    let rgb: Vector3D = ColorUtil.CHSL2RGB(hsl)
    return ColorUtil.FromRGB(rgb)
  }

  static AdjustL(c: Color, l: number): Color {
    if (l > 1) {
      l = 1
    }

    if (l < 0) {
      l = 0
    }

    let hsl: Vector3D = new Vector3D(
      c.GetHue(),
      c.GetSaturation(),
      c.GetBrightness(),
    )
    hsl.Z = l
    let rgb: Vector3D = ColorUtil.CHSL2RGB(hsl)
    return ColorUtil.FromRGB(rgb)
  }

  ///  <summary>
  ///  This will calculate the color along a hexagon on the edges of an RGB cube.
  ///  incrementsUntilRepeat is the value where we return to the starting point of the hexagon (white).
  ///  increments is used as the distance-along-hexagon parameter.
  ///  </summary>
  static ColorAlongHexagon(
    incrementsUntilRepeat: number,
    increments: number,
  ): Color {
    //  Bring to main hexagon (handle looping)
    0 * incrementsUntilRepeat
    //  an offset along the color hexagon
    increments = increments % incrementsUntilRepeat
    //  0 to 6, so we can have each edge of the hexagon live in a unit interval.
    let distAlongHex: number =
      <number>increments * (6 / incrementsUntilRepeat)
    let subtractive: Func<number, number>
    <number>(255 * (1 - d))
    let addative: Func<number, number>
    <number>(255 * d)
    let blue: boolean = true
    if (blue) {
      if (distAlongHex < 1) {
        return Color.FromArgb(255, subtractive(distAlongHex), 255, 255)
      }

      distAlongHex--
      if (distAlongHex < 1) {
        return Color.FromArgb(255, 0, subtractive(distAlongHex), 255)
      }

      distAlongHex--
      if (distAlongHex < 1) {
        return Color.FromArgb(255, 0, 0, subtractive(distAlongHex))
      }

      distAlongHex--
      if (distAlongHex < 1) {
        return Color.FromArgb(255, addative(distAlongHex), 0, 0)
      }

      distAlongHex--
      if (distAlongHex < 1) {
        return Color.FromArgb(255, 255, addative(distAlongHex), 0)
      }

      distAlongHex--
      if (distAlongHex < 1) {
        return Color.FromArgb(255, 255, 255, addative(distAlongHex))
      }
    } else {
      if (distAlongHex < 1) {
        return Color.FromArgb(255, 255, 255, subtractive(distAlongHex))
      }

      distAlongHex--
      if (distAlongHex < 1) {
        return Color.FromArgb(255, 255, subtractive(distAlongHex), 0)
      }

      distAlongHex--
      if (distAlongHex < 1) {
        return Color.FromArgb(255, subtractive(distAlongHex), 0, 0)
      }

      distAlongHex--
      if (distAlongHex < 1) {
        return Color.FromArgb(255, 0, 0, addative(distAlongHex))
      }

      distAlongHex--
      if (distAlongHex < 1) {
        return Color.FromArgb(255, 0, addative(distAlongHex), 255)
      }

      distAlongHex--
      if (distAlongHex < 1) {
        return Color.FromArgb(255, addative(distAlongHex), 255, 255)
      }
    }

    throw new System.Exception('Bad impl')
  }
}
