import System.Collections.Generic;
import System.Diagnostics;
import System.Linq;
import Math = System.Math;
import R3.Core;
import R3.Math;

module R3.Geometry {

    export class Polytope {

        //  The various projections we can do on a polytope.
        export enum Projection {

            CellCentered,

            FaceCentered,

            EdgeCentered,

            VertexCentered,
        }
    }

    export class SkewPolyhedron {

        public static BuildDuoprism(num: number): Polygon[] {
            let angleInc: number = (2
                        * (Math.PI / num));
            //  Torus in two directions.
            let polys: List<Polygon> = new List<Polygon>();
            let angle1: number = (angleInc / 2);
            for (let i: number = 0; (i < num); i++) {
                let angle2: number = (angleInc / 2);
                for (let j: number = 0; (j < num); j++) {
                    let polyPoints: List<Vector3D> = new List<Vector3D>();
                    polyPoints.Add(new Vector3D(Math.Cos(angle2), Math.Sin(angle2), Math.Cos(angle1), Math.Sin(angle1)));
                    polyPoints.Add(new Vector3D(Math.Cos(angle2), Math.Sin(angle2), Math.Cos((angle1 + angleInc)), Math.Sin((angle1 + angleInc))));
                    polyPoints.Add(new Vector3D(Math.Cos((angle2 + angleInc)), Math.Sin((angle2 + angleInc)), Math.Cos((angle1 + angleInc)), Math.Sin((angle1 + angleInc))));
                    polyPoints.Add(new Vector3D(Math.Cos((angle2 + angleInc)), Math.Sin((angle2 + angleInc)), Math.Cos(angle1), Math.Sin(angle1)));
                    let poly: Polygon = new Polygon();
                    poly.CreateEuclidean(polyPoints.ToArray());
                    polys.Add(poly);
                    angle2 = (angle2 + angleInc);
                }

                angle1 = (angle1 + angleInc);
            }

            //  Nice starting orientation.
            let m1: Matrix4D = Matrix4D.MatrixToRotateinCoordinatePlane((Math.PI / 8), 0, 2);
            let m2: Matrix4D = Matrix4D.MatrixToRotateinCoordinatePlane(((Math.PI / 4)
                            * -1), 1, 2);
            for (let poly: Polygon in polys) {
                poly.Rotate(m1);
                poly.Rotate(m2);
            }

            return polys.ToArray();
        }

        public static BuildBitruncated5Cell(): Polygon[] {
            let a: number = (5 / Math.Sqrt(10));
            let b: number = (1 / Math.Sqrt(6));
            let c: number = (1 / Math.Sqrt(3));
            let d: number = (3 / Math.Sqrt(3));
            //  http://eusebeia.dyndns.org/4d/bitrunc5cell
            let coords: Vector3D[] = [
                    new Vector3D(0, (4 * b), (4 * c), 0),
                    (new Vector3D(0, (4 * b), (4 * c), 0) * -1),
                    new Vector3D(0, (4 * b), ((2 * c)
                                    * -1), 2),
                    new Vector3D(0, (4 * b), ((2 * c)
                                    * -1), -2),
                    (new Vector3D(0, (4 * b), ((2 * c)
                                    * -1), 2) * -1),
                    (new Vector3D(0, (4 * b), ((2 * c)
                                    * -1), -2) * -1),
                    new Vector3D(a, b, (4 * c), 0),
                    (new Vector3D(a, b, (4 * c), 0) * -1),
                    new Vector3D(a, b, ((2 * c)
                                    * -1), 2),
                    new Vector3D(a, b, ((2 * c)
                                    * -1), -2),
                    (new Vector3D(a, b, ((2 * c)
                                    * -1), 2) * -1),
                    (new Vector3D(a, b, ((2 * c)
                                    * -1), -2) * -1),
                    new Vector3D(a, (5 * b), (2 * c), 0),
                    (new Vector3D(a, (5 * b), (2 * c), 0) * -1),
                    new Vector3D(a, (5 * b), (c * -1), 1),
                    new Vector3D(a, (5 * b), (c * -1), -1),
                    (new Vector3D(a, (5 * b), (c * -1), 1) * -1),
                    (new Vector3D(a, (5 * b), (c * -1), -1) * -1),
                    new Vector3D(a, ((3 * b)
                                    * -1), 0, 2),
                    new Vector3D(a, ((3 * b)
                                    * -1), 0, -2),
                    (new Vector3D(a, ((3 * b)
                                    * -1), 0, 2) * -1),
                    (new Vector3D(a, ((3 * b)
                                    * -1), 0, -2) * -1),
                    new Vector3D(a, ((3 * b)
                                    * -1), d, 1),
                    new Vector3D(a, ((3 * b)
                                    * -1), (d * -1), 1),
                    new Vector3D(a, ((3 * b)
                                    * -1), d, -1),
                    new Vector3D(a, ((3 * b)
                                    * -1), (d * -1), -1),
                    (new Vector3D(a, ((3 * b)
                                    * -1), d, 1) * -1),
                    (new Vector3D(a, ((3 * b)
                                    * -1), (d * -1), 1) * -1),
                    (new Vector3D(a, ((3 * b)
                                    * -1), d, -1) * -1),
                    (new Vector3D(a, ((3 * b)
                                    * -1), (d * -1), -1) * -1)];
            let result: Polygon[] = LookForPolys(coords, 2, 6);
            //  Nice starting orientation.
            let m: Matrix4D = new Matrix4D();
            m.Data = [];
            [
                    0.23,
                    -0.72,
                    0.6,
                    0.26];
            [
                    -0.02,
                    0.38,
                    0.72,
                    -0.59];
            [
                    0.97,
                    0.22,
                    -0.11,
                    -0.03];
            [
                    0.06,
                    -0.54,
                    -0.34,
                    -0.77];

            m = Matrix4D.GramSchmidt(m);
            for (let poly: Polygon in result) {
                poly.Rotate(m);
            }

            return result;
        }

