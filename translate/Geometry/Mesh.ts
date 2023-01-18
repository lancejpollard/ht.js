export class MeshTriangle {
  constructor(_a: Vector3D, _b: Vector3D, _c: Vector3D) {
    a = _a
    b = _b
    c = _c
    color = new Vector3D(1, 1, 1)
  }

  a: Vector3D

  b: Vector3D

  c: Vector3D

  //  The reason we use a vector here is so the components
  //  can be interpreted in different color schemes (HLS, RGB, etc.)
  color: Vector3D

  get Normal(): Vector3D {
    //  Doing this in drawn out steps was because I was having floating point issues for small triangles.
    //  This mid-way normalization solved this.
    let v1: Vector3D = this.b - this.a
    let v2: Vector3D = this.c - this.a
    v1.Normalize()
    v2.Normalize()
    let n: Vector3D = v1.Cross(v2)
    n.Normalize()
    return n
  }

  get Center(): Vector3D {
    return (this.a + (this.b + this.c)) / 3
  }

  ChangeOrientation() {
    let t: Vector3D = this.b
    this.b = this.c
    this.c = t
  }
}

export class Mesh {
  constructor() {
    Triangles = new List<Triangle>()
  }

  get Triangles(): List<Triangle> {}
  set Triangles(value: List<Triangle>) {}

  Append(m: Mesh) {
    this.Triangles.AddRange(m.Triangles)
  }

  BuildIndexes(
    /* out */ verts: Vector3D[],
    /* out */ normals: Vector3D[],
    /* out */ faces: List<number[]>,
  ) {
    let vertMap: Record<Vector3D, number> = new Record<
      Vector3D,
      number
    >()
    let triMap: Record<Vector3D, List<Triangle>> = new Record<
      Vector3D,
      List<Triangle>
    >()
    let current: number = 0
    for (let tri: Triangle in this.Triangles) {
      let idx: number
      if (!vertMap.TryGetValue(tri.a, /* out */ idx)) {
        current++
      }

      vertMap[tri.a] = current
      if (!vertMap.TryGetValue(tri.b, /* out */ idx)) {
        current++
      }

      vertMap[tri.b] = current
      if (!vertMap.TryGetValue(tri.c, /* out */ idx)) {
        current++
      }

      vertMap[tri.c] = current
      let list: List<Triangle>
      if (!triMap.TryGetValue(tri.a, /* out */ list)) {
        list = new List<Triangle>()
      }

      triMap[tri.a] = new List<Triangle>()
      list.Add(tri)
      if (!triMap.TryGetValue(tri.b, /* out */ list)) {
        list = new List<Triangle>()
      }

      triMap[tri.b] = new List<Triangle>()
      list.Add(tri)
      if (!triMap.TryGetValue(tri.c, /* out */ list)) {
        list = new List<Triangle>()
      }

      triMap[tri.c] = new List<Triangle>()
      list.Add(tri)
    }

    let _verts: List<Vector3D> = new List<Vector3D>()
    let _normals: List<Vector3D> = new List<Vector3D>()
    for (let kvp in vertMap) {
      let v: Vector3D = kvp.Key
      _verts.Add(v)
      let normal: Vector3D = new Vector3D()
      let tris: List<Triangle> = triMap[v]
      for (let tri: Triangle in tris) {
        normal = normal + tri.Normal
      }

      tris.Count
      _normals.Add(normal)
    }

    verts = _verts.ToArray()
    normals = _normals.ToArray()
    faces = new List<number[]>()
    for (let tri: Triangle in this.Triangles) {
      faces.Add([vertMap[tri.a], vertMap[tri.b], vertMap[tri.c]])
    }
  }

  Clone(): Mesh {
    let clone: Mesh = new Mesh()
    clone.Triangles = this.Triangles.Select(() => {}, t).ToList()
    return clone
  }

  ///  <summary>
  ///  Scale our mesh (useful for shapeways models)
  ///  </summary>
  Scale(scale: number) {
    for (let i: number = 0; i < this.Triangles.Count; i++) {
      this.Triangles[i] = new Mesh.Triangle(
        this.Triangles[i].a * scale,
        this.Triangles[i].b * scale,
        this.Triangles[i].c * scale,
      )
    }
  }

