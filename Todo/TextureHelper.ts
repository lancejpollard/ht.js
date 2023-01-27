import { Geometry } from '@Geometry/Geometry'
import { Polygon, Segment } from '@Geometry/Polygon'
import { Sterographic } from '@Geometry/Sterographic'
import { Vector3D } from '@Geometry/Vector3D'

export class TextureHelper {

  m_maxSubdivisions: number
  elementIndices: Array<Array<number>>

  constructor() {
    TextureHelper.SetLevels(3)
  }

  static SetLevels(levels: number): number {
    this.m_maxSubdivisions = Math.pow(2, levels)

    return this.m_maxSubdivisions
  }

  // Stores the triangle element indices for different levels of detail.
  // There are 4 entries in the list, and the first entry will have the least detail.
  // The arrays specify indices into the texture coords, and represent triangle elements.

  get ElementIndices(): Array<Array<number>> {
    return this.elementIndices
  }

  set ElementIndices(value: Array<Array<number>>) {
    this.elementIndices = value
  }

  // Sets up our list of element indices

  SetupElementIndices(poly: Polygon) {
    // int numBaseTriangles = poly.Segments.Count == 3 ? 1 : poly.Segments.Count;    // For geodesic saddles.
    let numBaseTriangles: number = poly.Segments.Count
    this.ElementIndices = new Array<Array<number>>()
    for (let i: number = 0; Math.Pow(2, i) <= m_maxSubdivisions; i++) {
      this.ElementIndices.push(
        TextureHelper.TextureElements(numBaseTriangles, i),
      )
    }
  }

  static #m_maxSubdivisions: number = 8

