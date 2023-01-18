import R3.Geometry;
import System.Collections.Generic;
import System.Diagnostics;
import System.Globalization;
import System.IO;
import System.Linq;
import System.Xml.Linq;

module R3.Core {

    export class VRMLInfo {

        //  ZZZ - This should be a map of exposed fields, not strongly typed to IRP values here.
        public get DX(): Vector3D {
        }
        public set DX(value: Vector3D)  {
        }

        public get DY(): Vector3D {
        }
        public set DY(value: Vector3D)  {
        }

        public get DZ(): Vector3D {
        }
        public set DZ(value: Vector3D)  {
        }

        public get Polygons(): Polygon[] {
        }
        public set Polygons(value: Polygon[])  {
        }
    }

    export class VRML {

        ///  <summary>
        ///  Load IRP data from a vrml file.
        ///  </summary>
        public static LoadIRP(path: string): VRMLInfo {
            try {
                console.log(string.Format("Reading VRML file {0}", path));
                let lines: string[] = File.ReadAllLines(path);
                return VRML.LoadInternal(lines);
            }
            catch (e /*:System.Exception*/) {
                console.log(e.Message);
                return null;
            }

        }

        private static LoadInternal(lines: string[]): VRMLInfo {
            let points: Vector3D[] = null;
            let result: VRMLInfo = new VRMLInfo();
            let dz: Vector3D = new Vector3D();
            let dx: Vector3D = new Vector3D();
            let dy: Vector3D = new Vector3D();
            let pointStart: string = (vrml_point + vrml_arrayStart);
            let polyStart: string = (vrml_coordIndex + vrml_arrayStart);
            let current: number = 0;
            while (((current < lines.Length)
                        && (result.Polygons == null))) {
                let cleaned: string = VRML.CleanupLine(lines[current]);
                if (cleaned.StartsWith(vrml_field)) {
                    VRML.LoadField(cleaned, /* ref */dx, /* ref */dy, /* ref */dz);
                }

                if (cleaned.EndsWith(pointStart)) {
                    points = VRML.LoadPoints(lines, /* ref */current);
                }

                if (cleaned.EndsWith(polyStart)) {
                    //  Once we load this, we're done.
                    result.Polygons = VRML.LoadPolygons(points, lines, /* ref */current);
                    break;
                }

                current++;
            }

            result.DX = dx;
            result.DY = dy;
            result.DZ = dz;
            return result;
        }

        private static LoadField(line: string, /* ref */dx: Vector3D, /* ref */dy: Vector3D, /* ref */dz: Vector3D) {
            let split: string[] = VRML.SplitLine(line);
            if ((split.Length != 4)) {
                throw new System.Exception("ExposedField not in expected format.");
            }

            let var: string = split[2];
            let val: number = number.Parse(split[3], CultureInfo.InvariantCulture);
            if ((var == "dx1")) {
                dx.X = val;
            }
            else if ((var == "dx2")) {
                dx.Y = val;
            }
            else if ((var == "dx3")) {
                dx.Z = val;
            }
            else if ((var == "dy1")) {
                dy.X = val;
            }
            else if ((var == "dy2")) {
                dy.Y = val;
            }
            else if ((var == "dy3")) {
                dy.Z = val;
            }
            else if ((var == "dz1")) {
                dz.X = val;
            }
            else if ((var == "dz2")) {
                dz.Y = val;
            }
            else if ((var == "dz3")) {
                dz.Z = val;
            }

        }

        private static LoadPoints(lines: string[], /* ref */index: number): Vector3D[] {
            let result: List<Vector3D> = new List<Vector3D>();
            while (true) {
                index++;
                if ((index >= lines.Length)) {
                    throw new System.Exception("Point array was never closed.");
                }

                let cleaned: string = VRML.CleanupLine(lines[index]);
                if (string.IsNullOrEmpty(cleaned)) {
                    // TODO: Warning!!! continue If
                }

                let split: string[] = VRML.SplitLine(cleaned);
                if ((split.Length == 0)) {
                    // TODO: Warning!!! continue If
                }

                //  Allow the array end to be on the same line as a point definition.
                let pointValid: boolean = false;
                if (((3 == split.Length)
                            || ((4 == split.Length)
                            && split[3].Contains(vrml_arrayEnd)))) {
                    let newPoint: Vector3D = new Vector3D(number.Parse(split[0], CultureInfo.InvariantCulture), number.Parse(split[1], CultureInfo.InvariantCulture), number.Parse(split[2], CultureInfo.InvariantCulture));
                    result.Add(newPoint);
                    pointValid = true;
                }

                if (cleaned.Contains(vrml_arrayEnd)) {
                    break;
                }

                //  We should be valid or have ended.
                if (!pointValid) {
                    throw new System.Exception(string.Format("Point coordinates at line {0} not in readable format.", index));
                }

            }

            return result.ToArray();
        }

