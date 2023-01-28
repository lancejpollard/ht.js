import { GraphEdge } from '@Math/Graph'
import { Matrix4D } from '@Math/Matrix4D'
import { Tolerance } from '@Math/Utils'
import { Polygon } from '../src/Geometry/Polygon'
import { Vector3D } from '../src/Geometry/Vector3D'

export class SkewPolyhedron {
  static BuildDuoprism(num: number): Array<Polygon> {
    let angleInc: number = 2 * (Math.PI / num)
    //  Torus in two directions.
    let polys: Array<Polygon> = new Array<Polygon>()
    let angle1: number = angleInc / 2
    for (let i: number = 0; i < num; i++) {
      let angle2: number = angleInc / 2
      for (let j: number = 0; j < num; j++) {
        let polyPoints: Array<Vector3D> = new Array<Vector3D>()
        polyPoints.push(
          Vector3D.construct4d(
            Math.cos(angle2),
            Math.sin(angle2),
            Math.cos(angle1),
            Math.sin(angle1),
          ),
        )
        polyPoints.push(
          Vector3D.construct4d(
            Math.cos(angle2),
            Math.sin(angle2),
            Math.cos(angle1 + angleInc),
            Math.sin(angle1 + angleInc),
          ),
        )
        polyPoints.push(
          Vector3D.construct4d(
            Math.cos(angle2 + angleInc),
            Math.sin(angle2 + angleInc),
            Math.cos(angle1 + angleInc),
            Math.sin(angle1 + angleInc),
          ),
        )
        polyPoints.push(
          Vector3D.construct4d(
            Math.cos(angle2 + angleInc),
            Math.sin(angle2 + angleInc),
            Math.cos(angle1),
            Math.sin(angle1),
          ),
        )
        let poly: Polygon = new Polygon()
        poly.CreateEuclidean(polyPoints)
        polys.push(poly)
        angle2 = angle2 + angleInc
      }

      angle1 = angle1 + angleInc
    }

    //  Nice starting orientation.
    let m1: Matrix4D = Matrix4D.MatrixToRotateinCoordinatePlane(
      Math.PI / 8,
      0,
      2,
    )
    let m2: Matrix4D = Matrix4D.MatrixToRotateinCoordinatePlane(
      (Math.PI / 4) * -1,
      1,
      2,
    )
    for (let poly of polys) {
      poly.Rotate(m1)
      poly.Rotate(m2)
    }

    return polys
  }

