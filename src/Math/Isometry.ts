///  <summary>
///  Class to represent an isometry.
///  This is really just a wrapper around a Mobius transformation, but also includes a reflection in a generalized circle.
///  (Reflections can't be defined with a Mobius transformation.)
///  NOTE: The order in which the two elements are applied is important.  We will apply the Mobius part of the isometry first.

import { CircleNE } from '@Geometry/Circle'
import { Polygon } from '@Geometry/Polygon'

///  </summary>    export class Isometry extends ITransform {
class Isometry implements ITransform {
  // constructor () {
  //     m_mobius.Unity();
  // }

  constructor(m: Mobius, r: Circle) {
    Mobius = m
    Reflection = r
  }

  // constructor (i: Isometry) {
  //     Mobius = i.Mobius;
  //     if ((i.Reflection != null)) {
  //         Reflection = i.Reflection.Clone();
  //     }

  // }

  Clone(): Isometry {
    return new Isometry(this)
  }

  ///  <summary>
  ///  Mobius Transform for this isometry.
  ///  </summary>
  get Mobius(): Mobius {
    return m_mobius
  }

  set Mobius(value: Mobius) {
    m_mobius = value
  }

  #m_mobius: Mobius

  ///  <summary>
  ///  Defines the circle (or line) in which to reflect for this isometry.
  ///  Null if we don't want to include a reflection.
  ///  </summary>
  get Reflection(): Circle {
    return m_reflection
  }

  set Reflection(value: Circle) {
    m_reflection = value
    this.CacheCircleInversion(m_reflection)
  }

  ///  <summary>
  ///  Whether or not we are reflected.
  ///  </summary>
  get Reflected(): boolean {
    return m_reflection != null
  }

  //  NOTE: Applying isometries with reflections was really slow, so we cache the Mobius transforms we need to more quickly do it.
  #m_reflection: Circle

  #m_cache1: Mobius

  #m_cache2: Mobius

  ///  <summary>
  ///  Composition operator.
  ///  </summary>>
  static Operator(i1: Isometry, i2: Isometry): Isometry {
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
    w1 = i2.Apply(w1)
    w2 = i2.Apply(w2)
    w3 = i2.Apply(w3)
    w1 = i1.Apply(w1)
    w2 = i1.Apply(w2)
    w3 = i1.Apply(w3)
    let m: Mobius = new Mobius()
    m.MapPoints(p1, p2, p3, w1, w2, w3)
    let result: Isometry = new Isometry()
    result.Mobius = m
    //  Need to reflect at end?
    let r1: boolean = i1.Reflection != null
    let r2: boolean = i2.Reflection != null
    if (r1 | r2) {
      result.Reflection = new Circle(
        Vector3D.FromComplex(w1),
        Vector3D.FromComplex(w2),
        Vector3D.FromComplex(w3),
      )
      // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
    }

    return result
  }

  ///  <summary>
  ///  Applies an isometry to a vector.
  ///  </summary>
  ///  <remarks>Use the complex number version if you can.</remarks>
  Apply(z: Vector3D): Vector3D {
    let cInput: Complex = z
    let cOutput: Complex = this.Apply(cInput)
    return Vector3D.FromComplex(cOutput)
  }

  ///  <summary>
  ///  Applies an isometry to a complex number.
  ///  </summary>
  Apply(z: Complex): Complex {
    z = this.Mobius.Apply(z)
    if (this.Reflection != null) {
      z = this.ApplyCachedCircleInversion(z)
    }

    return z
  }

  ///  <summary>
  ///  Does a circle inversion on an arbitrary circle.
  ///  </summary>
  #CacheCircleInversion(inversionCircle: Circle) {
    if (inversionCircle == null) {
      return
    }

    let p3: Complex
    let p1: Complex
    let p2: Complex
    if (inversionCircle.IsLine) {
      p1 = inversionCircle.P1
      p2 = inversionCircle.P2
      p3 = (p1 + p2) / 2
    } else {
      p1 =
        inversionCircle.Center + new Vector3D(inversionCircle.Radius, 0)
      p2 =
        inversionCircle.Center +
        new Vector3D(inversionCircle.Radius * -1, 0)
      p3 =
        inversionCircle.Center + new Vector3D(0, inversionCircle.Radius)
    }