        public static BuildRuncinated5Cell(): Polygon[] {
            //  http://eusebeia.dyndns.org/4d/runci5cell
            let coords: Vector3D[] = [
                    new Vector3D(0, 0, 0, 2),
                    new Vector3D(0, 0, 0, -2),
                    new Vector3D(0, 0, (3 / Math.Sqrt(3)), 1),
                    new Vector3D(0, 0, ((3 / Math.Sqrt(3))
                                    * -1), 1),
                    new Vector3D(0, 0, ((3 / Math.Sqrt(3))
                                    * -1), -1),
                    new Vector3D(0, 0, (3 / Math.Sqrt(3)), -1),
                    new Vector3D(0, (4 / Math.Sqrt(6)), ((2 / Math.Sqrt(3))
                                    * -1), 0),
                    (new Vector3D(0, (4 / Math.Sqrt(6)), ((2 / Math.Sqrt(3))
                                    * -1), 0) * -1),
                    new Vector3D(0, (4 / Math.Sqrt(6)), (1 / Math.Sqrt(3)), 1),
                    new Vector3D(0, (4 / Math.Sqrt(6)), (1 / Math.Sqrt(3)), -1),
                    (new Vector3D(0, (4 / Math.Sqrt(6)), (1 / Math.Sqrt(3)), 1) * -1),
                    (new Vector3D(0, (4 / Math.Sqrt(6)), (1 / Math.Sqrt(3)), -1) * -1),
                    new Vector3D((5 / Math.Sqrt(10)), ((3 / Math.Sqrt(6))
                                    * -1), 0, 0),
                    (new Vector3D((5 / Math.Sqrt(10)), ((3 / Math.Sqrt(6))
                                    * -1), 0, 0) * -1),
                    new Vector3D((5 / Math.Sqrt(10)), (1 / Math.Sqrt(6)), ((2 / Math.Sqrt(3))
                                    * -1), 0),
                    (new Vector3D((5 / Math.Sqrt(10)), (1 / Math.Sqrt(6)), ((2 / Math.Sqrt(3))
                                    * -1), 0) * -1),
                    new Vector3D((5 / Math.Sqrt(10)), (1 / Math.Sqrt(6)), (1 / Math.Sqrt(3)), 1),
                    new Vector3D((5 / Math.Sqrt(10)), (1 / Math.Sqrt(6)), (1 / Math.Sqrt(3)), -1),
                    (new Vector3D((5 / Math.Sqrt(10)), (1 / Math.Sqrt(6)), (1 / Math.Sqrt(3)), 1) * -1),
                    (new Vector3D((5 / Math.Sqrt(10)), (1 / Math.Sqrt(6)), (1 / Math.Sqrt(3)), -1) * -1)];
            let result: Polygon[] = LookForPolys(coords, 2, 4);
            //  Nice starting orientation.
            let m: Matrix4D = new Matrix4D();
            m.Data = [];
            [
                    0.62,
                    -0.66,
                    -0.07,
                    -0.41];
            [
                    0.68,
                    0.22,
                    0.3,
                    0.64];
            [
                    -0.08,
                    0.04,
                    0.93,
                    -0.36];
            [
                    -0.37,
                    -0.72,
                    0.21,
                    0.54];

            m = Matrix4D.GramSchmidt(m);
            for (let poly: Polygon in result) {
                poly.Rotate(m);
            }

            return result;
        }

