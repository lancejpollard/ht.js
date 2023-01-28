import { MeshTriangle } from '../src/Geometry/MeshTriangle'
import { Polygon, Segment } from '../src/Geometry/Polygon'
import { Tile } from '../src/Geometry/Tile'
import { Vector3D } from '../src/Geometry/Vector3D'
import { Mobius } from '@Math/Mobius'
import { TilingConfig } from '@Math/TilingConfig'
import { Tiling } from '@Math/Tiling'
import { TextureHelper } from './TextureHelper'
export class Mesh {
  MeshTriangles: Array<MeshTriangle>

  m_divisions: number = 75

  constructor() {
    this.MeshTriangles = new Array<MeshTriangle>()
  }

  Append(m: Mesh) {
    this.MeshTriangles.push(...m.MeshTriangles)
  }

  static TryGetInt(
    edges: Record<string, number>,
    edge: Vector3D,
    ref: { passThrough: unknown },
  ) {
    const resolved = edges[edge.GetHashCode()]
    ref.passThrough = resolved ?? undefined
    return Boolean(resolved)
  }

  static TryGetMesh(
    edges: Record<string, Array<MeshTriangle>>,
    edge: Vector3D,
    ref: { passThrough: unknown },
  ) {
    const resolved = edges[edge.GetHashCode()]
    ref.passThrough = resolved ?? []
    return Boolean(resolved)
  }

  BuildIndexes(
    /* out */ verts: Array<Vector3D>,
    /* out */ normals: Array<Vector3D>,
    /* out */ faces: Array<Array<number>>,
  ) {


    let vertMap: Record<string, number> = {}

    let triMap: Record<string, Array<MeshTriangle>> = {}

    let current: number = 0

    for (let tri of this.MeshTriangles) {
      let idx: number
      let state: { passThrough: number | undefined | Array<MeshTriangle> }
      // if (!vertMap.TryGetValue(edge, /* out */ idx)) {
      //   vertMap[tri.a] = current++;
      // }

      state = { passThrough: undefined }

      if (!Mesh.TryGetInt(vertMap, tri.a, state)) {
        vertMap[tri.a.GetHashCode()] = current++;
      } else if (typeof state.passThrough == "number") {
        idx = state.passThrough!
      }

      if (!Mesh.TryGetInt(vertMap, tri.b, state)) {
        vertMap[tri.b.GetHashCode()] = current++;
      } else if (typeof state.passThrough == "number") {
        idx = state.passThrough
      }

      if (!Mesh.TryGetInt(vertMap, tri.c, state)) {
        vertMap[tri.c.GetHashCode()] = current++;
      } else if (typeof state.passThrough == "number") {
        idx = state.passThrough!
      }

      let list: Array<MeshTriangle> = []

      if (!Mesh.TryGetMesh(triMap, tri.a, state)) {
        triMap[tri.a.GetHashCode()] = list = new Array<MeshTriangle>()
      } else if (Array.isArray(state.passThrough)) {
        list = state.passThrough
      }

      list.push(tri)

      if (!Mesh.TryGetMesh(triMap, tri.b, state)) {
        triMap[tri.b.GetHashCode()] = list = new Array<MeshTriangle>()
      } else if (Array.isArray(state.passThrough)) {
        list = state.passThrough
      }


      list.push(tri)

      if (!Mesh.TryGetMesh(triMap, tri.c, state)) {
        triMap[tri.c.GetHashCode()] = list = new Array<MeshTriangle>()
      } else if (Array.isArray(state.passThrough)) {
        list = state.passThrough
      }

      list.push(tri)
    }

    let _verts: Array<string> = []
    let _normals: Array<Vector3D> = new Array<Vector3D>()

    for (let kvp in vertMap) {
      let v: string = kvp //VertMap key
      _verts.push(v)
      let normal: Vector3D = Vector3D.construct()
      let tris: Array<MeshTriangle> = triMap[v]

      for (let tri of tris) {
        normal = Vector3D.Add(normal, tri.Normal)
      }

      normal = Vector3D.Divide(normal, tris.length);

      _normals.push(normal)
    }

    faces = new Array<Array<number>>()
    for (let tri of this.MeshTriangles) {
      faces.push([vertMap[tri.a.GetHashCode()], vertMap[tri.b.GetHashCode()], vertMap[tri.c.GetHashCode()]])
    }
  }