  //  Must be a power of 2.
  // ///////////////////////////////////////////////////////////// PLAYING AROUND WITH GEODESIC SADDLES
  static #CalcPointsUsingTwoSegments(
    seg1: Segment,
    seg2: Segment,
    divisions: number,
    g: Geometry,
  ): Array<Vector3D> {
    let points: Array<Vector3D> = new Array<Vector3D>()
    let s1: Array<Vector3D> = TextureHelper.SubdivideSegmentInGeometry(
      seg1.P1,
      seg1.P2,
      divisions,
      g,
    )
    let s2: Array<Vector3D> = TextureHelper.SubdivideSegmentInGeometry(
      seg2.P2,
      seg2.P1,
      divisions,
      g,
    )
    for (let i: number = 0; i < divisions; i++) {
      points.push(
        ...TextureHelper.SubdivideSegmentInGeometry(
          s1[i],
          s2[i],
          divisions - i,
          g,
        ),
      )
    }

    points.push(seg1.P2)
    return points

  static CalcViaProjections(
      p1: Vector3D,
      p2: Vector3D,
      p3: Vector3D,
      divisions: number,
      g: Geometry,
    ): Array<Vector3D> {
    if (g == Geometry.Euclidean) {
      throw new Error('Not implemented')
    }

    let h3: Vector3D = Vector3D.construct()
    let h1: Vector3D = Vector3D.construct()
    let h2: Vector3D = Vector3D.construct()
    if (g == Geometry.Hyperbolic) {
      h1 = Sterographic.PlaneToHyperboloid(p1)
      h2 = Sterographic.PlaneToHyperboloid(p2)
      h3 = Sterographic.PlaneToHyperboloid(p3)
    } else if (g == Geometry.Spherical) {
      h1 = Sterographic.PlaneToSphereSafe(p1)
      h2 = Sterographic.PlaneToSphereSafe(p2)
      h3 = Sterographic.PlaneToSphereSafe(p3)
    }

    let temp: Array<Vector3D> = new Array<Vector3D>()
    let seg1: Segment = Segment.Line(h1, h2)
    let seg2: Segment = Segment.Line(h3, h2)
    let s1: Array<Vector3D> = seg1.Subdivide(divisions)
    let s2: Array<Vector3D> = seg2.Subdivide(divisions)
    for (let i: number = 0; i < divisions; i++) {
      let seg: Segment = Segment.Line(s1[i], s2[i])
      temp.push(...seg.Subdivide(divisions - i))
    }

    temp.push(h2)
    let result: Array<Vector3D> = new Array<Vector3D>()
    for (let v of temp) {
      let copy: Vector3D = v
      if (g == Geometry.Hyperbolic) {
        Sterographic.NormalizeToHyperboloid(/* ref */ copy)
        result.push(Sterographic.HyperboloidToPlane(copy))
      } else if (g == Geometry.Spherical) {
        copy.Normalize()
        result.push(Sterographic.SphereToPlane(copy))
      }
    }

    return result
  }

  static FindClosestPoint(
    v: Vector3D,
    list: Array<Vector3D>,
  ): Vector3D {
    let result: Vector3D = Vector3D.construct()
    let dist: number = double.MaxValue
    for (let t of list) {
      let abs: number = Math.abs(v - t)
      if (abs < dist) {
        dist = abs
        result = t
      }
    }

    return result
  }

  // //////////////////////////////////////////////////////////////

  // Helper to generate a set of texture coordinates.

  static TextureCoords(
    poly: Polygon,
    g: Geometry,
    doGeodesicDome: boolean = false,
  ): Array<Vector3D> {
    let divisions: number = m_maxSubdivisions
    let points: Array<Vector3D> = new Array<Vector3D>()
    if (0 == poly.Segments.Count) {
      return points
    }

    //  ZZZ - Should we do this different handling of triangles?
    //  I think no, this was just for investigating "geodesic saddles".
    let doGeodesicSaddles: boolean = doGeodesicDome
    if (3 == poly.Segments.Count && doGeodesicSaddles) {
      return TextureHelper.CalcViaProjections(
        poly.Segments[0].P1,
        poly.Segments[1].P1,
        poly.Segments[2].P1,
        divisions,
        g,
      )
    } else {
      //  We make a triangle lattice for each segment.
      //  Think of the segment and the poly center making one big triangle,
      //  which is subdivided into smaller triangles.
      for (let s of poly.Segments) {
        let s1: Array<Vector3D> =
          TextureHelper.SubdivideSegmentInGeometry(
            s.P1,
            poly.Center,
            divisions,
            g,
          )
        let s2: Array<Vector3D> =
          TextureHelper.SubdivideSegmentInGeometry(
            s.P2,
            poly.Center,
            divisions,
            g,
          )
        for (let i: number = 0; i < divisions; i++) {
          points.push(
            ...TextureHelper.SubdivideSegmentInGeometry(
              s1[i],
              s2[i],
              divisions - i,
              g,
            ),
          )
        }

        points.push(poly.Center)
      }
    }

    return points
  }

  // Subdivides a segment from p1->p2 with the two endpoints not on the origin, in the respective geometry.

  static SubdivideSegmentInGeometry(
    p1: Vector3D,
    p2: Vector3D,
    divisions: number,
    g: Geometry,
  ): Array<Vector3D> {
    //  Handle this specially, so we can keep things 3D if needed.
    if (g == Geometry.Euclidean) {
      let seg: Segment = Segment.Line(p1, p2)
      return seg.Subdivide(divisions)
    }

    let p1ToOrigin: Mobius = new Mobius()
    p1ToOrigin.Isometry(g, 0, p1 * -1)
    let inverse: Mobius = p1ToOrigin.Inverse()
    let newP2: Vector3D = p1ToOrigin.Apply(p2)
    let radial: Segment = Segment.Line(Vector3D.construct(), newP2)
    let temp: Array<Vector3D> = TextureHelper.SubdivideRadialInGeometry(
      radial,
      divisions,
      g,
    )
    let result: Array<Vector3D> = new Array<Vector3D>()
    for (let v of temp) {
      result.push(inverse.Apply(v))
    }

    return result
  }

  // Equally subdivides a segment with a startpoint at the origin, in the respective geometry.

  static #SubdivideRadialInGeometry(
    radial: Segment,
    divisions: number,
    g: Geometry,
  ): Array<Vector3D> {
    let result: Array<Vector3D> = new Array<Vector3D>()
    if (radial.Type != SegmentType.Line) {
      console.assert(false)
      return result
    }

    switch (g) {
      case Geometry.Spherical:
        let eLength: number = radial.Length
        let sLength: number = Spherical2D.e2sNorm(eLength)
        let divLength: number = sLength / divisions
        for (let i: number = 0; i <= divisions; i++) {
          let temp: number = Spherical2D.s2eNorm(divLength * i)
          result.push(radial.P2 * (temp / eLength))
        }

        break
        break
      case Geometry.Euclidean:
        return radial.Subdivide(divisions)
        break
      case Geometry.Hyperbolic:
        let eLength: number = radial.Length
        let hLength: number = DonHatch.e2hNorm(eLength)
        let divLength: number = hLength / divisions
        for (let i: number = 0; i <= divisions; i++) {
          let temp: number = DonHatch.h2eNorm(divLength * i)
          result.push(radial.P2 * (temp / eLength))
        }

        break
        break
    }

    return result
  }

  // Returns the sum of all the integers up to and including n.

  static #TriangularNumber(n: number): number {
    return n * ((n + 1) / 2)
  }

  // Grabs an array of indices into the coordinate array for TextureCoords.
  // The array represents individual triangles (each set of 3 is one triangle).

  static TextureElements(
    numBaseTriangles: number,
    LOD: number,
  ): Array<number> {
    let divisions: number = m_maxSubdivisions
    let stride: number = divisions / <number>Math.pow(2, LOD)
    //  9 + 8 + 7 + 6 + 5 + 4 + 3 + 2 + 1
    let numVertsPerSegment: number = TextureHelper.TriangularNumber(
      divisions + 1,
    )
    let result: Array<number> = new Array<number>()
    let offset: number = 0
    for (let count: number = 0; count < numBaseTriangles; count++) {
      //  Make the triangles.
      let start2: number = offset
      let start1: number = offset
      for (let i: number = 0; i < divisions; i = i + stride) {
        start1 = start2
        let temp: number = divisions - i + 1
        for (let j: number = 0; j < stride; j++) {
          start2 = start2 + temp
          temp--
        }

        for (let j: number = 0; j < divisions - i; j = j + stride) {
          let idx1: number = start1 + j
          let idx2: number = start1 + (j + stride)
          let idx3: number = start2 + j
          result.push(idx1)
          result.push(idx2)
          result.push(idx3)
        }

        for (
          let j: number = 0;
          j < divisions - (i - stride);
          j = j + stride
        ) {
          let idx1: number = start2 + j
          let idx2: number = start1 + (j + stride)
          let idx3: number = start2 + (j + stride)
          result.push(idx1)
          result.push(idx2)
          result.push(idx3)
        }
      }

      offset = offset + numVertsPerSegment
    }

    return result
  }

  static ElementGraph(
    numBaseTriangles: number,
    LOD: number,
  ): Record<number, Array<number>> {
    let result: Record<number, Array<number>> = {}
    //  Brute force.
    let textureElements: Array<number> = TextureHelper.TextureElements(
      numBaseTriangles,
      LOD,
    )
    let edgeToTriangles: Record<string, Array<number>> = {}

    for (let i: number = 0; i < textureElements.length / 3; i++) {
      let idx1: number = i * 3
      let idx2: number = i * 3 + 1
      let idx3: number = i * 3 + 2
      let idx: System.Action<GraphEdge, number>
      let addEdge: System.Action<GraphEdge, number> = e
      let tris: Array<number>
    /*   if (!edgeToTriangles.TryGetValue(e, /* out */ tris)) {
        tris = new Array<number>()
      } * /

      if (!(e in edgeToTriangles)) {
        tris = new Array<number>()
      } else {
        tris = edgeToTriangles[e]
      }

      tris.push(idx)
      edgeToTriangles[e] = tris

      addEdge(
        new GraphEdge(textureElements[idx1], textureElements[idx2]),
        i,
      )
      addEdge(
        new GraphEdge(textureElements[idx2], textureElements[idx3]),
        i,
      )
      addEdge(
        new GraphEdge(textureElements[idx3], textureElements[idx1]),
        i,
      )
    }

    let temp: Record<number, Array<number>> = {}

    let idx2: any
    let addIncident: any = idx1
    let incident: Array<number>

   /*  if (!temp.TryGetValue(idx1, /* out */ incident)) {
      incident = new Array<number>()
    } */

    if (!(idx1 in temp)) {
      incident = new Array<number>()
    } else {
      incident = temp[idx1]
    }

    incident.push(idx2)
    temp[idx1] = incident

    for (let tris of edgeToTriangles.Values) {
      if (tris.length == 1) {
        continue
      } else if (tris.length == 2) {
        addIncident(tris[0], tris[1])
        addIncident(tris[1], tris[0])
      } else {
        throw new Error()
      }
    }

    let divisions: number = this.m_maxSubdivisions
    for (let i: number = 0; i < divisions; i++) {
      addIncident(i, -1)
    }

    for (let kvp in temp) {
      result[kvp] = temp[kvp]
    }

    return result
  }
}