  static BuildBitruncated5Cell(): Array<Polygon> {
    let a: number = 5 / Math.sqrt(10)
    let b: number = 1 / Math.sqrt(6)
    let c: number = 1 / Math.sqrt(3)
    let d: number = 3 / Math.sqrt(3)
    //  http://eusebeia.dyndns.org/4d/bitrunc5cell
    let coords: Array<Vector3D> = [
      Vector3D.construct4d(0, 4 * b, 4 * c, 0),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(0, 4 * b, 4 * c, 0), -1),
      Vector3D.construct4d(0, 4 * b, 2 * c * -1, 2),
      Vector3D.construct4d(0, 4 * b, 2 * c * -1, -2),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(0, 4 * b, 2 * c * -1, 2), -1),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(0, 4 * b, 2 * c * -1, -2), -1),
      Vector3D.construct4d(a, b, 4 * c, 0),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(a, b, 4 * c, 0), -1),
      Vector3D.construct4d(a, b, 2 * c * -1, 2),
      Vector3D.construct4d(a, b, 2 * c * -1, -2),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(a, b, 2 * c * -1, 2), -1),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(a, b, 2 * c * -1, -2), -1),
      Vector3D.construct4d(a, 5 * b, 2 * c, 0),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(a, 5 * b, 2 * c, 0), -1),
      Vector3D.construct4d(a, 5 * b, c * -1, 1),
      Vector3D.construct4d(a, 5 * b, c * -1, -1),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(a, 5 * b, c * -1, 1), -1),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(a, 5 * b, c * -1, -1), -1),
      Vector3D.construct4d(a, 3 * b * -1, 0, 2),
      Vector3D.construct4d(a, 3 * b * -1, 0, -2),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(a, 3 * b * -1, 0, 2), -1),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(a, 3 * b * -1, 0, -2), -1),
      Vector3D.construct4d(a, 3 * b * -1, d, 1),
      Vector3D.construct4d(a, 3 * b * -1, d * -1, 1),
      Vector3D.construct4d(a, 3 * b * -1, d, -1),
      Vector3D.construct4d(a, 3 * b * -1, d * -1, -1),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(a, 3 * b * -1, d, 1), -1),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(a, 3 * b * -1, d * -1, 1), -1),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(a, 3 * b * -1, d, -1), -1),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(a, 3 * b * -1, d * -1, -1), -1),
    ]
    let result: Array<Polygon> = this.LookForPolys(coords, 2, 6)
    //  Nice starting orientation.
    let m: Matrix4D = new Matrix4D()
    m.Data = [
      [0.23, -0.72, 0.6, 0.26],
      [-0.02, 0.38, 0.72, -0.59],
      [0.97, 0.22, -0.11, -0.03],
      [0.06, -0.54, -0.34, -0.77],
    ]

    m = Matrix4D.GramSchmidt(m)
    for (let poly of result) {
      poly.Rotate(m)
    }

    return result
  }

  static BuildRuncinated5Cell(): Array<Polygon> {
    //  http://eusebeia.dyndns.org/4d/runci5cell
    let coords: Array<Vector3D> = [
      Vector3D.construct4d(0, 0, 0, 2),
      Vector3D.construct4d(0, 0, 0, -2),
      Vector3D.construct4d(0, 0, 3 / Math.sqrt(3), 1),
      Vector3D.construct4d(0, 0, (3 / Math.sqrt(3)) * -1, 1),
      Vector3D.construct4d(0, 0, (3 / Math.sqrt(3)) * -1, -1),
      Vector3D.construct4d(0, 0, 3 / Math.sqrt(3), -1),
      Vector3D.construct4d(
        0,
        4 / Math.sqrt(6),
        (2 / Math.sqrt(3)) * -1,
        0,
      ),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(
        0,
        4 / Math.sqrt(6),
        (2 / Math.sqrt(3)) * -1,
        0,
      ), -1),
      Vector3D.construct4d(0, 4 / Math.sqrt(6), 1 / Math.sqrt(3), 1),
      Vector3D.construct4d(0, 4 / Math.sqrt(6), 1 / Math.sqrt(3), -1),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(
        0, 4 / Math.sqrt(6), 1 / Math.sqrt(3), 1
      ), -1)
      ,
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(
        0, 4 / Math.sqrt(6), 1 / Math.sqrt(3), -1
      ), -1)
      ,
      Vector3D.construct4d(
        5 / Math.sqrt(10),
        (3 / Math.sqrt(6)) * -1,
        0,
        0,
      ),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(
        5 / Math.sqrt(10),
        (3 / Math.sqrt(6)) * -1,
        0,
        0,
      ), -1),
      Vector3D.construct4d(
        5 / Math.sqrt(10),
        1 / Math.sqrt(6),
        (2 / Math.sqrt(3)) * -1,
        0,
      ),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(
        5 / Math.sqrt(10),
        1 / Math.sqrt(6),
        (2 / Math.sqrt(3)) * -1,
        0,
      ), -1),
      Vector3D.construct4d(
        5 / Math.sqrt(10),
        1 / Math.sqrt(6),
        1 / Math.sqrt(3),
        1,
      ),
      Vector3D.construct4d(
        5 / Math.sqrt(10),
        1 / Math.sqrt(6),
        1 / Math.sqrt(3),
        -1,
      ),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(
        5 / Math.sqrt(10),
        1 / Math.sqrt(6),
        1 / Math.sqrt(3),
        1,
      ), -1),
      Vector3D.MultiplyVectorByNumber(Vector3D.construct4d(
        5 / Math.sqrt(10),
        1 / Math.sqrt(6),
        1 / Math.sqrt(3),
        -1,
      ), -1),
    ]

    let result: Array<Polygon> = this.LookForPolys(coords, 2, 4)
    //  Nice starting orientation.
    let m: Matrix4D = new Matrix4D()
    m.Data = [
      [0.62, -0.66, -0.07, -0.41],
      [0.68, 0.22, 0.3, 0.64],
      [-0.08, 0.04, 0.93, -0.36],
      [-0.37, -0.72, 0.21, 0.54]]

    m = Matrix4D.GramSchmidt(m)
    for (let poly of result) {
      poly.Rotate(m)
    }

    return result
  }

  static LookForPolys(
    coords: Array<Vector3D>,
    edgeLength: number,
    p: number,
  ): Array<Polygon> {
    let lookup: Record<number, Array<GraphEdge>> = {}
    for (let i: number = 0; i < coords.length; i++) {
      lookup[i] = new Array<GraphEdge>()
    }

    //  First find all the edges.
    let allEdges: Array<GraphEdge> = new Array<GraphEdge>()
    for (let i: number = 0; i < coords.length; i++) {
      for (let j: number = i + 1; j < coords.length; j++) {
        if (Tolerance.Equal(coords[i].Dist(coords[j]), edgeLength)) {
          let e: GraphEdge = new GraphEdge(i, j)
          allEdges.push(e)
          lookup[i] = e
          lookup[j] = e
        }
      }
    }

    //  Find all cycles of length p.
    let cycles: Array<Array<number>> = new Array<Array<number>>()
    for (let i: number = 0; i < coords.length; i++) {
      cycles.push(new Array<number>(i))
    }

    cycles = SkewPolyhedron.FindCyclesRecursive(cycles, p, lookup)
    //  Find the distinct ones.
    for (let cycle of cycles) {
      //  Don't include the start vertex.
      //  This is important for the Distinct check below.
      cycle.splice(cycle.length - 1, 1)
    }

    cycles = cycles.Distinct(new CycleEqualityComparer())
    //  Now turn into polygons.
    let result: Array<Polygon> = new Array<Polygon>()
    for (let cycle of cycles) {
      let points: Array<Vector3D> = new Array<Vector3D>()
      for (let i in cycle) {
        points.push(coords[i])
      }

      //  Normalize vertices to hypersphere.
      for (let i: number = 0; i < points.length; i++) {
        let normalized: Vector3D = points[i]
        normalized.Normalize()
        points[i] = normalized
      }

      let poly: Polygon = Polygon.FromPoints(points)
      //  Only add if coplanar.
      //  Assume our polygons are regular and even-sized,
      //  in which case we can do a hackish check here.
      //  ZZZ - improve hack.
      if (points.length > 3) {
        let coplanar: boolean = true
        let toCenter: number = points[0].Dist(poly.Center)
        if (
          !Tolerance.Equal(points[p / 2].Dist(points[0]), toCenter * 2)
        ) {
          coplanar = false
        }

        if (!coplanar) {
          continue
        }
      }

      result.push(poly)
    }

    return result
  }

  // This might end up being useful if we need to optimize.
  // http://mathoverflow.net/questions/67960/cycle-of-length-4-in-an-undirected-graph

  static FindCyclesRecursive(
    cycles: Array<Array<number>>,
    cycleLength: number,
    lookup: Record<number, Array<GraphEdge>>,
  ): Array<Array<number>> {
    if (cycles[0].length - 1 == cycleLength) {
      //  Return the ones where we ended where we started.
      let result: Array<Array<number>> = cycles.Where(
        c => c.First() == c.Last(),
      )

      return result
    }

    let newCycles: Array<Array<number>> = new Array<Array<number>>()
    for (let cycle of cycles) {

      let last: number = cycle[cycle.length - 1]

      for (let newEdge of lookup[last]) {
        let next: number = newEdge.Opposite(last)
        if (cycle.length != cycleLength && cycle.includes(next)) {
          continue
        }

        let newCycle: Array<number> = new Array<number>(...cycle)
        newCycle.push(next)
        newCycles.push(newCycle)
      }
    }

    return SkewPolyhedron.FindCyclesRecursive(
      newCycles,
      cycleLength,
      lookup,
    )
  }
}