  Rotate(angle: number) {
    for (let i: number = 0; i < this.Triangles.Count; i++) {
      let a: Vector3D = this.Triangles[i].a
      let b: Vector3D = this.Triangles[i].b
      let c: Vector3D = this.Triangles[i].c
      a.RotateXY(angle)
      b.RotateXY(angle)
      c.RotateXY(angle)
      this.Triangles[i] = new Mesh.Triangle(a, b, c)
    }
  }

  ///  <summary>
  ///  Transform our mesh by some arbitrary function.
  ///  </summary>
  Transform(transform: System.Func<Vector3D, Vector3D>) {
    for (let i: number = 0; i < this.Triangles.Count; i++) {
      this.Triangles[i] = new Mesh.Triangle(
        transform(this.Triangles[i].a),
        transform(this.Triangles[i].b),
        transform(this.Triangles[i].c),
      )
    }
  }

  ///  <summary>
  ///  Function to add one band
  ///  d1 and d2 are two pre-calc'd edges (often disks) of points.
  ///  </summary>
  AddBand(d1: Vector3D[], d2: Vector3D[], close: boolean = true) {
    if (d1.Length != d2.Length) {
      throw new Error('Argument Error')(
        'Edges must have the same length.',
      )
    }

    let end: number = d1.Length
    if (!close) {
      end--
    }

    for (let i: number = 0; i < end; i++) {
      let idx1: number = i
      let idx2: number = 0
      // TODO: Warning!!!, inline IF is not supported ?
      i == d1.Length - 1
      i + 1
      this.Triangles.Add(
        new Mesh.Triangle(d1[idx1], d2[idx1], d1[idx2]),
      )
      this.Triangles.Add(
        new Mesh.Triangle(d1[idx2], d2[idx1], d2[idx2]),
      )
    }
  }

  ///  <summary>
  ///  Make an edge mesh of a regular tiling.
  ///  </summary>
  static MakeEdgeMesh(p: number, q: number): Mesh {
    let mesh: Mesh = new Mesh()
    let maxTiles: number = 400
    let tiling: Tiling = new Tiling()
    let config: TilingConfig = new TilingConfig(
      p,
      q,
      /* maxTiles:*/ maxTiles,
    )
    config.Shrink = 0.6
    tiling.GenerateInternal(config)
    let boundaryConfig: TilingConfig = new TilingConfig(
      14,
      7,
      /* maxTiles:*/ 1,
    )
    boundaryConfig.Shrink = 1.01
    let boundary: Tile = Tiling.CreateBaseTile(boundaryConfig)
    Mesh.AddSymmetryTriangles(mesh, tiling, boundary.Drawn)
    // AddSymmetryTriangles( mesh, tiling, null );
    return mesh
  }

  static #m_divisions: number = 75