  Clone(): Mesh {
    let clone: Mesh = new Mesh()
    // clone.MeshTriangles = this.MeshTriangles.Select(t => t, t)
    return clone
  }

  // Scale our mesh (useful for shapeways models)

  Scale(scale: number) {
    for (let i: number = 0; i < this.MeshTriangles.length; i++) {
      this.MeshTriangles[i] = new MeshTriangle(
        Vector3D.MultiplyVectorByNumber(this.MeshTriangles[i].a, scale),
        Vector3D.MultiplyVectorByNumber(this.MeshTriangles[i].b, scale),
        Vector3D.MultiplyVectorByNumber(this.MeshTriangles[i].c, scale),
      )
    }
  }

  Rotate(angle: number) {
    for (let i: number = 0; i < this.MeshTriangles.length; i++) {
      let a: Vector3D = this.MeshTriangles[i].a
      let b: Vector3D = this.MeshTriangles[i].b
      let c: Vector3D = this.MeshTriangles[i].c
      a.RotateXY(angle)
      b.RotateXY(angle)
      c.RotateXY(angle)
      this.MeshTriangles[i] = new MeshTriangle(a, b, c)
    }
  }

  // Transform our mesh by some arbitrary function.

  Transform(transform: System.Func<Vector3D, Vector3D>) {
    for (let i: number = 0; i < this.MeshTriangles.length; i++) {
      this.MeshTriangles[i] = new MeshTriangle(
        transform(this.MeshTriangles[i].a),
        transform(this.MeshTriangles[i].b),
        transform(this.MeshTriangles[i].c),
      )
    }
  }

  // Function to add one band
  // d1 and d2 are two pre-calc'd edges (often disks) of points.

  AddBand(
    d1: Array<Vector3D>,
    d2: Array<Vector3D>,
    close: boolean = true,
  ) {
    if (d1.length != d2.length) {
      throw new Error('Edges must have the same length.')
    }

    let end: number = d1.length
    if (!close) {
      end--
    }

    for (let i: number = 0; i < end; i++) {
      let idx1: number = i
      let idx2 = i == d1.length - 1 ? 0 : i + 1
      this.MeshTriangles.push(
        new MeshTriangle(d1[idx1], d2[idx1], d1[idx2]),
      )
      this.MeshTriangles.push(
        new MeshTriangle(d1[idx2], d2[idx1], d2[idx2]),
      )
    }
  }

  // Make an edge mesh of a regular tiling.

  static MakeEdgeMesh(p: number, q: number): Mesh {
    let mesh: Mesh = new Mesh()
    let maxTiles: number = 400
    let config: TilingConfig = new TilingConfig(
      p,
      q,
      /* maxTiles:*/ maxTiles,
    )
    config.Shrink = 0.6
    let tiling: Tiling = new Tiling(config)
    tiling.GenerateInternal(config)
    let boundaryConfig: TilingConfig = new TilingConfig(
      14,
      7,
      /* maxTiles:*/ 1,
    )
    boundaryConfig.Shrink = 1.01
    let boundary: Tile = Tiling.CreateBaseTile(boundaryConfig)
    Mesh.AddSymmetryMeshTriangles(mesh, tiling, boundary.Drawn)
    // AddSymmetryMeshTriangles( mesh, tiling, null );
    return mesh
  }



