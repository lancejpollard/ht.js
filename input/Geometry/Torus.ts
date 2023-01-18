import Math = System.Math;
import System.Diagnostics;
import System.Drawing;

module R3.Geometry {
    
    ///  <summary>
    ///  Class to generate tori on a 3-sphere
    ///  </summary>
    export class Torus {
        
        ///  <summary>
        ///  The things that define us.
        ///  </summary>
        export class Parameters {
            
            public constructor () {
                NumSegments2 = 50;
                NumSegments1 = 50;
                TubeRadius1 = 0.5;
                Radius = 1;
            }
            
            ///  <summary>
            ///  The number of segments to generate in the first direction of the torus surface.
            ///  </summary>
            public get NumSegments1(): number {
            }
            public set NumSegments1(value: number)  {
            }
            
            ///  <summary>
            ///  The number of segments to generate in the second direction of the torus surface.
            ///  </summary>
            public get NumSegments2(): number {
            }
            public set NumSegments2(value: number)  {
            }
            
            ///  <summary>
            ///  The first tube radius of our torus.  
            ///  NOTES: 
            ///         - The second tube radius is determined by this and the 3-sphere radius.
            ///         - This radius must be less than or equal the 3-sphere radius
            ///         - If equal 0 or equal to the 3-sphere radius, one tube will be empty (torus will be a line).
            ///  </summary>
            public get TubeRadius1(): number {
            }
            public set TubeRadius1(value: number)  {
            }
            
            ///  <summary>
            ///  The radius of our 3-sphere
            ///  </summary>
            public get Radius(): number {
            }
            public set Radius(value: number)  {
            }
        }
        
        public get Params(): Parameters {
        }
        public set Params(value: Parameters)  {
        }
        
        ///  <summary>
        ///  Our vertices.
        ///  NOTE: Not realy a Vector3D here (need to rename my class).
        ///  </summary>
        public get Vertices(): Vector3D[,] {
        }
        public set Vertices(value: Vector3D[,])  {
        }
        
        ///  <summary>
        ///  Size our Vertices matrix.
        ///  </summary>
        private InitVerts() {
            let n1: number = this.Params.NumSegments1;
            let n2: number = this.Params.NumSegments2;
            this.Vertices = new Array(n1);
            for (let i: number = 0; (i < n1); i++) {
                this.Vertices[i] = new Array(n2);
            }
            
        }
        
        ///  <summary>
        ///  Special case of CreateTorus for the Clifford Torus.
        ///  </summary>
        public static CreateClifford(parameters: Parameters): Torus {
            parameters.TubeRadius1 = (parameters.Radius / 2);
            return Torus.CreateTorus(parameters);
        }
        
        ///  <summary>
        ///  Calculates a torus which divides the 3-sphere in two.
        ///  </summary>
        public static CreateTorus(parameters: Parameters): Torus {
            let t: Torus = new Torus();
            t.Params = parameters;
            t.InitVerts();
            //  Shorter var names for inputs.
            let n1: number = parameters.NumSegments1;
            let n2: number = parameters.NumSegments2;
            let r: number = parameters.Radius;
            let r1: number = parameters.TubeRadius1;
            //  Calc r2.
            let r2: number = (r - r1);
            if ((r2 < 0)) {
                r2 = 0;
            }
            
            r1 = (r1 * Math.Sqrt(2));
            r2 = (r2 * Math.Sqrt(2));
            let angleInc1: number = (2 
                        * (Math.PI / n1));
            let angleInc2: number = (2 
                        * (Math.PI / n2));
            let angle1: number = 0;
            for (let i: number = 0; (i < n1); i++) {
                let angle2: number = 0;
                for (let j: number = 0; (j < n2); j++) {
                    t.Vertices[i][j].X = (r1 * Math.Cos(angle1));
                    t.Vertices[i][j].Y = (r1 * Math.Sin(angle1));
                    t.Vertices[i][j].Z = (r2 * Math.Cos(angle2));
                    t.Vertices[i][j].W = (r2 * Math.Sin(angle2));
                    angle2 = (angle2 + angleInc2);
                }
                
                angle1 = (angle1 + angleInc1);
            }
            
            return t;
        }
    }
}