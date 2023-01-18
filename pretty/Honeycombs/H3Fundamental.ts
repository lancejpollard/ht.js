export class H3FundamentalTetEqualityComparer extends IEqualityComparer<H3FundamentalTet> {
  Equals(t1: H3FundamentalTet, t2: H3FundamentalTet): boolean {
    return t1.ID.Compare(t2.ID, m_tolerance)
  }

  GetHashCode(t: H3FundamentalTet): number {
    return t.ID.GetHashCode()
  }

  #m_tolerance: number = 0.0001
}
///  <summary>
///  Class for the fundamental tetrahedron.
///  </summary>
export class H3FundamentalTet {
  constructor(
    center: Vector3D,
    face: Vector3D,
    edge: Vector3D,
    vertex: Vector3D,
  ) {
    Verts[0] = center
    Verts[1] = face
    Verts[2] = edge
    Verts[3] = vertex
    this.CalcFaces()
  }

  //  The order of these 4 vertices will be
  //  Center,Face,Edge,Vertex of the parent cell.
  Verts: Vector3D[] = new Array(4)

  get Faces(): Sphere[] {
    return m_faces
  }

  #m_faces: Sphere[]

  #CalcFaces() {
    this.m_faces = [
      H3Models.Ball.OrthogonalSphereInterior(
        this.Verts[0],
        this.Verts[1],
        this.Verts[2],
      ),
      H3Models.Ball.OrthogonalSphereInterior(
        this.Verts[0],
        this.Verts[3],
        this.Verts[1],
      ),
      H3Models.Ball.OrthogonalSphereInterior(
        this.Verts[0],
        this.Verts[2],
        this.Verts[3],
      ),
      H3Models.Ball.OrthogonalSphereInterior(
        this.Verts[1],
        this.Verts[3],
        this.Verts[2],
      ),
    ]
  }

  get ID(): Vector3D {
    let result: Vector3D = new Vector3D()
    for (let v: Vector3D in this.Verts) {
      result = result + v
    }

    return result
  }

  Clone(): H3FundamentalTet {
    return new H3FundamentalTet(
      this.Verts[0],
      this.Verts[1],
      this.Verts[2],
      this.Verts[3],
    )
  }

  Reflect(sphere: Sphere) {
    for (let i: number = 0; i < 4; i++) {
      this.Verts[i] = sphere.ReflectPoint(this.Verts[i])
    }

    this.CalcFaces()
  }
}
///  <summary>
///  This class generates H3 honeycombs via a fundamental region.
///  </summary>
export class H3Fundamental {
  static Generate(honeycomb: EHoneycomb, settings: H3.Settings) {
    //  XXX - Block the same as in H3.  Share code better.
    let template: H3.Cell = null
    let r: number
    let p: number
    let q: number
    Honeycomb.PQR(honeycomb, /* out */ p, /* out */ q, /* out */ r)
    //  Get data we need to generate the honeycomb.
    let projection: Polytope.Projection =
      Polytope.Projection.FaceCentered
    let psi: number
    let phi: number
    let chi: number
    H3.HoneycombData(
      honeycomb,
      /* out */ phi,
      /* out */ chi,
      /* out */ psi,
    )
    H3.SetupCentering(
      honeycomb,
      settings,
      phi,
      chi,
      psi,
      /* ref */ projection,
    )
    let tiling: Tiling = new Tiling()
    let config: TilingConfig = new TilingConfig(p, q)
    tiling.GenerateInternal(config, projection)
    let first: H3.Cell = new H3.Cell(p, H3.GenFacets(tiling))
    first.ToSphere()
    //  Work in ball model.
    first.ScaleToCircumSphere(1)
    first.ApplyMobius(settings.Mobius)
    template = first
    //  Center
    let center: Vector3D = template.Center
    //  Face
    let facet: H3.Cell.Facet = template.Facets[0]
    let s: Sphere = H3Models.Ball.OrthogonalSphereInterior(
      facet.Verts[0],
      facet.Verts[1],
      facet.Verts[2],
    )
    let face: Vector3D = s.Center
    face.Normalize()
    face = face * H3Fundamental.DistOriginToOrthogonalSphere(s.Radius)
    //  Edge
    let c: Circle3D
    H3Models.Ball.OrthogonalCircleInterior(
      facet.Verts[0],
      facet.Verts[1],
      /* out */ c,
    )
    let edge: Vector3D = c.Center
    edge.Normalize()
    edge = edge * H3Fundamental.DistOriginToOrthogonalSphere(c.Radius)
    //  Vertex
    let vertex: Vector3D = facet.Verts[0]
    let fundamental: H3FundamentalTet = new H3FundamentalTet(
      center,
      face,
      edge,
      vertex,
    )
    //  Recurse.
    let level: number = 1
    let completedH3FundamentalTets: Record<H3FundamentalTet, number> =
      new Record<H3FundamentalTet, number>(
        new H3FundamentalTetEqualityComparer(),
      )
    completedH3FundamentalTets.Add(fundamental, level)
    let tets: List<H3FundamentalTet> = new List<H3FundamentalTet>()
    tets.Add(fundamental)
    H3Fundamental.ReflectRecursive(
      level,
      tets,
      completedH3FundamentalTets,
      settings,
    )
    let mesh: Shapeways = new Shapeways()
    for (let kvp: KeyValuePair<
      H3FundamentalTet,
      number
    > in completedH3FundamentalTets) {
      if (Utils.Odd(kvp.Value)) {
        continue
      }

      let tet: H3FundamentalTet = kvp.Key
      //  XXX - really want sphere surfaces here.
      mesh.Mesh.Triangles.Add(
        new Mesh.Triangle(tet.Verts[0], tet.Verts[1], tet.Verts[2]),
      )
      mesh.Mesh.Triangles.Add(
        new Mesh.Triangle(tet.Verts[0], tet.Verts[3], tet.Verts[1]),
      )
      mesh.Mesh.Triangles.Add(
        new Mesh.Triangle(tet.Verts[0], tet.Verts[2], tet.Verts[3]),
      )
      mesh.Mesh.Triangles.Add(
        new Mesh.Triangle(tet.Verts[1], tet.Verts[3], tet.Verts[2]),
      )
    }

    mesh.Mesh.Scale(settings.Scale)
    STL.SaveMeshToSTL(
      mesh.Mesh,
      H3.m_baseDir + ('fundamental' + '.stl'),
    )
  }