  static #Shrink(p: Vector3D, centroid: Vector3D): Vector3D {
    let temp: Vector3D = Vector3D.Subtract(p, centroid)
    temp.Normalize()
    p = Vector3D.Add(p, Vector3D.MultiplyNumberByVector(temp, 0.001))
    return p
  }

  static AddSymmetryMeshTriangles(
    mesh: Mesh,
    tiling: Tiling,
    boundary: Polygon,
  ) {
    //  Assume template centered at the origin.
    let template: Polygon = tiling.Tiles.First().Boundary
    let templateTris: Array<MeshTriangle> = new Array<MeshTriangle>()
    for (let seg of template.Segments) {
      let num: number = 1 + <number>(seg.Length * this.m_divisions)
      let a: Vector3D = Vector3D.construct()
      let b: Vector3D = seg.P1
      let c: Vector3D = seg.Midpoint
      let centroid: Vector3D = Vector3D.Divide(Vector3D.Add(a, (Vector3D.Add(b, c))), 3)
      let poly: Polygon = new Polygon()
      let segA: Segment = Segment.Line(Vector3D.construct(), seg.P1)
      let segB: Segment = seg.Clone()
      segB.P2 = seg.Midpoint
      let segC: Segment = Segment.Line(
        seg.Midpoint,
        Vector3D.construct(),
      )
      poly.Segments.push(segA)
      poly.Segments.push(segB)
      poly.Segments.push(segC)
      let coords: Array<Vector3D> = TextureHelper.TextureCoords(
        poly,
        Geometry.Hyperbolic,
      )
      let elements: Array<number> = TextureHelper.TextureElements(
        3,
        /* LOD:*/ 3,
      )
      for (let i: number = 0; i < elements.length / 3; i++) {
        let idx1: number = i * 3
        let idx2: number = i * 3 + 1
        let idx3: number = i * 3 + 2
        let v1: Vector3D = coords[elements[idx1]]
        let v2: Vector3D = coords[elements[idx2]]
        let v3: Vector3D = coords[elements[idx3]]
        templateTris.push(new MeshTriangle(v1, v2, v3))
      }
    }

    for (let tile of tiling.Tiles) {
      let a: Vector3D = tile.Boundary.Segments[0].P1
      let b: Vector3D = tile.Boundary.Segments[1].P1
      let c: Vector3D = tile.Boundary.Segments[2].P1
      let m: Mobius = Mobius.construct()
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

      for (let tri of templateTris) {
        let transformed: MeshTriangle = new MeshTriangle(
          m.Apply(tri.a),
          m.Apply(tri.b),
          m.Apply(tri.c),
        )
        Mesh.CheckAndAdd(mesh, transformed, boundary)
      }
    }
  }

  static MeshEdges(
    mesh: Mesh,
    tile: Tile,
    completed: Array<Vector3D>,
    boundary: Polygon,
  ) {
    for (let i: number = 0; i < tile.Boundary.Segments.length; i++) {
      let boundarySeg: Segment = tile.Boundary.Segments[i]
      let d1: Segment = tile.Drawn.Segments[i]
      if (completed.includes(boundarySeg.Midpoint)) {
        continue
      }

      //  Find the incident segment.
      let d2: Segment = null as unknown as Segment
      let seg2: Segment = null as unknown as Segment
      
      for (let incident of tile.EdgeIncidences) {
        for (
          let j: number = 0;
          j < incident.Boundary.Segments.length;
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
          new MeshTriangle(boundarySeg.P1, d1.P1, d2.P1),
          boundary,
        )
        Mesh.CheckAndAdd(
          mesh,
          new MeshTriangle(boundarySeg.P2, d2.P2, d1.P2),
          boundary,
        )
      }

      let num: number = 1 + <number>(d1.Length * this.m_divisions)
      let list1: Array<Vector3D> = d1.Subdivide(num)
      let list2: Array<Vector3D> = d2.Subdivide(num)
      for (let j: number = 0; j < num; j++) {
        Mesh.CheckAndAdd(
          mesh,
          new MeshTriangle(list1[j], list1[j + 1], list2[j + 1]),
          boundary,
        )
        Mesh.CheckAndAdd(
          mesh,
          new MeshTriangle(list2[j], list1[j], list2[j + 1]),
          boundary,
        )
      }

      completed.push(boundarySeg.Midpoint)
    }
  }

  static Check(tri: MeshTriangle, boundary: Polygon): boolean {
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

  static CheckAndAdd(mesh: Mesh, tri: MeshTriangle, boundary: Polygon) {
    if (Mesh.Check(tri, boundary)) {
      mesh.MeshTriangles.push(tri)
    }
  }
}
