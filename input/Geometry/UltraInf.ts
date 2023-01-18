import R3.Core;
import R3.Math;
import System.Collections;
import System.Collections.Generic;
import System.Drawing;
import System.Linq;
import System.Numerics;
import Math = System.Math;
import TileVertex = System.Tuple;

module R3.Geometry {

    ///  <summary>
    ///  A class to generate {3,3,r} tilings for r >= 6
    ///  </summary>
    export class UltraInf {

        public constructor () {
            R = -1;
        }

        public get P(): number {
            return 5;
        }

        public get Q(): number {
            return 3;
        }

        public get R(): number {
        }
        public set R(value: number)  {
        }

        ///  <summary>
        ///  The radius of the Poincare Ball.
        ///  </summary>
        private get RBall(): number {
            return 1;
        }

        private m_tiles: List<Tile>;

        public get Tiles(): Tile[] {
            return this.m_tiles.ToArray();
        }

        private m_cells: List<Cell>;

        public m_equator: CircleNE;

        public get Equator(): CircleNE {
            return this.m_equator;
        }

        // int m_cellCount = 200000;
        m_cellCount: number = 200000;

        m_shrink: number = 1;

        public m_animMobius: Mobius;

        ///  <summary>
        ///  If set, this will be used for coloring.
        ///  </summary>
        public get ColorMap(): Record<Vector3D, Color> {
        }
        public set ColorMap(value: Record<Vector3D, Color>)  {
        }

        private Init() {
            this.m_tiles = new List<Tile>();
            this.m_equator = new CircleNE();
            m_neighborCircle = new CircleNE();
            this.m_cells = new List<Cell>();
        }

        ///  <summary>
        ///  anim should be between 0 and 1.
        ///  </summary>
        public Create(anim: number) {
            this.Init();
            let cellTiles: Tile[] = this.FundamentalCell();
            // Transform( anim, cellTiles );
            let level: number = 1;
            let startingCell: Cell = new Cell(level, cellTiles);
            //  Recurse.
            let completed: HashSet<Vector3D> = new HashSet<Vector3D>(new HighToleranceVectorEqualityComparer());
            for (let t: Tile in cellTiles) {
                completed.Add(t.VertexCircle.CenterNE);
            }

            let starting: List<Cell> = new List<Cell>();
            starting.Add(startingCell);
            this.m_cells.Add(startingCell);
            this.ReflectRecursive(level, starting, completed);
            // Output();
        }

        public FundamentalCell(): Tile[] {
            let template: Tile = this.TemplateTile();
            Tile.ShrinkTile(/* ref */template, 0.9);
            //  Generate a cell tiling.
            let tilingConfig: TilingConfig = new TilingConfig(this.Q, this.P);
            let poly: Tiling = new Tiling();
            poly.Generate(tilingConfig);
            this.m_tiles = poly.Tiles.ToList();
            // SetupTransformCircle( tile );    // Call this before transforming.
            // SetupNeighborCircle( tile );
            //  Generate our cell.
            let cellTiles: List<Tile> = new List<Tile>();
            for (let t: Tile in poly.Tiles) {
                let temp: Tile = template.Clone();
                temp.Transform(t.Isometry.Inverse());
                cellTiles.Add(temp);
            }

            return cellTiles.ToArray();
        }