  static #DistOriginToOrthogonalSphere(r: number): number {
    //  http://mathworld.wolfram.com/OrthogonalCircles.html
    let d: number = Math.Sqrt(1 + r * r)
    return d - r
  }

  static #ReflectRecursive(
    level: number,
    tets: List<H3FundamentalTet>,
    completedH3FundamentalTets: Record<H3FundamentalTet, number>,
    settings: H3.Settings,
  ) {
    //  Breadth first recursion.
    if (0 == tets.Count) {
      return
    }

    level++
    let reflected: List<H3FundamentalTet> = new List<H3FundamentalTet>()
    for (let tet: H3FundamentalTet in tets) {
      for (let facetSphere: Sphere in tet.Faces) {
        if (facetSphere == null) {
          throw new System.Exception('Unexpected.')
        }

        if (completedH3FundamentalTets.Count > settings.MaxCells) {
          return
        }

        let newH3FundamentalTet: H3FundamentalTet = tet.Clone()
        newH3FundamentalTet.Reflect(facetSphere)
        if (
          completedH3FundamentalTets.Keys.Contains(
            newH3FundamentalTet,
          ) ||
          !H3Fundamental.H3FundamentalTetOk(newH3FundamentalTet)
        ) {
          continue
        }

        reflected.Add(newH3FundamentalTet)
        completedH3FundamentalTets.Add(newH3FundamentalTet, level)
      }
    }

    H3Fundamental.ReflectRecursive(
      level,
      reflected,
      completedH3FundamentalTets,
      settings,
    )
  }

  static #H3FundamentalTetOk(tet: H3FundamentalTet): boolean {
    let cutoff: number = 0.95
    for (let v: Vector3D in tet.Verts) {
      if (Tolerance.GreaterThan(v.Z, 0) || v.Abs() > cutoff) {
        return false
      }
    }

    return true
  }
}
