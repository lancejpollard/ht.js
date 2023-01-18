import R3.Core;
import System.Collections.Generic;
import System.Linq;
import Math = System.Math;

module R3.Geometry {

    ///  <summary>
    ///  This class generates H3 honeycombs via a fundamental region.
    ///  </summary>
    export class H3Fundamental {

        ///  <summary>
        ///  Class for the fundamental tetrahedron.
        ///  </summary>
        export class Tet {

            public constructor (center: Vector3D, face: Vector3D, edge: Vector3D, vertex: Vector3D) {
                Verts[0] = center;
                Verts[1] = face;
                Verts[2] = edge;
                Verts[3] = vertex;
                this.CalcFaces();
            }

            //  The order of these 4 vertices will be
            //  Center,Face,Edge,Vertex of the parent cell.
            public Verts: Vector3D[] = new Array(4);

            public get Faces(): Sphere[] {
                return m_faces;
            }

            private m_faces: Sphere[];

            private CalcFaces() {
                this.m_faces = [
                        H3Models.Ball.OrthogonalSphereInterior(this.Verts[0], this.Verts[1], this.Verts[2]),
                        H3Models.Ball.OrthogonalSphereInterior(this.Verts[0], this.Verts[3], this.Verts[1]),
                        H3Models.Ball.OrthogonalSphereInterior(this.Verts[0], this.Verts[2], this.Verts[3]),
                        H3Models.Ball.OrthogonalSphereInterior(this.Verts[1], this.Verts[3], this.Verts[2])];
            }

            public get ID(): Vector3D {
                let result: Vector3D = new Vector3D();
                for (let v: Vector3D in this.Verts) {
                    result = (result + v);
                }

                return result;
            }

            public Clone(): Tet {
                return new Tet(this.Verts[0], this.Verts[1], this.Verts[2], this.Verts[3]);
            }

            public Reflect(sphere: Sphere) {
                for (let i: number = 0; (i < 4); i++) {
                    this.Verts[i] = sphere.ReflectPoint(this.Verts[i]);
                }

                this.CalcFaces();
            }
        }

        export class TetEqualityComparer extends IEqualityComparer<Tet> {

            public Equals(t1: Tet, t2: Tet): boolean {
                return t1.ID.Compare(t2.ID, m_tolerance);
            }

            public GetHashCode(t: Tet): number {
                return t.ID.GetHashCode();
            }

            private m_tolerance: number = 0.0001;
        }

        public static Generate(honeycomb: EHoneycomb, settings: H3.Settings) {
            //  XXX - Block the same as in H3.  Share code better.
            let template: H3.Cell = null;
            let r: number;
            let p: number;
            let q: number;
            Honeycomb.PQR(honeycomb, /* out */p, /* out */q, /* out */r);
            //  Get data we need to generate the honeycomb.
            let projection: Polytope.Projection = Polytope.Projection.FaceCentered;
            let psi: number;
            let phi: number;
            let chi: number;
            H3.HoneycombData(honeycomb, /* out */phi, /* out */chi, /* out */psi);
            H3.SetupCentering(honeycomb, settings, phi, chi, psi, /* ref */projection);
            let tiling: Tiling = new Tiling();
            let config: TilingConfig = new TilingConfig(p, q);
            tiling.GenerateInternal(config, projection);
            let first: H3.Cell = new H3.Cell(p, H3.GenFacets(tiling));
            first.ToSphere();
            //  Work in ball model.
            first.ScaleToCircumSphere(1);
            first.ApplyMobius(settings.Mobius);
            template = first;
            //  Center
            let center: Vector3D = template.Center;
            //  Face
            let facet: H3.Cell.Facet = template.Facets[0];
            let s: Sphere = H3Models.Ball.OrthogonalSphereInterior(facet.Verts[0], facet.Verts[1], facet.Verts[2]);
            let face: Vector3D = s.Center;
            face.Normalize();
            face = (face * H3Fundamental.DistOriginToOrthogonalSphere(s.Radius));
            //  Edge
            let c: Circle3D;
            H3Models.Ball.OrthogonalCircleInterior(facet.Verts[0], facet.Verts[1], /* out */c);
            let edge: Vector3D = c.Center;
            edge.Normalize();
            edge = (edge * H3Fundamental.DistOriginToOrthogonalSphere(c.Radius));
            //  Vertex
            let vertex: Vector3D = facet.Verts[0];
            let fundamental: Tet = new Tet(center, face, edge, vertex);
            //  Recurse.
            let level: number = 1;
            let completedTets: Record<Tet, number> = new Record<Tet, number>(new TetEqualityComparer());
            completedTets.Add(fundamental, level);
            let tets: List<Tet> = new List<Tet>();
            tets.Add(fundamental);
            H3Fundamental.ReflectRecursive(level, tets, completedTets, settings);
            let mesh: Shapeways = new Shapeways();
            for (let kvp: KeyValuePair<Tet, number> in completedTets) {
                if (Utils.Odd(kvp.Value)) {
                    // TODO: Warning!!! continue If
                }

                let tet: Tet = kvp.Key;
                //  XXX - really want sphere surfaces here.
                mesh.Mesh.Triangles.Add(new Mesh.Triangle(tet.Verts[0], tet.Verts[1], tet.Verts[2]));
                mesh.Mesh.Triangles.Add(new Mesh.Triangle(tet.Verts[0], tet.Verts[3], tet.Verts[1]));
                mesh.Mesh.Triangles.Add(new Mesh.Triangle(tet.Verts[0], tet.Verts[2], tet.Verts[3]));
                mesh.Mesh.Triangles.Add(new Mesh.Triangle(tet.Verts[1], tet.Verts[3], tet.Verts[2]));
            }

            mesh.Mesh.Scale(settings.Scale);
            STL.SaveMeshToSTL(mesh.Mesh, (H3.m_baseDir + ("fundamental" + ".stl")));
        }

        private static DistOriginToOrthogonalSphere(r: number): number {
            //  http://mathworld.wolfram.com/OrthogonalCircles.html
            let d: number = Math.Sqrt((1
                            + (r * r)));
            return (d - r);
        }

        private static ReflectRecursive(level: number, tets: List<Tet>, completedTets: Record<Tet, number>, settings: H3.Settings) {
            //  Breadth first recursion.
            if ((0 == tets.Count)) {
                return;
            }

            level++;
            let reflected: List<Tet> = new List<Tet>();
            for (let tet: Tet in tets) {
                for (let facetSphere: Sphere in tet.Faces) {
                    if ((facetSphere == null)) {
                        throw new System.Exception("Unexpected.");
                    }

                    if ((completedTets.Count > settings.MaxCells)) {
                        return;
                    }

                    let newTet: Tet = tet.Clone();
                    newTet.Reflect(facetSphere);
                    if ((completedTets.Keys.Contains(newTet)
                                || !H3Fundamental.TetOk(newTet))) {
                        // TODO: Warning!!! continue If
                    }

                    reflected.Add(newTet);
                    completedTets.Add(newTet, level);
                }

            }

            H3Fundamental.ReflectRecursive(level, reflected, completedTets, settings);
        }

        private static TetOk(tet: Tet): boolean {
            let cutoff: number = 0.95;
            for (let v: Vector3D in tet.Verts) {
                if ((Tolerance.GreaterThan(v.Z, 0)
                            || (v.Abs() > cutoff))) {
                    return false;
                }

            }

            return true;
        }
    }
}
