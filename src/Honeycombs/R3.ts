//  NOTE: Wanted to name this class R3 (parallel to H3/S3), but namespace problems happened.
export class Euclidean {
  static GeodesicPoints(v1: Vector3D, v2: Vector3D): Array<Vector3D> {
    let div: number = 4
    let seg: Segment = Segment.Line(v1, v2)
    let result: Array<Vector3D> = seg.Subdivide(div)
    return result
  }

  static GenEuclidean() {
    let mesh: Shapeways = new Shapeways()
    let completed: HashSet<H3.Cell.Edge> = new HashSet<H3.Cell.Edge>(
      new H3.Cell.EdgeEqualityComparer(),
    )
    let count: number = 2
    for (let i: number = count * -1; i < count; i++) {
      for (let j: number = count * -1; j < count; j++) {
        for (let k: number = count * -1; k < count; k++) {
          //  Offset
          let io: number = i + 0.5
          let jo: number = j + 0.5
          let ko: number = k + 0.5
          let p: Vector3D = new Vector3D(io, jo, ko)
          //  Add a sphere for this point.
          let s: Sphere = new Sphere()
          mesh.AddSphere(s.Center, s.Radius)
          //  Do every edge emanating from this point.
          Euclidean.AddEuclideanEdge(
            mesh,
            completed,
            p,
            new Vector3D(io + 1, jo, ko),
          )
          Euclidean.AddEuclideanEdge(
            mesh,
            completed,
            p,
            new Vector3D(io - 1, jo, ko),
          )
          Euclidean.AddEuclideanEdge(
            mesh,
            completed,
            p,
            new Vector3D(io, jo + 1, ko),
          )
          Euclidean.AddEuclideanEdge(
            mesh,
            completed,
            p,
            new Vector3D(io, jo - 1, ko),
          )
          Euclidean.AddEuclideanEdge(
            mesh,
            completed,
            p,
            new Vector3D(io, jo, ko + 1),
          )
          Euclidean.AddEuclideanEdge(
            mesh,
            completed,
            p,
            new Vector3D(io, jo, ko - 1),
          )
        }
      }
    }

    STL.SaveMeshToSTL(mesh.Mesh, '434.stl')
    // PovRay.WriteEdges( new PovRay.Parameters() { AngularThickness = .05 }, Geometry.Euclidean, completed.ToArray(), "434.pov", append: false );
  }

  static #AddEuclideanEdge(
    mesh: Shapeways,
    completed: HashSet<H3.Cell.Edge>,
    start: Vector3D,
    end: Vector3D,
  ) {
    let cutoff: number = 1.75
    if (
      Math.abs(start.X) > cutoff ||
      Math.abs(start.Y) > cutoff ||
      Math.abs(start.Z) > cutoff ||
      Math.abs(end.X) > cutoff ||
      Math.abs(end.Y) > cutoff ||
      Math.abs(end.Z) > cutoff
    ) {
      return
    }

    if (mesh != null) {
      Euclidean.AddEuclideanEdgeToMesh(mesh, completed, start, end)
      return
    }

    completed.Add(new H3.Cell.Edge(start, end))
  }

  static #AddEuclideanEdgeToMesh(
    mesh: Shapeways,
    completed: HashSet<H3.Cell.Edge>,
    start: Vector3D,
    end: Vector3D,
  ) {
    let edge: H3.Cell.Edge = new H3.Cell.Edge(start, end)
    if (completed.Contains(edge)) {
      return
    }

    let tempMesh: Shapeways = new Shapeways()
    let seg: Segment = Segment.Line(start, end)
    let div: number = 20 - <number>(start.Abs() * 4)
    if (div < 1) {
      div = 1
    }

    tempMesh.AddCurve(seg.Subdivide(div), 0.05)
    // Transform( tempMesh.Mesh );
    mesh.Mesh.Triangles.AddRange(tempMesh.Mesh.Triangles)
    completed.Add(edge)
  }

  static #Transform(mesh: Mesh) {
    let sphere: Sphere = new Sphere()
    sphere.Radius = 0.1
    for (let i: number = 0; i < mesh.Triangles.Count; i++) {
      mesh.Triangles[i] = new Mesh.Triangle(
        sphere.ReflectPoint(mesh.Triangles[i].a),
        sphere.ReflectPoint(mesh.Triangles[i].b),
        sphere.ReflectPoint(mesh.Triangles[i].c),
      )
    }
  }
}