        ///  <summary>
        ///  Outputs edges to an stl file.
        ///  </summary>
        public Output() {
            let p2s: System.Func<Vector3D, Vector3D>;
            Spherical2D.PlaneToSphere(v);
            let transform: System.Func<Vector3D, Vector3D>;
            H3Models.Ball.ApplyMobius(Mobius.Scale(3), v);
            let min: number = double.MaxValue;
            let cell: Cell = this.m_cells.First();
            for (let v1: Vector3D in cell.Tiles[0].Boundary.Vertices) {
                for (let v2: Vector3D in cell.Tiles[1].Boundary.Vertices) {
                    min = Math.min(min, p2s(v1).Dist(p2s(v2)));
                }

            }

            //  XXX - code below so ugly to read!
            let vMap: Record<TileVertex, TileVertex> = new Record<TileVertex, TileVertex>();
            for (let tile_i: number = 0; (tile_i < cell.Tiles.Length); tile_i++) {
                for (let tile_j: number = (tile_i + 1); (tile_j < cell.Tiles.Length); tile_j++) {
                    for (let vertex_i: number = 0; (vertex_i < cell.Tiles[tile_i].Boundary.Vertices.Length); vertex_i++) {
                        for (let vertex_j: number = 0; (vertex_j < cell.Tiles[tile_j].Boundary.Vertices.Length); vertex_j++) {
                            let v1: Vector3D = cell.Tiles[tile_i].Boundary.Vertices[vertex_i];
                            let v2: Vector3D = cell.Tiles[tile_j].Boundary.Vertices[vertex_j];
                            if (Tolerance.Equal(p2s(v1).Dist(p2s(v2)), min)) {
                                vMap[new TileVertex(tile_i, vertex_i)] = new TileVertex(tile_j, vertex_j);
                            }

                        }

                    }

                }

            }

            let edges: HashSet<H3.Cell.Edge> = new HashSet<H3.Cell.Edge>(new H3.Cell.EdgeEqualityComparer());
            for (let c: Cell in this.m_cells) {
                for (let kvp: KeyValuePair<TileVertex, TileVertex> in vMap) {
                    let v1: Vector3D = transform(p2s(c.Tiles[kvp.Key.Item1].Boundary.Vertices[kvp.Key.Item2]));
                    let v2: Vector3D = transform(p2s(c.Tiles[kvp.Value.Item1].Boundary.Vertices[kvp.Value.Item2]));
                    edges.Add(new H3.Cell.Edge(v1, v2));
                }

            }

            // H3.m_settings.ThinEdges = true;
            H3.SaveToFile("ultrainf", edges.ToArray(), /* finite:*/ false);
        }

        private Transform(anim: number, tetTiles: IEnumerable<Tile>) {
            // TilingConfig config = new TilingConfig( 8, 3, 4 );    // Reproduces Tolerance issues with {3,3,7}, though not actually correct to be applying hyperbolic transforms anyway (only spherical).
            let config: TilingConfig = new TilingConfig(3, 3, 1);
            let m: Mobius = new Mobius();
            m = Mobius.Identity();
            //  Invert
            let c1: Complex = new Complex(0, 1);
            let c2: Complex = new Complex(1, 0);
            let c3: Complex = new Complex(0, -0.999999999999);
            //  - 1 doesn't work
            // m.MapPoints( c1, c2, c3, c3, c2, c1 );
            // Mobius m = config.DualMobius();
            // m.Isometry( Geometry.Spherical, 0, new Complex( 1.2345, -0.4321 ) );    // nice one
            // m.Isometry( Geometry.Spherical, 0, new Complex( 0, 0.148125 ) );         // half plane
            //  Animation.
            let p2: number = DonHatch.e2hNorm(0.6);
            let p2Interp: number = DonHatch.h2eNorm((p2 * anim));
            // m.Isometry( Geometry.Spherical, 0, -p2Interp );
            m.Isometry(Geometry.Hyperbolic, 0, new Complex((p2Interp * -1), 0));
            let m2: Mobius = new Mobius();
            m2.Isometry(Geometry.Hyperbolic, 0, new Complex(-0.6, 0));
            m2 = (m_fixedCircleToStandardDisk.Inverse()
                        * (m2 * m_fixedCircleToStandardDisk));
            let firstAnim: boolean = false;
            if (firstAnim) {
                m = (m_fixedCircleToStandardDisk.Inverse()
                            * (m * m_fixedCircleToStandardDisk));
                this.m_animMobius = m;
            }
            else {
                m = (m_neighborToStandardDisk.Inverse()
                            * (m * m_neighborToStandardDisk));
                this.m_animMobius = (m2 * m);
            }

            this.m_animMobius.Normalize();
            for (let t: Tile in tetTiles) {
                t.Transform(this.m_animMobius);
            }

            for (let t: Tile in this.m_tiles) {
                t.Transform(this.m_animMobius);
            }

            this.m_equator.Transform(this.m_animMobius);
            m_neighborCircle.Transform(this.m_animMobius);
        }

