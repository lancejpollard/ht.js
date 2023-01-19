import { Circle, CircleNE } from '@Geometry/Circle'
import { Complex } from '@Geometry/Complex'
import { Geometry } from '@Geometry/Geometry'
import { Polygon } from '@Geometry/Polygon'
import { Tile } from '@Geometry/Tile'
import { ITransform } from '@Geometry/Transformable'
import { Vector3D } from '@Geometry/Vector3D'
import { Mobius } from './Mobius'
import { assert } from './Utils'

// Class to represent an isometry.
// This is really just a wrapper around a Mobius transformation,
// but also includes a reflection in a generalized circle.
// (Reflections can't be defined with a Mobius transformation.)
// NOTE: The order in which the two elements are applied is important.  We will apply the Mobius part of the isometry first.
export class Isometry implements ITransform {
  static constructUnity() {
    const mobius = Mobius.construct()
    mobius.Unity()
    const isometry = new Isometry(mobius)
    return isometry
  }

  constructor(mobius: Mobius, reflection?: Circle) {
    this.Mobius = mobius

    if (reflection) {
      this.Reflection = reflection
    }
  }

  Clone(): Isometry {
    const reflection = this.Reflection
      ? this.Reflection.Clone()
      : undefined
    return new Isometry(this.Mobius, reflection)
  }

  // Mobius Transform for this isometry.

  Mobius: Mobius

  // Defines the circle (or line) in which to reflect for this isometry.
  // Null if we don't want to include a reflection.

  get Reflection(): Circle | undefined {
    return this.m_reflection
  }

  set Reflection(value: Circle | undefined) {
    this.m_reflection = value
    assert(this.m_reflection)
    this.CacheCircleInversion(this.m_reflection)
  }

  // Whether or not we are reflected.

  get Reflected(): boolean {
    return this.m_reflection != null
  }

  //  NOTE: Applying isometries with reflections was really slow, so we cache the Mobius transforms we need to more quickly do it.
  m_reflection?: Circle

  m_cache1?: Mobius

  m_cache2?: Mobius

  // Composition operator.
  static Multiply(i1: Isometry, i2: Isometry): Isometry {
    //  ZZZ - Probably a better way.
    //  We'll just apply both isometries to a canonical set of points,
    //  Then calc which isometry makes that.
    let p1: Complex = new Complex(1, 0)
    let p2: Complex = new Complex(-1, 0)
    let p3: Complex = new Complex(0, 1)
    let w3: Complex = p3
    let w1: Complex = p1
    let w2: Complex = p2

    //  Compose (apply in reverse order).
    w1 = i2.ApplyComplex(w1)
    w2 = i2.ApplyComplex(w2)
    w3 = i2.ApplyComplex(w3)
    w1 = i1.ApplyComplex(w1)
    w2 = i1.ApplyComplex(w2)
    w3 = i1.ApplyComplex(w3)

    let m: Mobius = Mobius.construct()
    m.MapPoints6d(p1, p2, p3, w1, w2, w3)

    let result: Isometry = Isometry.constructUnity()
    result.Mobius = m

    //  Need to reflect at end?
    let r1: boolean = i1.Reflection != null
    let r2: boolean = i2.Reflection != null
    if (r1 || r2) {
      result.Reflection = new Circle(
        Vector3D.FromComplex(w1),
        Vector3D.FromComplex(w2),
        Vector3D.FromComplex(w3),
      )
      // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
    }

    return result
  }

  // Applies an isometry to a vector.
  ApplyVector3D(z: Vector3D): Vector3D {
    let cInput: Complex = z.ToComplex()
    let cOutput: Complex = this.ApplyComplex(cInput)
    return Vector3D.FromComplex(cOutput)
  }

  // Applies an isometry to a complex number.

  ApplyComplex(z: Complex): Complex {
    z = this.Mobius.ApplyComplex(z)
    if (this.Reflection != null) {
      z = this.ApplyCachedCircleInversion(z)
    }

    return z
  }

  // Does a circle inversion on an arbitrary circle.
  CacheCircleInversion(inversionCircle: Circle) {
    if (inversionCircle == null) {
      return
    }

    let p3: Complex
    let p1: Complex
    let p2: Complex
    if (inversionCircle.IsLine) {
      p1 = inversionCircle.P1.ToComplex()
      p2 = inversionCircle.P2.ToComplex()
      p3 = p1.Add(p2).Divide(new Complex(2, 0))
    } else {
      p1 = inversionCircle.Center.Add(
        Vector3D.construct2d(inversionCircle.Radius, 0),
      ).ToComplex()
      p2 = inversionCircle.Center.Add(
        Vector3D.construct2d(inversionCircle.Radius * -1, 0),
      ).ToComplex()
      p3 = inversionCircle.Center.Add(
        Vector3D.construct2d(0, inversionCircle.Radius),
      ).ToComplex()
    }

    this.CacheCircleInversionFromComplex(p1, p2, p3)
  }

