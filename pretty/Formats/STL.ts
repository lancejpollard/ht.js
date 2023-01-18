export class STL {
  static SaveMeshToSTL(mesh: Mesh, fileName: String) {
    let sw: StreamWriter = File.CreateText(fileName)
    STL.WriteInternal(mesh, sw)
  }

  static AppendMeshToSTL(mesh: Mesh, fileName: String) {
    let sw: StreamWriter = File.AppendText(fileName)
    STL.WriteInternal(mesh, sw)
  }

  static AppendMeshToSTL(mesh: Mesh, sw: StreamWriter) {
    STL.WriteInternal(mesh, sw)
  }

  static #WriteInternal(mesh: Mesh, sw: StreamWriter) {
    sw.WriteLine('solid')
    for (let tri: Mesh.Triangle in mesh.Triangles) {
      STL.WriteTriangle(sw, tri)
    }

    sw.WriteLine('endsolid')
  }

  static #WriteTriangle(sw: StreamWriter, tri: Mesh.Triangle) {
    let v1: Vector3D = tri.b - tri.a
    let v2: Vector3D = tri.c - tri.a
    //  See http://en.wikipedia.org/wiki/STL_format#The_Facet_Normal
    //  about how to do the normals correctly.
    // Vector3D n = v1.Cross( v2 );
    let n: Vector3D = new Vector3D(0, 0, 1)
    n.Normalize()
    sw.WriteLine('  facet normal {0:e6} {1:e6} {2:e6}', n.X, n.Y, n.Z)
    sw.WriteLine('    outer loop')
    sw.WriteLine(
      '      vertex {0:e6} {1:e6} {2:e6}',
      tri.a.X,
      tri.a.Y,
      tri.a.Z,
    )
    sw.WriteLine(
      '      vertex {0:e6} {1:e6} {2:e6}',
      tri.b.X,
      tri.b.Y,
      tri.b.Z,
    )
    sw.WriteLine(
      '      vertex {0:e6} {1:e6} {2:e6}',
      tri.c.X,
      tri.c.Y,
      tri.c.Z,
    )
    sw.WriteLine('    endloop')
    sw.WriteLine('  endfacet')
  }
}