        private TemplateTile(): Tile {
            let inRadiusHyp: number = InRadius;
            let inRadiusEuclidean: number = DonHatch.h2eNorm(inRadiusHyp);
            let faceRadius: number = this.FaceRadius(inRadiusEuclidean);
            //  Calc the midpoint, and project to plane.
            let midPoint: Vector3D = this.MidPoint(inRadiusEuclidean, faceRadius);
            midPoint.Z = (midPoint.Z * -1);
            midPoint = Sterographic.SphereToPlane(midPoint);
            // double midPointSpherical = MidPoint( inRadiusEuclidean, faceRadius );
            // double midPoint = Spherical2D.s2eNorm( midPointSpherical );
            //  Create and scale based on our midpoint.
            let poly: Polygon = new Polygon();
            poly.CreateRegular(this.Q, this.R);
            let standardMidpointAbs: number = poly.Segments[0].Midpoint.Abs();
            this.m_shrink = (midPoint.Abs() / standardMidpointAbs);
            poly.Scale(this.m_shrink);
            let m: Matrix4D = Matrix4D.MatrixToRotateinCoordinatePlane(((Math.PI / this.Q)
                            * -1), 0, 1);
            poly.Rotate(m);
            return new Tile(poly, poly.Clone(), Geometry.Hyperbolic);
        }

        private PiOverNSafe(n: number): number {
            return 0;
            // TODO: Warning!!!, inline IF is not supported ?
            (n == -1);
            (Math.PI / n);
        }

        ///  <summary>
        ///  Returns the in-radius of a cell (hyperbolic metric)
        ///  </summary>
        private get InRadius(): number {
            return DonHatch.acosh((Math.Sin(this.PiOverNSafe(this.P))
                            * (Math.Cos(this.PiOverNSafe(this.R)) / Math.Sqrt((1
                                - (Math.Pow(Math.Cos(this.PiOverNSafe(this.P)), 2) - Math.Pow(Math.Cos(this.PiOverNSafe(this.Q)), 2)))))));
        }

        ///  <summary>
        ///  Returns Face radius in ball model (Euclidean metric)
        ///  </summary
        private FaceRadius(inRadiusEuclidean: number): number {
            return ((Math.Pow(this.RBall, 2) - Math.Pow(inRadiusEuclidean, 2)) / (2 * inRadiusEuclidean));
        }

        ///  <summary>
        ///  Returns the midpoint of our polygon edge on the sphere.
        ///  </summary>
        private MidPoint(inRadius: number, faceRadius: number): Vector3D {
            //  Using info from:
            //  http://en.wikipedia.org/wiki/Tetrahedron
            //  http://eusebeia.dyndns.org/4d/tetrahedron
            //  XXX - Should make this method just work in all {p,q,r} cases!
            //  tet
            // double vertexToFace = Math.Acos( 1.0 / 3 );  // 338
            //  icosa
            let polyCircumRadius: number = Math.Sin((2
                            * (Math.PI / 5)));
            let polyInRadius: number = (Math.Sqrt(3) / (12 * (3 + Math.Sqrt(5))));
            //  cube
            // double polyCircumRadius = Math.Sqrt( 3 );
            // double polyInRadius = 1;
            let vertexToFace: number = Math.Acos((polyInRadius / polyCircumRadius));
            let angleTemp: number = Math.Acos((this.RBall
                            / (inRadius + faceRadius)));
            let angleToRotate: number = ((Math.PI - vertexToFace)
                        - angleTemp);
            angleToRotate = (vertexToFace - angleTemp);
            let zVec: Vector3D = new Vector3D(0, 0, 1);
            zVec.RotateAboutAxis(new Vector3D(0, 1, 0), angleToRotate);
            return zVec;
        }