  // Does a circle inversion in an arbitrary, generalized circle.
  // IOW, the three points may be collinear, in which case we are talking about a reflection.
  CacheCircleInversionFromComplex(
    c1: Complex,
    c2: Complex,
    c3: Complex,
  ) {
    let toUnitCircle: Mobius = Mobius.construct()

    toUnitCircle.MapPoints6d(
      c1,
      c2,
      c3,
      new Complex(1, 0),
      new Complex(-1, 0),
      new Complex(0, 1),
    )

    this.m_cache1 = toUnitCircle
    this.m_cache2 = this.m_cache1.Inverse()
  }

  ApplyCachedCircleInversion(input: Complex): Complex {
    let result = this.m_cache1?.ApplyComplex(input)
    assert(result)
    result = this.CircleInversion(result)
    result = this.m_cache2?.ApplyComplex(result)
    assert(result)
    return result
  }

  static IsNaN(c: Complex): boolean {
    return Number.isNaN(c.Real) || Number.isNaN(c.Imaginary)
  }

  // This will reflect a point in an origin centered circle.

  CircleInversion(input: Complex): Complex {
    if (Isometry.IsNaN(input)) {
      return Complex.Zero
    }

    return Complex.One.Divide(Complex.Conjugate(input))
  }

  // Does a Euclidean reflection across a line.

  // Returns a new Isometry that is the inverse of us.

  Inverse(): Isometry {
    let inverse: Mobius = this.Mobius.Inverse()
    if (this.Reflection == null) {
      return new Isometry(inverse)
    } else {
      let reflection: Circle = this.Reflection.Clone()
      reflection.Transform(inverse)
      return new Isometry(inverse, reflection)
    }
  }

  // Returns an isometry which represents a reflection across the x axis.

  static ReflectX(): Isometry {
    let i: Isometry = Isometry.constructUnity()
    let reflection: Circle = new Circle(
      Vector3D.construct(),
      Vector3D.construct2d(1, 0),
    )
    i.Reflection = reflection
    return i
  }

  // Calculates an isometry by taking a tile boundary polygon to a home.

  CalculateFromTwoPolygons(home: Tile, tile: Tile, g: Geometry) {
    let poly: Polygon = tile.Boundary
    this.CalculateFromTwoPolygonsWithBoundary(home, poly, g)
  }

  CalculateFromTwoPolygonsWithBoundary(
    home: Tile,
    boundaryPolygon: Polygon,
    g: Geometry,
  ) {
    this.CalculateFromTwoPolygonsInternal(
      home.Boundary,
      boundaryPolygon,
      home.VertexCircle,
      g,
    )
  }

  CalculateFromTwoPolygonsInternal(
    home: Polygon,
    boundary: Polygon,
    homeVertexCircle: CircleNE,
    g: Geometry,
  ) {
    //  ZZZ - We have to use the boundary, but that can be projected to infinity for some of the spherical tilings.
    //          Trying to use the Drawn tile produced weird (yet interesting) results.
    let poly1: Polygon = boundary
    let poly2: Polygon = home
    if (poly1.Segments.length < 3 || poly2.Segments.length < 3) {
      console.assert(false)
      return
    }

    //  Same?
    let p3: Vector3D = poly1.Segments[2].P1
    let p1: Vector3D = poly1.Segments[0].P1
    let p2: Vector3D = poly1.Segments[1].P1
    let w3: Vector3D = poly2.Segments[2].P1
    let w1: Vector3D = poly2.Segments[0].P1
    let w2: Vector3D = poly2.Segments[1].P1
    if (p1 == w1 && p2 == w2 && p3 == w3) {
      this.Mobius = Mobius.Identity()
      return
    }

    let m: Mobius = Mobius.construct()
    m.MapPoints6d(
      p1.ToComplex(),
      p2.ToComplex(),
      p3.ToComplex(),
      w1.ToComplex(),
      w2.ToComplex(),
      w3.ToComplex(),
    )

    this.Mobius = m

    //  Worry about reflections as well.
    if (g == Geometry.Spherical) {
      //  If inverted matches the orientation, we need a reflection.
      let inverted: boolean = poly1.IsInverted
      if (!(inverted || poly1.Orientation)) {
        this.Reflection = homeVertexCircle
      }

      // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
    } else if (!poly1.Orientation) {
      this.Reflection = homeVertexCircle
    }

    //  Some testing.
    let test: Vector3D = this.ApplyVector3D(boundary.Center)

    if (test != home.Center) {
      //  ZZZ: What is happening here is that the mobius can project a point to infinity before the reflection brings it back to the origin.
      //         It hasn't been much of a problem in practice yet, but will probably need fixing at some point.
      // Trace.WriteLine( "oh no!" );
    }
  }

  // Simple helper to transform an array of vertices using an isometry.
  // Warning! Allocates a new array.

  static TransformVertices(
    vertices: Array<Vector3D>,
    isometry: Isometry,
  ): Array<Vector3D> {
    let result: Array<Vector3D> = []

    for (let i: number = 0; i < vertices.length; i++) {
      let transformed: Vector3D = isometry.ApplyVector3D(vertices[i])
      result.push(transformed)
    }

    return result
  }
}