    this.CacheCircleInversion(p1, p2, p3)
  }

  ///  <summary>
  ///  Does a circle inversion in an arbitrary, generalized circle.
  ///  IOW, the three points may be collinear, in which case we are talking about a reflection.
  ///  </summary>
  #CacheCircleInversion(c1: Complex, c2: Complex, c3: Complex) {
    let toUnitCircle: Mobius = new Mobius()
    toUnitCircle.MapPoints(
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

  #ApplyCachedCircleInversion(input: Complex): Complex {
    let result: Complex = this.m_cache1.Apply(input)
    result = this.CircleInversion(result)
    result = this.m_cache2.Apply(result)
    return result
  }

  static #IsNaN(c: Complex): boolean {
    return Number.isNaN(c.Real) || Number.isNaN(c.Imaginary)
  }

  ///  <summary>
  ///  This will reflect a point in an origin centered circle.
  ///  </summary>
  #CircleInversion(input: Complex): Complex {
    if (Isometry.IsNaN(input)) {
      return Complex.Zero
    }

    return Complex.One / Complex.Conjugate(input)
  }

  ///  <summary>
  ///  Does a Euclidean reflection across a line.
  ///  </summary>
  ///  <summary>
  ///  Returns a new Isometry that is the inverse of us.
  ///  </summary>
  Inverse(): Isometry {
    let inverse: Mobius = this.Mobius.Inverse()
    if (this.Reflection == null) {
      return new Isometry(inverse, null)
    } else {
      let reflection: Circle = this.Reflection.Clone()
      reflection.Transform(inverse)
      return new Isometry(inverse, reflection)
    }
  }

  ///  <summary>
  ///  Returns an isometry which represents a reflection across the x axis.
  ///  </summary>
  static ReflectX(): Isometry {
    let i: Isometry = new Isometry()
    let reflection: Circle = new Circle(
      new Vector3D(),
      new Vector3D(1, 0),
    )
    i.Reflection = reflection
    return i
  }

  ///  <summary>
  ///  Calculates an isometry by taking a tile boundary polygon to a home.
  ///  </summary>
  CalculateFromTwoPolygons(home: Tile, tile: Tile, g: Geometry) {
    let poly: Polygon = tile.Boundary
    this.CalculateFromTwoPolygons(home, poly, g)
  }

  CalculateFromTwoPolygons(
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
    if (poly1.Segments.Count < 3 || poly2.Segments.Count < 3) {
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
      this.Mobius = this.Mobius.Identity()
      return
    }

    let m: Mobius = new Mobius()
    m.MapPoints(p1, p2, p3, w1, w2, w3)
    this.Mobius = m
    //  Worry about reflections as well.
    if (g == Geometry.Spherical) {
      //  If inverted matches the orientation, we need a reflection.
      let inverted: boolean = poly1.IsInverted
      if (!(inverted | poly1.Orientation)) {
        this.Reflection = homeVertexCircle
      }

      // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
    } else if (!poly1.Orientation) {
      this.Reflection = homeVertexCircle
    }

    //  Some testing.
    let test: Vector3D = this.Apply(boundary.Center)
    if (test != home.Center) {
      //  ZZZ: What is happening here is that the mobius can project a point to infinity before the reflection brings it back to the origin.
      //         It hasn't been much of a problem in practice yet, but will probably need fixing at some point.
      // Trace.WriteLine( "oh no!" );
    }
  }

  ///  <summary>
  ///  Simple helper to transform an array of vertices using an isometry.
  ///  Warning! Allocates a new array.
  ///  </summary>
  static TransformVertices(
    vertices: Array<Vector3D>,
    isometry: Isometry,
  ): Array<Vector3D> {
    let result: List<Vector3D> = new List<Vector3D>()
    for (let i: number = 0; i < vertices.Length; i++) {
      let transformed: Vector3D = isometry.Apply(vertices[i])
      result.Add(transformed)
    }

    return result.ToArray()
  }
}