        ///  <summary>
        ///  Helper to calculate a mobius transform, given some point transformation
        ///  that is a mobius.
        ///  </summary>
        private static CalcMobius(pointTransform: System.Func<Vector3D, Vector3D>): Mobius {
            let sqrt22: number = (Math.Sqrt(2) / 2);
            let p1: Vector3D = new Vector3D(0, 1);
            let p2: Vector3D = new Vector3D(sqrt22, sqrt22);
            let p3: Vector3D = new Vector3D(1, 0);
            let e1: Vector3D = pointTransform(p1);
            let e2: Vector3D = pointTransform(p2);
            let e3: Vector3D = pointTransform(p3);
            let m: Mobius = new Mobius();
            m.MapPoints(e1, e2, e3, new Complex(0, 1), new Complex(sqrt22, sqrt22), new Complex(1, 0));
            return m;
        }

        ///  <summary>
        ///  Setup a transform which will take a circle (one of the main 4 ones)
        ///  to the standard disk location.
        ///  </summary>
        private SetupTransformCircle(templateTriangle: Tile) {
            let poly: Polygon = this.m_tiles.First().Boundary;
            //  Tetrahedral tiling.
            let pointTransform: System.Func<Vector3D, Vector3D>;
            v = (v * this.m_shrink);
            return poly.Segments[1].ReflectPoint(v);

            m_fixedCircleToStandardDisk = CalcMobius(pointTransform);
        }

        ///  <summary>
        ///  Setup a circle we'll use to color neighbors.
        ///  </summary>
        private SetupNeighborCircle(templateTriangle: Tile) {
            let poly: Polygon = this.m_tiles.First().Boundary;
            //  Tetrahedral tiling.
            let circ: CircleNE = new CircleNE();
            circ.Radius = this.m_shrink;
            circ.Reflect(poly.Segments[2]);
            circ.Reflect(templateTriangle.Boundary.Segments[1]);
            let m: Mobius = new Mobius();
            m.Isometry(Geometry.Spherical, 0, (circ.CenterNE * -1));
            circ.Transform(m);
            m_neighborCircle = new CircleNE();
            m_neighborCircle.Radius = (1 / circ.Radius);
            m_originalNeighborCircle = m_neighborCircle.Clone();
            let pointTransform: System.Func<Vector3D, Vector3D>;
            v = (v * m_neighborCircle.Radius);
            v = new Vector3D(v.Y, v.X);
            v.RotateXY(((Math.PI / 2)
                            * -1));
            return v;

            m_neighborToStandardDisk = CalcMobius(pointTransform);
        }

        public m_fixedCircleToStandardDisk: Mobius;

        public m_neighborToStandardDisk: Mobius;

        private m_neighborCircle: CircleNE;

        private m_originalNeighborCircle: CircleNE;

        /// /////////////////////////////////////////////////////////////
        //  Code below modeled after tiling class, but with tets instead of single tiles.
        class Cell {

            public constructor (level: number, tiles: Tile[]) {
                Level = level;
                Tiles = tiles;
            }

            public get Level(): number {
            }
            public set Level(value: number)  {
            }

            public get Tiles(): Tile[] {
            }
            public set Tiles(value: Tile[])  {
            }

            public Clone(): Cell {
                let copied: List<Tile> = new List<Tile>();
                for (let t: Tile in this.Tiles) {
                    copied.Add(t.Clone());
                }

                return new Cell(this.Level, copied.ToArray());
            }

            public Reflect(seg: Segment) {
                for (let tile: Tile in this.Tiles) {
                    tile.Reflect(seg);
                    if (isInfinite(tile.Boundary.Center)) {
                        tile.Boundary.Center = Infinity.LargeFiniteVector;
                    }

                    if (isInfinite(tile.Drawn.Center)) {
                        tile.Drawn.Center = Infinity.LargeFiniteVector;
                    }

                }

            }

