class Lamp {
  static #m_inventory: Inventory = new Inventory()

  ///  <summary>
  ///  Function I was using for lamp project, probably a bit out of date.
  ///  </summary>
  static AddToMeshLamp(mesh: Shapeways, v1: Vector3D, v2: Vector3D) {
    //  need to get these from CalcBallArc
    let center: Vector3D = Vector3D.DneVector()
    let radius: number = NaN
    let normal: Vector3D = Vector3D.DneVector()
    let angleTot: number = NaN
    let length1: number = Lamp.Scale(2.1)
    //  12-end piece
    // double length1 = Scale( 1.6 );    // 6-end piece
    // double length1 = Scale( 1.4 );    // 4-end piece
    let length2: number = Lamp.Scale(0.5)
    let outerRadStart: number = Lamp.Scale(0.0625 / 2)
    let outerRadEnd: number = Lamp.Scale(0.25 / 2)
    let outerSizeFunc: System.Func<Vector3D, number>
    let angle: number = (v1 - center).AngleTo(v - center)
    let len: number = radius * angle
    return (
      outerRadStart + (outerRadEnd - outerRadStart) * (len / length1)
    )

    let outerSizeFunc2: System.Func<Vector3D, number>
    let angle: number = (v2 - center).AngleTo(v - center)
    let len: number = radius * angle
    return (
      outerRadStart + (outerRadEnd - outerRadStart) * (len / length1)
    )

    let innerSizeFunc: System.Func<Vector3D, number>
    //  Very slightly bigger than 1/8 inch OD.
    return Lamp.Scale(0.13 / 2)

    let outerPoints: Vector3D[] = Shapeways.CalcArcPoints(
      center,
      radius,
      v1,
      normal,
      length1 / radius,
    )
    let innerPoints: Vector3D[] = Shapeways.CalcArcPoints(
      center,
      radius,
      outerPoints[outerPoints.Length - 1],
      normal * -1,
      length2 / radius,
    )
    mesh.AddCornucopia(
      outerPoints,
      outerSizeFunc,
      innerPoints,
      innerSizeFunc,
    )
    outerPoints = Shapeways.CalcArcPoints(
      center,
      radius,
      v2,
      normal * -1,
      length1 / radius,
    )
    innerPoints = Shapeways.CalcArcPoints(
      center,
      radius,
      outerPoints[outerPoints.Length - 1],
      normal,
      length2 / radius,
    )
    mesh.AddCornucopia(
      outerPoints,
      outerSizeFunc2,
      innerPoints,
      innerSizeFunc,
    )
    m_inventory.AddRod(Rod.Create(radius, angleTot))
  }

  static #Scale(rad: number): number {
    //  This is ball model radius of final object
    let scale: number = 9
    return rad / scale
  }
}

class Rod {
  static Create(radius: number, angle: number): Rod {
    let r: Rod = new Rod()
    r.Radius = radius
    r.Length = radius * angle
    return r
  }

  get Radius(): number {}
  set Radius(value: number) {}

  get Length(): number {}
  set Length(value: number) {}

  static Operator(r1: Rod, r2: Rod): boolean {
    return r1.Compare(r2, Tolerance.Threshold)
  }

  static Operator(r1: Rod, r2: Rod): boolean {
    return !(r1 == r2)
  }

  /* override */ Equals(obj: Object): boolean {
    let r: Rod = <Rod>obj
    return r == this
  }

  /* override */ GetHashCode(): number {
    let inverse: number = 1 / Tolerance.Threshold
    let decimals: number = <number>Math.log10(inverse)
    return (
      Math.Round(this.Radius, decimals).GetHashCode() |
      Math.Round(this.Length, decimals).GetHashCode()
    )
    // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
  }

  Compare(other: Rod, threshold: number): boolean {
    return (
      Tolerance.Equal(this.Radius, other.Radius, threshold) &&
      Tolerance.Equal(this.Length, other.Length, threshold)
    )
  }
}

class Inventory {
  Rods: Record<Rod, number> = new Record<Rod, number>()

  AddRod(rod: Rod) {
    let num: number
    if (this.Rods.TryGetValue(rod, /* out */ num)) {
      num++
    } else {
      num = 1
    }

    this.Rods[rod] = num
  }

  get TotalLength(): number {
    let result: number = 0
    for (let kvp: KeyValuePair<Rod, number> in this.Rods) {
      result = result + kvp.Key.Length * kvp.Value
    }

    return result
  }
}