        private static LookForPolys(coords: Vector3D[], edgeLength: number, p: number): Polygon[] {
            let lookup: Record<number, List<GraphEdge>> = new Record<number, List<GraphEdge>>();
            for (let i: number = 0; (i < coords.Length); i++) {
                lookup[i] = new List<GraphEdge>();
            }

            //  First find all the edges.
            let allEdges: List<GraphEdge> = new List<GraphEdge>();
            for (let i: number = 0; (i < coords.Length); i++) {
                for (let j: number = (i + 1); (j < coords.Length); j++) {
                    if (Tolerance.Equal(coords[i].Dist(coords[j]), edgeLength)) {
                        let e: GraphEdge = new GraphEdge(i, j);
                        allEdges.Add(e);
                        lookup[i].Add(e);
                        lookup[j].Add(e);
                    }

                }

            }

            //  Find all cycles of length p.
            let cycles: List<List<number>> = new List<List<number>>();
            for (let i: number = 0; (i < coords.Length); i++) {
                cycles.Add(new List<number>([
                                i]));
            }

            cycles = SkewPolyhedron.FindCyclesRecursive(cycles, p, lookup);
            //  Find the distinct ones.
            for (let cycle: List<number> in cycles) {
                //  Don't include the start vertex.
                //  This is important for the Distinct check below.
                cycle.RemoveAt((cycle.Count - 1));
            }

            cycles = cycles.Distinct(new CycleEqualityComparer()).ToList();
            //  Now turn into polygons.
            let result: List<Polygon> = new List<Polygon>();
            for (let cycle: List<number> in cycles) {
                let points: List<Vector3D> = new List<Vector3D>();
                for (let i: number in cycle) {
                    points.Add(coords[i]);
                }

                //  Normalize vertices to hypersphere.
                for (let i: number = 0; (i < points.Count); i++) {
                    let normalized: Vector3D = points[i];
                    normalized.Normalize();
                    points[i] = normalized;
                }

                let poly: Polygon = Polygon.FromPoints(points.ToArray());
                //  Only add if coplanar.
                //  Assume our polygons are regular and even-sized,
                //  in which case we can do a hackish check here.
                //  ZZZ - improve hack.
                if ((points.Count > 3)) {
                    let coplanar: boolean = true;
                    let toCenter: number = points[0].Dist(poly.Center);
                    if (!Tolerance.Equal(points[(p / 2)].Dist(points[0]), (toCenter * 2))) {
                        coplanar = false;
                    }

                    if (!coplanar) {
                        // TODO: Warning!!! continue If
                    }

                }

                result.Add(poly);
            }

            return result.ToArray();
        }

        export class CycleEqualityComparer extends IEqualityComparer<List<number>> {

            public Equals(c1: List<number>, c2: List<number>): boolean {
                if ((c1.Count != c2.Count)) {
                    return false;
                }

                let sorted1: number[] = c1.OrderBy(() => {  }, i).ToArray();
                let sorted2: number[] = c2.OrderBy(() => {  }, i).ToArray();
                for (let i: number = 0; (i < sorted1.Length); i++) {
                    if ((sorted1[i] != sorted2[i])) {
                        return false;
                    }

                }

                return true;
            }

            public GetHashCode(cycle: List<number>): number {
                let hCode: number = 0;
                for (let idx: number in cycle) {
                    hCode = (hCode | idx.GetHashCode());
                }

                // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
                return hCode.GetHashCode();
            }
        }

        ///  <summary>
        ///  This might end up being useful if we need to optimize.
        ///  http://mathoverflow.net/questions/67960/cycle-of-length-4-in-an-undirected-graph
        ///  </summary>
        private static FindCyclesRecursive(cycles: List<List<number>>, cycleLength: number, lookup: Record<number, List<GraphEdge>>): List<List<number>> {
            if (((cycles[0].Count - 1)
                        == cycleLength)) {
                //  Return the ones where we ended where we started.
                let result: List<List<number>> = cycles.Where(() => {  }, (c.First() == c.Last())).ToList();
                return result;
            }

            let newCycles: List<List<number>> = new List<List<number>>();
            for (let cycle: List<number> in cycles) {
                let last: number = cycle.Last();
                for (let newEdge: GraphEdge in lookup[last]) {
                    let next: number = newEdge.Opposite(last);
                    if (((cycle.Count != cycleLength)
                                && cycle.Contains(next))) {
                        // TODO: Warning!!! continue If
                    }

                    let newCycle: List<number> = new List<number>(cycle);
                    newCycle.Add(next);
                    newCycles.Add(newCycle);
                }

            }

            return SkewPolyhedron.FindCyclesRecursive(newCycles, cycleLength, lookup);
        }
    }
}
