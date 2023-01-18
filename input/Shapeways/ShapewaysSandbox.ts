import R3.Core;
import R3.Drawing;
import System.Collections.Generic;
import System.Linq;
import Math = System.Math;

module R3.Geometry {
    
    export class ShapewaysSandbox {
        
        public static GenPolyhedron() {
            let tiling: Tiling;
            let p: number = 3;
            let q: number = 6;
            ShapewaysSandbox.GetAssociatedTiling(p, q, 5000, /* out */tiling);
            let overallScale: number = 12.5;
            //  2.5 cm = 1 in diameter
            let mesh: Shapeways = new Shapeways();
            for (let tile: Tile in tiling.Tiles) {
                for (let seg: Segment in tile.Boundary.Segments) {
                    let tilingScale: number = 0.75;
                    seg.Scale(new Vector3D(), tilingScale);
                    let v1: Vector3D = Sterographic.PlaneToSphereSafe(seg.P1);
                    let v2: Vector3D = Sterographic.PlaneToSphereSafe(seg.P2);
                    // if( v1.Dist( v2 ) < 0.01 )
                    //     continue;
                    if (((SphericalCoords.CartesianToSpherical(v1).Y 
                                < (Math.PI / 12)) 
                                && (SphericalCoords.CartesianToSpherical(v2).Y 
                                < (Math.PI / 12)))) {
                        // TODO: Warning!!! continue If
                    }
                    
                    let dist: number = v1.Dist(v2);
                    let divisions: number = (2 + (<number>((dist * 20))));
                    let points: Vector3D[] = seg.Subdivide(divisions);
                    points = points.Select(() => {  }, Sterographic.PlaneToSphereSafe(v)).ToArray();
                    mesh.AddCurve(points, () => {  }, ShapewaysSandbox.SizeFunc(v, overallScale));
                }
                
            }
            
            mesh.Mesh.Scale(overallScale);
            let outputFileName: string = ("d:\temp\" 
                        + (p 
                        + (q + ".stl")));
            STL.SaveMeshToSTL(mesh.Mesh, outputFileName);
        }
        
        private static GetAssociatedTiling(p: number, q: number, maxTiles: number, /* out */tiling: Tiling) {
            let tilingConfig: TilingConfig = new TilingConfig(p, q, /* maxTiles:*/ maxTiles);
            tiling = new Tiling();
            tiling.GenerateInternal(tilingConfig, Polytope.Projection.VertexCentered);
            // TODO: Warning!!!, inline IF is not supported ?
            (p == 6);
            Polytope.Projection.FaceCentered;
        }
        
        private static SizeFunc(v: Vector3D, overallScale: number): number {
            // return .6 / 2 / overallScale;
            //  Silver min wall is 0.6
            //  Silver min wire is 0.8 (supported) or 1.0 (unsupported).
            let min: number = (0.55 / 2);
            let max: number = (1.5 / 2);
            //  for caps
            // double min = 0.71 / 2;
            // double max = 0.5 / 2;    // 36
            // double max = 0.35 / 2; // 63
            let s: Vector3D = SphericalCoords.CartesianToSpherical(v);
            let angle: number = (s.Y / Math.PI);
            //  angle 0 to 1
            let result: number = (min 
                        + ((max - min) 
                        * angle));
            return (result / overallScale);
        }
        