            public get Segments(): IEnumerable<Segment> {
                for (let t: Tile in this.Tiles) {
                    //  Don't use tiny triangles to recurse.
                    // if( t.VertexCircle.Radius < 0.01 )
                    if ((t.VertexCircle.Radius < 0.008)) {
                        // TODO: Warning!!! continue If
                    }

                    if (t.Boundary.Segments.Any(() => {  }, (s.Length < 0.15))) {
                        // TODO: Warning!!! continue If
                    }

                    for (let s: Segment in t.Boundary.Segments) {
                        // if( s.Length < 0.15 )
                        //     continue;
                        // else
                        yield;
                        return s;
                    }

                }

            }
        }

        public get CellTiles(): IEnumerable<Tile> {
            for (let cell: Cell in this.m_cells) {
                for (let tile: Tile in cell.Tiles) {
                    yield;
                }

            }

            return tile;
        }

        export class ColoredTile {

            public constructor (t: Tile, c: Color) {
                Tile = t;
                Color = c;
            }

            public get Tile(): Tile {
            }
            public set Tile(value: Tile)  {
            }

            public get Color(): Color {
            }
            public set Color(value: Color)  {
            }
        }

        public get ColoredTiles(): IEnumerable<ColoredTile> {
            for (let cell: Cell in this.m_cells) {
                let mag: number = (cell.Level * 50);
                let b: number = 0;
                let r: number = mag;
                let g: number = 0;
                if ((r > 255)) {
                    r = 255;
                    mag -= 255;
                    g = mag;
                }

                if ((g > 255)) {
                    g = 255;
                    mag -= 255;
                    b = mag;
                }

                if ((b > 255)) {
                    b = 255;
                }

                // Color c = Color.FromArgb( 255, 255 - b < 75 ? 75 : 255 - b, 255 - r, 255 - g );    purple red
                let c: Color = Color.FromArgb(255, 75, (255 - g), (255 - r));
                // TODO: Warning!!!, inline IF is not supported ?
                ((255 - b)
                            < 75);
                (255 - b);
                // Color c = Color.FromArgb( 255, r, b, g );
                c = Color.White;
                for (let t: Tile in cell.Tiles) {
                    yield;
                }

                return new ColoredTile(t, c);
            }

        }

        private NewTetAfterReflect(cell: Cell, s: Segment, completed: HashSet<Vector3D>): boolean {
            for (let tile: Tile in cell.Tiles) {
                let newVertexCircle: CircleNE = tile.VertexCircle.Clone();
                newVertexCircle.Reflect(s);
                if (completed.Contains(Infinity.InfinitySafe(newVertexCircle.CenterNE))) {
                    return false;
                }

            }

            return true;
        }

        private ReflectRecursive(level: number, cells: List<Cell>, completed: HashSet<Vector3D>) {
            level++;
            //  Breadth first recursion.
            if ((0 == cells.Count)) {
                return;
            }

            let reflected: List<Cell> = new List<Cell>();
            for (let cell: Cell in cells) {
                for (let seg: Segment in cell.Segments) {
                    //  Are we done?
                    if ((this.m_cells.Count >= this.m_cellCount)) {
                        return;
                    }

                    if (!this.NewTetAfterReflect(cell, seg, completed)) {
                        // TODO: Warning!!! continue If
                    }

                    let newBase: Cell = cell.Clone();
                    newBase.Level = level;
                    newBase.Reflect(seg);
                    this.m_cells.Add(newBase);
                    reflected.Add(newBase);
                    for (let tile: Tile in newBase.Tiles) {
                        completed.Add(Infinity.InfinitySafe(tile.VertexCircle.CenterNE));
                    }

                }

            }

            this.ReflectRecursive(level, reflected, completed);
        }

        ///  <summary>
        ///  ZZZ - move to a shared location (this is already copied)
        ///  </summary>
        export class HighToleranceVectorEqualityComparer extends IEqualityComparer<Vector3D> {

            public Equals(v1: Vector3D, v2: Vector3D): boolean {
                return v1.Compare(v2, m_tolerance);
            }

            public GetHashCode(v: Vector3D): number {
                return v.GetHashCode(m_tolerance);
            }

            // private double m_tolerance = 0.00025;
            private m_tolerance: number = 0.0005;
        }
    }
}