        private static LoadPolygons(points: Vector3D[], lines: string[], /* ref */index: number): Polygon[] {
            let result: List<Polygon> = new List<Polygon>();
            if ((points == null)) {
                throw new System.Exception("VRML: point array must be loaded before coordIndex array.");
            }

            while (true) {
                index++;
                if ((index >= lines.Length)) {
                    throw new System.Exception("CoordIndex array was never closed.");
                }

                let cleaned: string = VRML.CleanupLine(lines[index]);
                if (string.IsNullOrEmpty(cleaned)) {
                    // TODO: Warning!!! continue If
                }

                let split: string[] = VRML.SplitLine(cleaned);
                if ((split.Length == 0)) {
                    // TODO: Warning!!! continue If
                }

                let polyPoints: List<Vector3D> = new List<Vector3D>();
                let done: boolean = false;
                for (let i: number = 0; (i < split.Length); i++) {
                    //  Allow the array end to be on the same line as a point definition.
                    if (split[i].Contains(vrml_arrayEnd)) {
                        done = true;
                        break;
                    }

                    let idx: number = number.Parse(split[i]);
                    if ((idx != -1)) {
                        polyPoints.Add(points[idx]);
                    }

                }

                if ((polyPoints.Count > 0)) {
                    let poly: Polygon = new Polygon();
                    poly.CreateEuclidean(polyPoints.ToArray());
                    result.Add(poly);
                }

                if (done) {
                    break;
                }

            }

            return result.ToArray();
        }

        ///  <summary>
        ///  This will exclude comments and remove whitespace.
        ///  </summary>
        private static CleanupLine(line: string): string {
            let comment: number = line.IndexOf('#');
            if ((comment != -1)) {
                line = line.Substring(0, comment);
            }

            return line.Trim();
        }

        private static SplitLine(line: string): string[] {
            return line.Split([
                        ' ',
                        ',',
                        '\t'], System.StringSplitOptions.RemoveEmptyEntries);
        }

        public static AppendShape(path: string, texFile: string, points: Vector3D[], elements: number[], textureCoords: Vector3D[], reverse: boolean, skipMiddle: boolean) {
            let sw: StreamWriter = File.AppendText(path);
            sw.Write(("Shape {
" + ("  appearance Appearance {
" + ("    texture ImageTexture {
" + "      url """" + texFile + "))), ("
" + ("    }
" + ("  }
" + "  geometry IndexedFaceSet {
"))));
            VRML.WriteElements(sw, elements, reverse, skipMiddle);
            VRML.WritePoints(sw, points);
            VRML.WriteTexCoords(sw, textureCoords);
            sw.Write(("  }
" + "} "));
        }

        public static AppendShape(path: string, texFile: string, points: Vector3D[], elements: number[], color: System.Drawing.Color, reverse: boolean, skipMiddle: boolean) {
            let sw: StreamWriter = File.AppendText(path);
            let r: number = ((<number>(color.R)) / 255);
            let g: number = ((<number>(color.G)) / 255);
            let b: number = ((<number>(color.B)) / 255);
            sw.Write(("Shape {
" + ("  appearance Appearance {
" + ("    material Material {
" + ("      diffuseColor "
                            + (r + (", "
                            + (g + (", "
                            + (b + ("
" + ("    }
" + ("  }
" + "  geometry IndexedFaceSet {
")))))))))))));
            VRML.WriteElements(sw, elements, reverse, skipMiddle);
            VRML.WritePoints(sw, points);
            sw.Write(("  }
" + "} "));
        }

        private static WriteElements(sw: StreamWriter, elements: number[], reverse: boolean, skipMiddle: boolean) {
            sw.Write("    coordIndex [
");
            for (let i: number = 0; (i
                        < (elements.Length / 3)); i++) {
                let idx1: number = (i * 3);
                let idx2: number = ((i * 3)
                            + 1);
                let idx3: number = ((i * 3)
                            + 2);
                if (reverse) {
                    Utils.Swap(/* ref */idx1, /* ref */idx2);
                }

                // if( skipMiddle && i % 256 >= 192 )
                if ((skipMiddle
                            && ((i % 1024)
                            >= 624))) {
                    // TODO: Warning!!! continue If
                }

                sw.WriteLine(string.Format("{0}, {1}, {2}, -1", elements[idx1], elements[idx2], elements[idx3]));
            }

            sw.Write("    ]
");
        }

        private static WritePoints(sw: StreamWriter, points: Vector3D[]) {
            sw.Write(("    coord Coordinate {
" + "      point [
"));
            for (let v: Vector3D in points) {
                sw.WriteLine(string.Format("{0} {1} {2},", v.X, v.Y, v.Z));
            }

            sw.Write(("      ]
" + "    }
"));
        }

        private static WriteTexCoords(sw: StreamWriter, textureCoords: Vector3D[]) {
            sw.Write(("    texCoord TextureCoordinate {
" + "      point [
"));
            for (let v: Vector3D in textureCoords) {
                sw.WriteLine(string.Format("{0} {1},", v.X, v.Y));
            }

            sw.Write(("      ]
" + "    }
"));
        }

        //  VRML formatting
        private static vrml_point: string = "point";

        private static vrml_coordIndex: string = "coordIndex";

        private static vrml_arrayStart: string = '[';

        private static vrml_arrayEnd: string = ']';

        private static vrml_field: string = "exposedField";
    }
}