        public static GenCapWithHole() {
            let mesh: Shapeways = new Shapeways();
            let overallScale: number = 12.5;
            //  2.5 cm = 1 in diameter
            //  Make hole 2 mm
            let startAngle: number = Math.Asin((2 / (2 / overallScale)));
            let endAngle: number = (Math.PI / 8);
            //  Slightly larger than hole above.
            let div: number = 75;
            let angleInc: number = ((endAngle - startAngle) 
                        / div);
            for (let i: number = 0; (i < div); i++) {
                let angle1: number = (startAngle 
                            + (angleInc * i));
                let angle2: number = (startAngle 
                            + (angleInc 
                            * (i + 1)));
                let s2: Vector3D = new Vector3D(0, 0, 1);
                let s1: Vector3D = new Vector3D(0, 0, 1);
                s1.RotateAboutAxis(new Vector3D(0, 1, 0), angle1);
                s2.RotateAboutAxis(new Vector3D(0, 1, 0), angle2);
                let p1: Vector3D = (s1 * (1 + ShapewaysSandbox.SizeFunc(s1, overallScale)));
                let p2: Vector3D = (s2 * (1 + ShapewaysSandbox.SizeFunc(s2, overallScale)));
                let n1: Vector3D = (s1 * (1 - ShapewaysSandbox.SizeFunc(s1, overallScale)));
                let n2: Vector3D = (s2 * (1 - ShapewaysSandbox.SizeFunc(s2, overallScale)));
                let pointsP1: List<Vector3D> = new List<Vector3D>();
                let pointsP2: List<Vector3D> = new List<Vector3D>();
                let pointsN1: List<Vector3D> = new List<Vector3D>();
                let pointsN2: List<Vector3D> = new List<Vector3D>();
                for (let j: number = 0; (j < div); j++) {
                    pointsP1.Add(p1);
                    pointsP2.Add(p2);
                    pointsN1.Add(n1);
                    pointsN2.Add(n2);
                    p1.RotateAboutAxis(new Vector3D(0, 0, 1), (2 
                                    * (Math.PI / div)));
                    p2.RotateAboutAxis(new Vector3D(0, 0, 1), (2 
                                    * (Math.PI / div)));
                    n1.RotateAboutAxis(new Vector3D(0, 0, 1), (2 
                                    * (Math.PI / div)));
                    n2.RotateAboutAxis(new Vector3D(0, 0, 1), (2 
                                    * (Math.PI / div)));
                }
                
                mesh.AddSegment(pointsP1.ToArray(), pointsP2.ToArray());
                mesh.AddSegment(pointsN2.ToArray(), pointsN1.ToArray());
                if ((i == 0)) {
                    mesh.AddSegment(pointsN1.ToArray(), pointsP1.ToArray());
                }
                
                if ((i 
                            == (div - 1))) {
                    mesh.AddSegment(pointsP2.ToArray(), pointsN2.ToArray());
                }
                
            }
            
            mesh.Mesh.Scale(overallScale);
            let outputFileName: string = "d:\temp\cap_with_hole.stl";
            STL.SaveMeshToSTL(mesh.Mesh, outputFileName);
        }
        
        public static GenCap() {
            let overallScale: number = 12.5;
            //  2.5 cm = 1 in diameter
            let start: Vector3D = new Vector3D(0, 0, 1);
            start.RotateAboutAxis(new Vector3D(0, 1, 0), (Math.PI / 11.5));
            //  Slightly larger than hole above.
            let circlePoints: List<Vector3D> = new List<Vector3D>();
            let div: number = 30;
            for (let i: number = 0; (i < div); i++) {
                circlePoints.Add(start);
                start.RotateAboutAxis(new Vector3D(0, 0, 1), (2 
                                * (Math.PI / div)));
            }
            
            let poly: Polygon = Polygon.FromPoints(circlePoints.ToArray());
            let texCoords: Vector3D[] = TextureHelper.TextureCoords(poly, Geometry.Euclidean);
            let elements: number[] = TextureHelper.TextureElements(poly.NumSides, /* LOD:*/ 3);
            let mesh: Shapeways = new Shapeways();
            for (let i: number = 0; (i 
                        < (elements.Length / 3)); i++) {
                let idx1: number = (i * 3);
                let idx2: number = ((i * 3) 
                            + 1);
                let idx3: number = ((i * 3) 
                            + 2);
                let v1: Vector3D = texCoords[elements[idx1]];
                let v2: Vector3D = texCoords[elements[idx2]];
                let v3: Vector3D = texCoords[elements[idx3]];
                v1.Normalize();
                v2.Normalize();
                v3.Normalize();
                let v1p: Vector3D = (v1 * (1 + ShapewaysSandbox.SizeFunc(v1, overallScale)));
                let v2p: Vector3D = (v2 * (1 + ShapewaysSandbox.SizeFunc(v2, overallScale)));
                let v3p: Vector3D = (v3 * (1 + ShapewaysSandbox.SizeFunc(v3, overallScale)));
                let v1n: Vector3D = (v1 * (1 - ShapewaysSandbox.SizeFunc(v1, overallScale)));
                let v2n: Vector3D = (v2 * (1 - ShapewaysSandbox.SizeFunc(v2, overallScale)));
                let v3n: Vector3D = (v3 * (1 - ShapewaysSandbox.SizeFunc(v3, overallScale)));
                mesh.Mesh.Triangles.Add(new Mesh.Triangle(v1p, v2p, v3p));
                mesh.Mesh.Triangles.Add(new Mesh.Triangle(v1n, v3n, v2n));
                //  To make it manifold.
                //  64 elements per seg.
                let relativeToSeg: number = (i % 64);
                if ((relativeToSeg < 8)) {
                    mesh.Mesh.Triangles.Add(new Mesh.Triangle(v1p, v1n, v2p));
                    mesh.Mesh.Triangles.Add(new Mesh.Triangle(v2p, v1n, v2n));
                }
                
            }
            
            mesh.Mesh.Scale(overallScale);
            let outputFileName: string = "d:\temp\cap.stl";
            STL.SaveMeshToSTL(mesh.Mesh, outputFileName);
        }
    }
}