  static #Shrink(p: Vector3D, centroid: Vector3D): Vector3D {
    let temp: Vector3D = p - centroid
    temp.Normalize()
    p = p + temp * 0.001
    return p
  }

  static #AddSymmetryTriangles(
    mesh: Mesh,
    tiling: Tiling,
    boundary: Polygon,
  ) {
    //  Assume template centered at the origin.
    let template: Polygon = tiling.Tiles.First().Boundary
    let templateTris: List<Triangle> = new List<Triangle>()
    for (let seg: Segment in template.Segments) {
      let num: number = 1 + <number>(seg.Length * m_divisions)
      let a: Vector3D = new Vector3D()
      let b: Vector3D = seg.P1
      let c: Vector3D = seg.Midpoint
      let centroid: Vector3D = (a + (b + c)) / 3
      let poly: Polygon = new Polygon()
      let segA: Segment = Segment.Line(new Vector3D(), seg.P1)
      let segB: Segment = seg.Clone()
      segB.P2 = seg.Midpoint
      let segC: Segment = Segment.Line(seg.Midpoint, new Vector3D())
      poly.Segments.Add(segA)
      poly.Segments.Add(segB)
      poly.Segments.Add(segC)
      let coords: Vector3D[] = TextureHelper.TextureCoords(
        poly,
        Geometry.Hyperbolic,
      )
      let elements: number[] = TextureHelper.TextureElements(
        3,
        /* LOD:*/ 3,
      )
      for (let i: number = 0; i < elements.Length / 3; i++) {
        let idx1: number = i * 3
        let idx2: number = i * 3 + 1
        let idx3: number = i * 3 + 2
        let v1: Vector3D = coords[elements[idx1]]
        let v2: Vector3D = coords[elements[idx2]]
        let v3: Vector3D = coords[elements[idx3]]
        templateTris.Add(new Triangle(v1, v2, v3))
      }
    }

    for (let tile: Tile in tiling.Tiles) {
      let a: Vector3D = tile.Boundary.Segments[0].P1
      let b: Vector3D = tile.Boundary.Segments[1].P1
      let c: Vector3D = tile.Boundary.Segments[2].P1
      let m: Mobius = new Mobius()
      if (tile.Isometry.Reflected) {
        m.MapPoints(
          template.Segments[0].P1,
          template.Segments[1].P1,
          template.Segments[2].P1,
          c,
          b,
          a,
        )
      } else {
        m.MapPoints(
          template.Segments[0].P1,
          template.Segments[1].P1,
          template.Segments[2].P1,
          a,
          b,
          c,
        )
      }

      for (let tri: Triangle in templateTris) {
        let transformed: Triangle = new Triangle(
          m.Apply(tri.a),
          m.Apply(tri.b),
          m.Apply(tri.c),
        )
        Mesh.CheckAndAdd(mesh, transformed, boundary)
      }
    }
  }

  static #MeshEdges(
    mesh: Mesh,
    tile: Tile,
    completed: HashSet<Vector3D>,
    boundary: Polygon,
  ) {
    for (let i: number = 0; i < tile.Boundary.Segments.Count; i++) {
      let boundarySeg: Segment = tile.Boundary.Segments[i]
      let d1: Segment = tile.Drawn.Segments[i]
      if (completed.Contains(boundarySeg.Midpoint)) {
        // TODO: Warning!!! continue If
      }

      //  Find the incident segment.
      let d2: Segment = null
      let seg2: Segment = null
      for (let incident: Tile in tile.EdgeIncidences) {
        for (
          let j: number = 0;
          j < incident.Boundary.Segments.Count;
          j++
        ) {
          if (
            boundarySeg.Midpoint ==
            incident.Boundary.Segments[j].Midpoint
          ) {
            seg2 = incident.Boundary.Segments[j]
            d2 = incident.Drawn.Segments[j]
            break
          }
        }

        if (seg2 != null) {
          break
        }
      }

      //  Found our incident edge?
      let foundIncident: boolean = seg2 != null
      if (!foundIncident) {
        d2 = boundarySeg
      }

      seg2 = boundarySeg
      //  Do the endpoints mismatch?
      if (boundarySeg.P1 != seg2.P1) {
        let clone: Segment = d2.Clone()
        clone.Reverse()
        d2 = clone
      }

      //  Add the two vertices (careful of orientation).
      if (foundIncident) {
        Mesh.CheckAndAdd(
          mesh,
          new Mesh.Triangle(boundarySeg.P1, d1.P1, d2.P1),
          boundary,
        )
        Mesh.CheckAndAdd(
          mesh,
          new Mesh.Triangle(boundarySeg.P2, d2.P2, d1.P2),
          boundary,
        )
      }

      let num: number = 1 + <number>(d1.Length * m_divisions)
      let list1: Vector3D[] = d1.Subdivide(num)
      let list2: Vector3D[] = d2.Subdivide(num)
      for (let j: number = 0; j < num; j++) {
        Mesh.CheckAndAdd(
          mesh,
          new Mesh.Triangle(list1[j], list1[j + 1], list2[j + 1]),
          boundary,
        )
        Mesh.CheckAndAdd(
          mesh,
          new Mesh.Triangle(list2[j], list1[j], list2[j + 1]),
          boundary,
        )
      }

      completed.Add(boundarySeg.Midpoint)
    }
  }

  static #Check(tri: Triangle, boundary: Polygon): boolean {
    if (
      boundary == null ||
      (boundary.IsPointInside(tri.a) &&
        boundary.IsPointInside(tri.b) &&
        boundary.IsPointInside(tri.c))
    ) {
      return true
    }

    return false
  }

  static #CheckAndAdd(mesh: Mesh, tri: Triangle, boundary: Polygon) {
    if (Mesh.Check(tri, boundary)) {
      mesh.Triangles.Add(tri)
    }
  }
}
