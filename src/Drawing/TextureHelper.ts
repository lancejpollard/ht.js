export class TextureHelper {
  constructor() {
    TextureHelper.SetLevels(3)
  }

  static SetLevels(levels: number): number {
    m_maxSubdivisions = <number>Math.Pow(2, levels)
    return m_maxSubdivisions
  }

  ///  <summary>
  ///  Stores the triangle element indices for different levels of detail.
  ///  There are 4 entries in the list, and the first entry will have the least detail.
  ///  The arrays specify indices into the texture coords, and represent triangle elements.
  ///  </summary>
  get ElementIndices(): Array<Array<number>> {}

  set ElementIndices(value: Array<Array<number>>) {}

  ///  <summary>
  ///  Sets up our list of element indices
  ///  </summary>
  SetupElementIndices(poly: Polygon) {
    // int numBaseTriangles = poly.Segments.Count == 3 ? 1 : poly.Segments.Count;    // For geodesic saddles.
    let numBaseTriangles: number = poly.Segments.Count
    this.ElementIndices = new Array<Array<number>>()
    for (let i: number = 0; Math.Pow(2, i) <= m_maxSubdivisions; i++) {
      this.ElementIndices.Add(
        TextureHelper.TextureElements(numBaseTriangles, i),
      )
    }
  }

  static #m_maxSubdivisions: number = 8

  //  Must be a power of 2.
  /// ////////////////////////////////////////////////////////////// PLAYING AROUND WITH GEODESIC SADDLES
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
      points.AddRange(
        TextureHelper.SubdivideSegmentInGeometry(
          s1[i],
          s2[i],
          divisions - i,
          g,
        ),
      )
    }

    points.Add(seg1.P2)
    return points.ToArray()
  }

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

    let h3: Vector3D = new Vector3D()
    let h1: Vector3D = new Vector3D()
    let h2: Vector3D = new Vector3D()
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
      temp.AddRange(seg.Subdivide(divisions - i))
    }

    temp.Add(h2)
    let result: Array<Vector3D> = new Array<Vector3D>()
    for (let v: Vector3D in temp) {
      let copy: Vector3D = v
      if (g == Geometry.Hyperbolic) {
        Sterographic.NormalizeToHyperboloid(/* ref */ copy)
        result.Add(Sterographic.HyperboloidToPlane(copy))
      } else if (g == Geometry.Spherical) {
        copy.Normalize()
        result.Add(Sterographic.SphereToPlane(copy))
      }
    }

    return result.ToArray()
  }

  static #FindClosestPoint(
    v: Vector3D,
    list: Array<Vector3D>,
  ): Vector3D {
    let result: Vector3D = new Vector3D()
    let dist: number = double.MaxValue
    for (let t: Vector3D in list) {
      let abs: number = (v - t).Abs()
      if (abs < dist) {
        dist = abs
        result = t
      }
    }

    return result
  }

  /// //////////////////////////////////////////////////////////////
  ///  <summary>
  ///  Helper to generate a set of texture coordinates.
  ///  </summary>
  static TextureCoords(
    poly: Polygon,
    g: Geometry,
    doGeodesicDome: boolean = false,
  ): Array<Vector3D> {
    let divisions: number = m_maxSubdivisions
    let points: Array<Vector3D> = new Array<Vector3D>()
    if (0 == poly.Segments.Count) {
      return points.ToArray()
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
      for (let s: Segment in poly.Segments) {
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
          points.AddRange(
            TextureHelper.SubdivideSegmentInGeometry(
              s1[i],
              s2[i],
              divisions - i,
              g,
            ),
          )
        }

        points.Add(poly.Center)
      }
    }

    return points.ToArray()
  }

  ///  <summary>
  ///  Subdivides a segment from p1->p2 with the two endpoints not on the origin, in the respective geometry.
  ///  </summary>
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
    let radial: Segment = Segment.Line(new Vector3D(), newP2)
    let temp: Array<Vector3D> = TextureHelper.SubdivideRadialInGeometry(
      radial,
      divisions,
      g,
    )
    let result: Array<Vector3D> = new Array<Vector3D>()
    for (let v: Vector3D in temp) {
      result.Add(inverse.Apply(v))
    }

    return result.ToArray()
  }

  ///  <summary>
  ///  Equally subdivides a segment with a startpoint at the origin, in the respective geometry.
  ///  </summary>
  static #SubdivideRadialInGeometry(
    radial: Segment,
    divisions: number,
    g: Geometry,
  ): Array<Vector3D> {
    let result: Array<Vector3D> = new Array<Vector3D>()
    if (radial.Type != SegmentType.Line) {
      console.assert(false)
      return result.ToArray()
    }

    switch (g) {
      case Geometry.Spherical:
        let eLength: number = radial.Length
        let sLength: number = Spherical2D.e2sNorm(eLength)
        let divLength: number = sLength / divisions
        for (let i: number = 0; i <= divisions; i++) {
          let temp: number = Spherical2D.s2eNorm(divLength * i)
          result.Add(radial.P2 * (temp / eLength))
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
          result.Add(radial.P2 * (temp / eLength))
        }

        break
        break
    }

    return result.ToArray()
  }

  ///  <summary>
  ///  Returns the sum of all the integers up to and including n.
  ///  </summary>
  static #TriangularNumber(n: number): number {
    return n * ((n + 1) / 2)
  }

  ///  <summary>
  ///  Grabs an array of indices into the coordinate array for TextureCoords.
  ///  The array represents individual triangles (each set of 3 is one triangle).
  ///  </summary>
  static TextureElements(
    numBaseTriangles: number,
    LOD: number,
  ): Array<number> {
    let divisions: number = m_maxSubdivisions
    let stride: number = divisions / <number>Math.Pow(2, LOD)
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
          result.Add(idx1)
          result.Add(idx2)
          result.Add(idx3)
        }

        for (
          let j: number = 0;
          j < divisions - (i - stride);
          j = j + stride
        ) {
          let idx1: number = start2 + j
          let idx2: number = start1 + (j + stride)
          let idx3: number = start2 + (j + stride)
          result.Add(idx1)
          result.Add(idx2)
          result.Add(idx3)
        }
      }

      offset = offset + numVertsPerSegment
    }

    return result.ToArray()
  }

  static ElementGraph(
    numBaseTriangles: number,
    LOD: number,
  ): Record<number, Array<number>> {
    let result: Record<number, Array<number>> = new Record<
      number,
      Array<number>
    >()
    //  Brute force.
    let textureElements: Array<number> = TextureHelper.TextureElements(
      numBaseTriangles,
      LOD,
    )
    let edgeToTriangles: Record<GraphEdge, Array<number>> = new Record<
      GraphEdge,
      Array<number>
    >()
    for (let i: number = 0; i < textureElements.Length / 3; i++) {
      let idx1: number = i * 3
      let idx2: number = i * 3 + 1
      let idx3: number = i * 3 + 2
      let idx: System.Action<GraphEdge, number>
      let addEdge: System.Action<GraphEdge, number> = e
      let tris: Array<number>
      if (!edgeToTriangles.TryGetValue(e, /* out */ tris)) {
        tris = new Array<number>()
      }

      tris.Add(idx)
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

    let temp: Record<number, Array<number>> = new Record<
      number,
      Array<number>
    >()
    let idx2: System.Action<number, number>
    let addIncident: System.Action<number, number> = idx1
    let incident: Array<number>
    if (!temp.TryGetValue(idx1, /* out */ incident)) {
      incident = new Array<number>()
    }

    incident.Add(idx2)
    temp[idx1] = incident

    for (let tris in edgeToTriangles.Values) {
      if (tris.Count == 1) {
        continue
      } else if (tris.Count == 2) {
        addIncident(tris[0], tris[1])
        addIncident(tris[1], tris[0])
      } else {
        throw new Error()
      }
    }

    let divisions: number = m_maxSubdivisions
    for (let i: number = 0; i < divisions; i++) {
      addIncident(i, -1)
    }

    for (let kvp in temp) {
      result[kvp.Key] = kvp.Value.ToArray()
    }

    return result
  }
}
