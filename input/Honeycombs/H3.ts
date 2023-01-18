import R3.Core;
import R3.Math;
import System.Collections.Generic;
import System.IO;
import System.Linq;
import Math = System.Math;

module R3.Geometry {

    ///  <summary>
    ///  A class to play around with H3 honecombs
    ///  Except for the Cell class, this is mostly old, but it is what I used to generate STL models for Shapeways.
    ///  </summary>
    export class H3 {

        ///  <summary>
        ///  We can track a cell by its ideal vertices.
        ///  We'll work with these in the plane.
        ///  </summary>
        export class Cell {

            public constructor (facets: Facet[]) :
                    this(-1, facets) {

            }

            public constructor (p: number, facets: Facet[]) {
                P = p;
                Facets = facets;
                Depths = new Array(4);
            }

            public P: number;

            //  Number of edges in polygon
            public Facets: Facet[];

            public Center: Vector3D;

            //  Not necessary.
            public Mesh: Mesh;

            ///  <summary>
            ///  Used to track recursing depth of reflections across various mirrors.
            ///  </summary>
            public Depths: number[];

            public LastReflection: number = -1;

            public get IdealVerts(): boolean {
                if ((this.Verts.Count() == 0)) {
                    return false;
                }

                return Tolerance.Equal(this.Verts.First().MagSquared(), 1);
            }

            public AppendAllEdges(edges: HashSet<Edge>) {
                for (let f: Facet in this.Facets) {
                    f.AppendAllEdges(edges);
                }

            }

            ///  <summary>
            ///  In Ball model.
            ///  </summary>
            public CalcCenterFromFacets() {
                let center: Vector3D = new Vector3D();
                for (let s: Sphere in this.Facets.Select(() => {  }, f.Sphere)) {
                    if (s.IsPlane) {
                        // TODO: Warning!!! continue If
                    }

                    let sCenter: Vector3D = s.Center;
                    let abs: number = s.Center.Abs();
                    sCenter.Normalize();
                    sCenter = (sCenter
                                * (abs - s.Radius));
                    center = (center + sCenter);
                }

                this.Facets.Length;
                this.Center = center;
            }

            export class Facet {

                public constructor (verts: Vector3D[]) {
                    Verts = verts;
                }

                public constructor (sphere: Sphere) {
                    Sphere = sphere;
                }

                ///  <summary>
                ///  The facet vertices.
                ///  May live on the plane, in the ball model, etc. as needed.
                ///  </summary>
                public Verts: Vector3D[];

                ///  <summary>
                ///  This is an alternate way to track facets, and *required*
                ///  for Lorentzian honeycombs, because all the vertices are hyperideal.
                ///  It is expected that these are always in the Ball model.
                ///  </summary>
                public get Sphere(): Sphere {
                }
                public set Sphere(value: Sphere)  {
                }

                private get CenterInBall(): Vector3D {
                    if (isInfinite(this.Sphere.Radius)) {
                        return new Vector3D();
                    }

                    //  Calcs based on orthogonal circles.
                    //  http://mathworld.wolfram.com/OrthogonalCircles.html
                    let d: number = Math.Sqrt((1
                                    + (this.Sphere.Radius * this.Sphere.Radius)));
                    let center: Vector3D = this.Sphere.Center;
                    center.Normalize();
                    center = (center
                                * (d - this.Sphere.Radius));
                    return center;
                }

                public CalcSphereFromVerts(g: Geometry) {
                    switch (g) {
                        case Geometry.Spherical:
                            this.Sphere = new Sphere();
                            if ((this.Verts.Where(() => {  }, (v == new Vector3D())).Count() > 0)) {
                                let nonZero: Vector3D[] = this.Verts.Where(() => {  }, (v != new Vector3D())).ToArray();
                                this.Sphere.Radius = Number.POSITIVE_INFINITY;
                                this.Sphere.Center = nonZero[0].Cross(nonZero[1]);
                            }
                            else {
                                //  The sphere intersects the unit-sphere at a unit-circle (orthogonal to the facet center direction).
                                let direction: Vector3D = new Vector3D();
                                for (let v: Vector3D in this.Verts) {
                                    direction = (direction + v);
                                }

                                this.Verts.Length;
                                direction.Normalize();
                                let p1: Vector3D = Euclidean3D.ProjectOntoPlane(direction, new Vector3D(), this.Verts[0]);
                                p1.Normalize();
                                let c: Circle3D = new Circle3D(p1, this.Verts[0], (p1 * -1));
                                this.Sphere.Center = c.Center;
                                this.Sphere.Radius = c.Radius;
                            }

                            break;
                        case Geometry.Euclidean:
                            this.Sphere = new Sphere();
                            this.Sphere.Radius = Number.POSITIVE_INFINITY;
                            let v3: Vector3D = this.Verts[2];
                            this.Sphere.Center = ((v2 - v1)).Cross((v3 - v1));
                            this.Sphere.Offset = Euclidean3D.ProjectOntoPlane(this.Sphere.Center, v1, new Vector3D());
                            break;
                        case Geometry.Hyperbolic:
                            this.Sphere = H3Models.Ball.OrthogonalSphereInterior(this.Verts[0], this.Verts[1], this.Verts[2]);
                            break;
                    }

                    let v1: Vector3D = this.Verts[0];
                    let v2: Vector3D = this.Verts[1];
                }

                public Clone(): Facet {
                    let newFacet: Facet = new Facet(null);
                    // TODO: Warning!!!, inline IF is not supported ?
                    (this.Verts == null);
                    (<Vector3D[]>(this.Verts.Clone()));
                    newFacet.Sphere = null;
                    // TODO: Warning!!!, inline IF is not supported ?
                    (this.Sphere == null);
                    this.Sphere.Clone();
                    return newFacet;
                }

                public Reflect(sphere: Sphere) {
                    if ((this.Verts != null)) {
                        for (let i: number = 0; (i < this.Verts.Length); i++) {
                            this.Verts[i] = sphere.ReflectPoint(this.Verts[i]);
                        }

                    }

                    if ((this.Sphere != null)) {
                        this.Sphere.Reflect(sphere);
                    }

                }

                public get ID(): Vector3D {
                    let result: Vector3D = new Vector3D();
                    if ((this.Verts != null)) {
                        for (let v: Vector3D in this.Verts) {
                            result = (result + v);
                        }

                        return result;
                    }

                    if ((this.Sphere != null)) {
                        return this.Sphere.ID;
                    }

                    throw new Error('Argument Error');
                }

                public AppendAllEdges(edges: HashSet<Edge>) {
                    //  We can only do this if we have vertices.
                    if ((this.Verts == null)) {
                        return;
                    }

                    for (let i: number = 0; (i < this.Verts.Length); i++) {
                        let idx1: number = i;
                        let idx2: number = 0;
                        // TODO: Warning!!!, inline IF is not supported ?
                        (i
                                    == (this.Verts.Length - 1));
                        (i + 1);
                        edges.Add(new Edge(this.Verts[idx1], this.Verts[idx2]));
                    }

                }
            }

            export class Edge {

                public constructor (v1: Vector3D, v2: Vector3D, order: boolean = true) {
                    //  Keep things "ordered", so we can easily compare edges.
                    if (order) {
                        let orderedVerts: Vector3D[] = [
                                v1,
                                v2];
                        orderedVerts = orderedVerts.OrderBy(() => {  }, v, new Vector3DComparer()).ToArray();
                        Start = orderedVerts[0];
                        End = orderedVerts[1];
                    }
                    else {
                        Start = v1;
                        End = v2;
                    }

                    Depths = new Array(4);
                }

                public Start: Vector3D;

                public End: Vector3D;

                //  The reason we use a vector here is so the components
                //  can be interpreted in different color schemes (HLS, RGB, etc.)
                public Color: Vector3D = new Vector3D(1, 1, 1);

                ///  <summary>
                ///  Used to track recursing depth of reflections across various mirrors.
                ///  </summary>
                public Depths: number[];

                public Clone(): Edge {
                    return (<Edge>(MemberwiseClone()));
                }

                public get ID(): Vector3D {
                    return (this.Start + this.End);
                }

                public Opp(v: Vector3D): Vector3D {
                    return this.End;
                    // TODO: Warning!!!, inline IF is not supported ?
                    (v == this.Start);
                    this.Start;
                }

                public Write(sw: StreamWriter, level: number) {
                    sw.WriteLine(string.Format("{0},{1},{2}", level, this.Start.ToStringXYZOnly(), this.End.ToStringXYZOnly()));
                }

                public CopyDepthsFrom(e: Edge) {
                    this.Depths = (<number[]>(e.Depths.Clone()));
                }
            }

            export class EdgeEqualityComparer extends IEqualityComparer<Edge> {

                public Equals(e1: Edge, e2: Edge): boolean {
                    return (e1.Start.Compare(e2.Start, m_tolerance) && e1.End.Compare(e2.End, m_tolerance));
                }

                public GetHashCode(e: Edge): number {
                    return (e.Start.GetHashCode() | e.End.GetHashCode());
                    // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
                }

                private m_tolerance: number = 0.0001;
            }

            public get HasVerts(): boolean {
                for (let f: Facet in this.Facets) {
                    if ((f.Verts == null)) {
                        return false;
                    }

                }

                return true;
            }

            public get Verts(): IEnumerable<Vector3D> {
                for (let facet: Facet in this.Facets) {
                    if ((facet.Verts != null)) {
                        for (let v: Vector3D in facet.Verts) {
                            yield;
                        }

                    }

                    return v;
                }

            }

            ///  <summary>
            ///  Additional points (could be whatever) that we want reflected around with this cell.
            ///  </summary>
            public get AuxPoints(): Vector3D[] {
            }
            public set AuxPoints(value: Vector3D[])  {
            }

            public get ID(): Vector3D {
                let result: Vector3D = new Vector3D();
                // foreach( Vector3D v in Verts )
                // result += Sterographic.PlaneToSphereSafe( v );    // XXX - what about when not working in plane.
                if (this.HasVerts) {
                    for (let v: Vector3D in this.Verts) {
                        result = (result + v);
                    }

                }
                else {
                    //  Intentionally just use the center.
                }

                result = (result + this.Center);
                return result;
            }

            public Clone(): Cell {
                let newFacets: List<Facet> = new List<Facet>();
                for (let facet: Facet in this.Facets) {
                    newFacets.Add(facet.Clone());
                }

                let clone: Cell = new Cell(this.P, newFacets.ToArray());
                clone.Center = this.Center;
                clone.Depths = (<number[]>(this.Depths.Clone()));
                clone.LastReflection = this.LastReflection;
                if ((this.AuxPoints != null)) {
                    clone.AuxPoints = (<Vector3D[]>(this.AuxPoints.Clone()));
                }

                if ((this.Mesh != null)) {
                    clone.Mesh = this.Mesh.Clone();
                }

                return clone;
            }

            ///  <summary>
            ///  Moves our vertices from the plane to the sphere.
            ///  </summary>
            public ToSphere() {
                for (let facet: Facet in this.Facets) {
                    for (let i: number = 0; (i < this.P); i++) {
                        facet.Verts[i] = Sterographic.PlaneToSphereSafe(facet.Verts[i]);
                    }

                }

            }

            ///  <summary>
            ///  Scales cell to circumsphere.
            ///  NOTE: We should already be on a sphere, not the plane.
            ///  </summary>
            public ScaleToCircumSphere(r: number) {
                for (let facet: Facet in this.Facets) {
                    for (let i: number = 0; (i < this.P); i++) {
                        let axis: Vector3D = facet.Verts[i];
                        axis.Normalize();
                        facet.Verts[i] = (axis * r);
                    }

                }

            }

            ///  <summary>
            ///  Apply a Mobius transformation to us (meaning of Mobius transform is on boundary of UHS model).
            ///  </summary>
            public ApplyMobius(m: Mobius) {
                for (let facet: Facet in this.Facets) {
                    for (let i: number = 0; (i < this.P); i++) {
                        facet.Verts[i] = H3Models.Ball.ApplyMobius(m, facet.Verts[i]);
                    }

                }

                this.Center = H3Models.Ball.ApplyMobius(m, this.Center);
            }

            public Reflect(sphere: Sphere) {
                for (let facet: Facet in this.Facets) {
                    facet.Reflect(sphere);
                }

                this.Center = sphere.ReflectPoint(this.Center);
                if ((this.AuxPoints != null)) {
                    for (let i: number = 0; (i < this.AuxPoints.Length); i++) {
                        this.AuxPoints[i] = sphere.ReflectPoint(this.AuxPoints[i]);
                    }

                }

                if ((this.Mesh != null)) {
                    let reflectedInPlace: boolean = false;
                    for (let i: number = 0; (i < this.Mesh.Triangles.Count); i++) {
                        let tri: Mesh.Triangle = this.Mesh.Triangles[i];
                        let c: Vector3D = tri.c;
                        let a: Vector3D = tri.a;
                        let b: Vector3D = tri.b;
                        tri.a = sphere.ReflectPoint(tri.a);
                        tri.b = sphere.ReflectPoint(tri.b);
                        tri.c = sphere.ReflectPoint(tri.c);
                        //  Keep orientations consistent.
                        // if( !( a == tri.a && b == tri.b && c == tri.c ) )
                        tri.ChangeOrientation();
                        if (((a == tri.a)
                                    && ((b == tri.b)
                                    && (c == tri.c)))) {
                            reflectedInPlace = true;
                        }

                        this.Mesh.Triangles[i] = tri;
                    }

                    // if( reflectedInPlace )
                    //     Depths[0]--;
                }

            }
        }

        export class Util {

            public static AddEdges(cell: Cell, level: number, completedEdges: Record<Cell.Edge, number>) {
                for (let facet: Cell.Facet in cell.Facets) {
                    for (let i: number = 0; (i < cell.P); i++) {
                        let i1: number = i;
                        let i2: number = 0;
                        // TODO: Warning!!!, inline IF is not supported ?
                        (i
                                    == (cell.P - 1));
                        (i + 1);
                        let edge: Cell.Edge = new Cell.Edge(facet.Verts[i1], facet.Verts[i2]);
                        if (completedEdges.ContainsKey(edge)) {
                            // TODO: Warning!!! continue If
                        }

                        completedEdges.Add(edge, level);
                    }

                }

            }

            public static AddToMeshInternal(mesh: Shapeways, _v1: Vector3D, _v2: Vector3D) {
                //  Move to ball.
                // Vector3D v1 = Sterographic.PlaneToSphereSafe( _v1 );
                // Vector3D v2 = Sterographic.PlaneToSphereSafe( _v2 );
                let v2: Vector3D = _v2;
                let v1: Vector3D = _v1;
                let sizeFunc: System.Func<Vector3D, number> = SizeFuncConst;
                if (m_settings.Halfspace) {
                    let points: Vector3D[] = H3Models.UHS.GeodesicPoints(_v1, _v2);
                    if (!m_settings.ThinEdges) {
                    }

                    H3Models.UHS.SizeFunc(v, m_settings.AngularThickness);
                    mesh.AddCurve(points, sizeFunc);
                }
                else {
                    let div2: number;
                    let div1: number;
                    H3Models.Ball.LOD_Finite(v1, v2, /* out */div1, /* out */div2, m_settings);
                    div1 = 15;
                    div2 = 30;
                    let points: Vector3D[] = H3Models.Ball.GeodesicPoints(v1, v2, div1);
                    mesh.Div = div2;
                    if (m_settings.ThinEdges) {
                        mesh.AddCurve(points, sizeFunc);
                    }
                    else {
                        let ePoints: List<Vector3D> = new List<Vector3D>();
                        let eRadii: List<number> = new List<number>();
                        for (let pNE: Vector3D in points) {
                            let sphere: Sphere = Util.SphereFunc(pNE);
                            ePoints.Add(sphere.Center);
                            eRadii.Add(sphere.Radius);
                        }

                        mesh.AddCurve(ePoints.ToArray(), eRadii.ToArray());
                    }

                }

            }

            private /* internal */ static SphereFunc(v: Vector3D): Sphere {
                let minRad: number = (0.8 / 100);
                // double minRad = 2.0 / 100;
                let c: Vector3D;
                let r: number;
                H3Models.Ball.DupinCyclideSphere(v, (m_settings.AngularThickness / 2), Geometry.Hyperbolic, /* out */c, /* out */r);
                return new Sphere();
            }

            ///  <summary>
            ///  Used to help figure out how thin our wires are going to get.
            ///  </summary>
            private /* internal */ static LogMinSize(edges: Record<Cell.Edge, number>) {
                let max: number = 0;
                for (let e: Cell.Edge in edges.Keys) {
                    max = Math.Max(max, e.Start.Abs());
                    max = Math.Max(max, e.End.Abs());
                }

                let v: Vector3D = new Vector3D(0, 0, max);
                let radius: number = H3Models.Ball.SizeFunc(v, m_settings.AngularThickness);
                let thickness: number = (radius * (2 * m_settings.Scale));
                console.log(string.Format("location = {0}, thickness = {1}", max, thickness));
                if ((thickness < 0.87)) {
                    console.log("WARNING!!!!!!! Edge thickness will be too small for shapeways.  You will be REJECTED.");
                }

            }

            private static AddCoordSpheres(mesh: Shapeways) {
                mesh.AddSphere(new Vector3D(1.5, 0, 0), 0.1);
                mesh.AddSphere(new Vector3D(0, 1.5, 0), 0.2);
                mesh.AddSphere(new Vector3D(0, 0, 1.5), 0.3);
            }
        }

        export enum Output {

            STL,

            POVRay,
        }

        export class Settings {

            public Scale: number = 50;

            //  10cm ball by default.
            public Halfspace: boolean = false;

            public MaxCells: number = 150000;

            //  Ball Model
            public Ball_MaxLength: number = 3;

            // public double Ball_MinLength = 0.075;
            public Ball_MinLength: number = 0.15;

            // public double Ball_MinLength = 0.05;
            // private static double Ball_MinLength = 0.45;    // lamp
            public Ball_Cutoff: number = 0.95;

            //  UHS
            // public double UHS_MinEdgeLength = .09;
            // public double UHS_MaxBounds = 6.5;
            public UHS_MinEdgeLength: number = 0.03;

            public UHS_MaxBounds: number = 2;

            public UHS_Horocycle: number = 0.25;

            //  Bananas
            public ThinEdges: boolean = false;

            public AngularThickness: number = 0.06;

            //  an angle (the slope of the banana)
            // public double AngularThickness = 0.04;
            // public double AngularThickness = 0.25;
            //  Position and associated Mobius to apply
            public Position: Polytope.Projection = Polytope.Projection.CellCentered;

            public Mobius: Mobius = Mobius.Identity();

            public Output: Output = Output.POVRay;
        }

        public static m_settings: Settings = new Settings();

        // public static string m_baseDir = @"C:\Users\hrn\Documents\roice\povray\H3\";
        public static m_baseDir: string = ".\";

        public static GenHoneycombs() {
            // GenHoneycomb( EHoneycomb.H434 );
            // GenHoneycomb( EHoneycomb.H435 );
            // GenHoneycomb( EHoneycomb.H534 );
            // GenHoneycomb( EHoneycomb.H535 );
            // GenHoneycomb( EHoneycomb.H353 );
            // GenHoneycomb( EHoneycomb.H336 );
            H3.GenHoneycomb(EHoneycomb.H436);
            // GenHoneycomb( EHoneycomb.H536 );
            // GenHoneycomb( EHoneycomb.H344 );
            // GenHoneycomb( EHoneycomb.H636 );
            // GenHoneycomb( EHoneycomb.H444 );
            // GenHoneycomb( EHoneycomb.H363 );
            // GenHoneycomb( EHoneycomb.H33I );
            // H3Fundamental.Generate( EHoneycomb.H435, m_settings );
        }

        private static m_levelsToKeep: number[] = [
                1,
                2,
                3,
                4,
                5];

        private static m_rangeToKeep: number[] = [
                0.9,
                0.96];

        private static CheckRange(v: Vector3D): boolean {
            let abs: number = v.Abs();
            return ((abs > m_rangeToKeep[0])
                        && (abs < m_rangeToKeep[1]));
        }

        private static SetupShapewaysSettings(settings: Settings, honeycomb: EHoneycomb) {
            switch (honeycomb) {
                case EHoneycomb.H336:
                case EHoneycomb.H344:
                    break;
                    break;
                case EHoneycomb.H436:
                    // settings.Ball_MinLength = 0.08;
                    settings.Ball_MinLength = 0.08;
                    break;
                    break;
                case EHoneycomb.H536:
                    // settings.Ball_MinLength = 0.05;
                    settings.Ball_MinLength = 0.03;
                    break;
                    break;
            }

        }

        private static SetupSettings(honeycomb: EHoneycomb) {
            switch (honeycomb) {
                case EHoneycomb.H435:
                    m_settings.Ball_Cutoff = 0.95;
                    // m_settings.AngularThickness = 0.163;
                    //  Sandstone
                    m_settings.Position = Polytope.Projection.VertexCentered;
                    m_settings.Ball_Cutoff = 0.88;
                    m_settings.AngularThickness = 0.18;
                    //  Paper
                    m_settings.Position = Polytope.Projection.CellCentered;
                    m_settings.Ball_Cutoff = 0.96;
                    m_settings.AngularThickness = 0.08;
                    break;
                    break;
                case EHoneycomb.H534:
                    m_settings.Ball_Cutoff = 0.984;
                    // TODO: Warning!!!, inline IF is not supported ?
                    m_settings.ThinEdges;
                    0.95;
                    // m_settings.Ball_MaxLength = 1;
                    // m_settings.Ball_MinLength = 0.05;
                    //  Sandstone
                    // m_settings.Position = Polytope.Projection.CellCentered;
                    // m_settings.Ball_Cutoff = 0.88;
                    // m_settings.AngularThickness = 0.18;
                    //  Laser Crystal
                    m_settings.AngularThickness = 0.1;
                    m_settings.Ball_Cutoff = 0.98;
                    m_settings.Output = Output.STL;
                    break;
                    break;
                case EHoneycomb.H535:
                    // m_settings.Ball_Cutoff = m_settings.ThinEdges ? 0.993 : 0.96;
                    // m_settings.Postion = Position.VertexCentered;
                    m_settings.ThinEdges = true;
                    m_settings.Ball_Cutoff = 0.98;
                    break;
                    break;
                case EHoneycomb.H353:
                    let big: boolean = true;
                    if (big) {
                        m_settings.Scale = 65;
                        m_settings.Ball_Cutoff = 0.96;
                        m_settings.AngularThickness = 0.165;
                    }
                    else {
                        //  Defaults
                    }

                    break;
                    break;
                case EHoneycomb.H336:
                    break;
                    break;
                case EHoneycomb.H337:
                    m_settings.Scale = 75;
                    // m_settings.AngularThickness = 0.202;
                    m_settings.AngularThickness = 0.1;
                    break;
                    break;
                case EHoneycomb.H436:
                    m_settings.AngularThickness = 0.12;
                    m_settings.Position = Polytope.Projection.FaceCentered;
                    break;
                    break;
                case EHoneycomb.H536:
                    m_settings.Ball_MinLength = 0.02;
                    break;
                    break;
                case EHoneycomb.H344:
                    m_settings.Ball_MinLength = 0.05;
                    break;
                    break;
                case EHoneycomb.H33I:
                    17;
                    break;
                    break;
            }

            if ((m_settings.Output == Output.POVRay)) {
                //  Wiki
                m_settings.Ball_MinLength = 0.0018;
                //  534
                m_settings.Ball_MinLength = 0.005;
                //  344
                m_settings.Ball_MinLength = 0.003;
                //  others
                m_settings.Ball_MinLength = 0.001;
                //  duals
                // m_settings.MaxCells = 300000;
                // m_settings.MaxCells = 100000;
                m_settings.MaxCells = 750000;
                // m_settings.Position = Polytope.Projection.EdgeCentered;
                //  Finite
                // m_settings.Position = Polytope.Projection.CellCentered;
                // m_settings.Ball_Cutoff = 0.997;
                // m_settings.Ball_Cutoff = 0.999;    //535
            }

            m_settings.Output = Output.STL;
            m_settings.Position = Polytope.Projection.FaceCentered;
            m_settings.AngularThickness = 0.13;
        }

        ///  <summary>
        ///  Naming is from Coxeter's table.
        ///  Side lengths of fundamental right angled triangle.
        ///  We'll use these to calc isometries to change the canonical position.
        ///  2 * phi = edge length
        ///  chi = circumradius
        ///  psi = inradius
        ///  </summary>
        public static HoneycombData(honeycomb: EHoneycomb, /* out */phi: number, /* out */chi: number, /* out */psi: number) {
            psi = -1;
            chi = -1;
            phi = -1;
            chi = Honeycomb.CircumRadius(honeycomb);
            psi = Honeycomb.InRadius(honeycomb);
            phi = (Honeycomb.EdgeLength(honeycomb) / 2);
        }

        public static SetupCentering(honeycomb: EHoneycomb, settings: Settings, phi: number, chi: number, psi: number, /* ref */projection: Polytope.Projection) {
            settings.Mobius = Mobius.Identity();
            switch (settings.Position) {
                case Polytope.Projection.CellCentered:
                    // m_settings.Mobius = Mobius.Scale( 5 );    // {6,3,3}, {4,3,3} cell-centered (sort of)
                    break;
                case Polytope.Projection.FaceCentered:
                    if ((psi != -1)) {
                        settings.Mobius = Mobius.Scale(H3Models.UHS.ToE(psi));
                    }

                    break;
                case Polytope.Projection.EdgeCentered:
                    if ((psi != -1)) {
                        settings.Mobius = Mobius.Scale(H3Models.UHS.ToE(Honeycomb.MidRadius(honeycomb)));
                        projection = Polytope.Projection.EdgeCentered;
                    }
                    else {
                        //  This only works for the finite cells.
                        //  We can get the scaling distance we need from the analogue of the
                        //  pythagorean theorm for a hyperbolic right triangle.
                        //  The hypotenuse is the circumradius (chi), and the other side is the 1/2 edge length (phi).
                        //  http://en.wikipedia.org/wiki/Pythagorean_theorem#Hyperbolic_geometry
                        let tempScale: number = DonHatch.acosh((Math.Cosh(chi) / Math.Cosh(phi)));
                        settings.Mobius = Mobius.Scale(H3Models.UHS.ToE(tempScale));
                        projection = Polytope.Projection.VertexCentered;
                    }

                    break;
                case Polytope.Projection.VertexCentered:
                    if ((chi != -1)) {
                        settings.Mobius = Mobius.Scale(H3Models.UHS.ToE(chi));
                        projection = Polytope.Projection.VertexCentered;
                    }

                    break;
            }

        }

        public static GenHoneycomb(honeycomb: EHoneycomb) {
            if ((honeycomb == EHoneycomb.H434)) {
                Euclidean.GenEuclidean();
                return;
            }

            if (H3Supp.IsExotic(honeycomb)) {
                H3Supp.GenerateExotic(honeycomb, m_settings);
                return;
            }

            H3.SetupSettings(honeycomb);
            // SetupShapewaysSettings( m_settings, honeycomb );
            let tiling: Tiling = H3.CellTilingForHoneycomb(honeycomb);
            let cellScale: number = Honeycomb.CircumRadius(honeycomb);
            if (isInfinite(cellScale)) {
                cellScale = 1;
            }
            else {
                cellScale = DonHatch.h2eNorm(cellScale);
            }

            let mesh: Shapeways = new Shapeways();
            let finite: boolean = (cellScale != 1);
            if (finite) {
                H3.GenHoneycombInternal(mesh, tiling, honeycomb, cellScale);
            }
            else {
                H3.GenHoneycombInternal(mesh, tiling, honeycomb, cellScale);
                mesh = new Shapeways();
                // GenDualHoneycombInternal( mesh, tiling, honeycomb );
            }

        }

        public static CellTilingForHoneycomb(honeycomb: EHoneycomb): Tiling {
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
            H3.SetupCentering(honeycomb, m_settings, phi, chi, psi, /* ref */projection);
            let tiling: Tiling = new Tiling();
            let config: TilingConfig = new TilingConfig(p, q);
            tiling.GenerateInternal(config, projection);
            return tiling;
        }

        public static GenFacets(tiling: Tiling): Cell.Facet[] {
            let facets: List<Cell.Facet> = new List<Cell.Facet>();
            for (let tile: Tile in tiling.Tiles) {
                let points: List<Vector3D> = new List<Vector3D>();
                for (let seg: Segment in tile.Boundary.Segments) {
                    points.Add(seg.P1);
                }

                facets.Add(new Cell.Facet(points.ToArray()));
            }

            return facets.ToArray();
        }

        public static GenFacetSpheres(tiling: Tiling, inRadius: number): Cell.Facet[] {
            let facets: List<Cell.Facet> = new List<Cell.Facet>();
            for (let tile: Tile in tiling.Tiles) {
                let facetClosestToOrigin: Vector3D = tile.Boundary.Center;
                facetClosestToOrigin = Sterographic.PlaneToSphereSafe(facetClosestToOrigin);
                facetClosestToOrigin.Normalize();
                facetClosestToOrigin = (facetClosestToOrigin * DonHatch.h2eNorm(inRadius));
                let facetSphere: Sphere = H3Models.Ball.OrthogonalSphereInterior(facetClosestToOrigin);
                facets.Add(new Cell.Facet(facetSphere));
            }

            return facets.ToArray();
        }

        ///  <summary>
        ///  Generates H3 honeycombs with cells having a finite number of facets.
        ///  </summary>
        private static GenHoneycombInternal(mesh: Shapeways, tiling: Tiling, honeycomb: EHoneycomb, cellScale: number) {
            let honeycombString: string = Honeycomb.String(honeycomb, false);
            let r: number;
            let p: number;
            let q: number;
            Honeycomb.PQR(honeycomb, /* out */p, /* out */q, /* out */r);
            let inRadius: number = Honeycomb.InRadius(honeycomb);
            let facets: Cell.Facet[] = H3.GenFacetSpheres(tiling, inRadius);
            // Cell first = new Cell( p, facets );  // Uncomment to do facets only.
            let first: Cell = new Cell(p, H3.GenFacets(tiling));
            first.ToSphere();
            //  Work in ball model.
            first.ScaleToCircumSphere(cellScale);
            first.ApplyMobius(m_settings.Mobius);
            //  This is for getting endpoints of cylinders for hollowing.
            let printVerts: boolean = false;
            if (printVerts) {
                for (let facet: Cell.Facet in first.Facets) {
                    let v: Vector3D = facet.Verts.First();
                    v = (v * m_settings.Scale);
                    System.Diagnostics.Trace.WriteLine(string.Format("Vert: {0}", v));
                }

            }

            //  Recurse.
            let level: number = 1;
            let completedCellCenters: HashSet<Vector3D> = new HashSet<Vector3D>();
            completedCellCenters.Add(first.ID);
            let completedEdges: Record<Cell.Edge, number> = new Record<Cell.Edge, number>(new Cell.EdgeEqualityComparer());
            //  Values are recursion level, so we can save this out.
            let completedFacets: HashSet<Sphere> = new HashSet<Sphere>(first.Facets.Select(() => {  }, f.Sphere));
            if (H3.CellOk(first)) {
                Util.AddEdges(first, level, completedEdges);
            }

            let starting: List<Cell> = new List<Cell>();
            starting.Add(first);
            let completedCells: List<Cell> = new List<Cell>();
            completedCells.Add(first);
            H3.ReflectRecursive(level, starting, completedCellCenters, completedEdges, completedCells, completedFacets);
            let finite: boolean = (cellScale != 1);
            let thresh: number;
            1;
            let looking: Vector3D = new Vector3D(0, 0, -1);
            let culled = completedEdges.Keys.Where(() => {  }, ((e.Start.Dot(looking) > thresh)
                            && (e.End.Dot(looking) > thresh))).ToArray();
            completedEdges = new Record<Cell.Edge, number>();
            for (let c in culled) {
                completedEdges[c] = 1;
            }

            H3.RemoveDanglingEdgesRecursive(completedEdges);
            H3.SaveToFile(honeycombString, completedEdges, finite);
            // PovRay.AppendFacets( completedCells.ToArray(), m_baseDir + honeycombString + ".pov" );
        }

        public static SaveToFile(honeycombString: string, edges: Cell.Edge[], finite: boolean, append: boolean = false) {
            H3.SaveToFile(honeycombString, edges.ToRecord(() => {  }, e, () => {  }, 1), finite, append);
        }

        public static SaveToFile(honeycombString: string, edges: Record<Cell.Edge, number>, finite: boolean, append: boolean = false) {
            // H3.Util.LogMinSize( edges );
            if ((m_settings.Output == Output.STL)) {
                H3.MeshEdges(honeycombString, edges, finite);
            }
            else {
                PovRay.WriteH3Edges(new PovRay.Parameters(), edges.Keys.ToArray(), (m_baseDir
                                + (honeycombString + ".pov")), append);
            }

        }

        public static AppendFacets(honeycombString: string, cells: H3.Cell[]) {
            PovRay.AppendFacets(cells, (m_baseDir
                            + (honeycombString + ".pov")));
        }

        public static MeshEdges(honeycombString: string, edges: Record<Cell.Edge, number>, finite: boolean) {
            let mesh: Shapeways = new Shapeways();
            for (let kvp: KeyValuePair<Cell.Edge, number> in edges) {
                Util.AddToMeshInternal(mesh, kvp.Key.Start, kvp.Key.End);
            }

            H3.AddSpheres(mesh, edges);
            mesh.Mesh.Scale(m_settings.Scale);
            // SaveOutEdges( edges, m_baseDir + honeycombString + ".txt" );
            STL.SaveMeshToSTL(mesh.Mesh, (m_baseDir
                            + (honeycombString + ".stl")));
        }

        ///  <summary>
        ///  This method is for honeycombs having Euclidean tilings as cells.
        ///  Since we can't generate the full cells, these are easier to generate as duals to the other honeycombs.
        ///  </summary>
        private static GenDualHoneycombInternal(mesh: Shapeways, tiling: Tiling, honeycomb: EHoneycomb) {
            let honeycombString: string = Honeycomb.String(honeycomb, true);
            let r: number;
            let p: number;
            let q: number;
            Honeycomb.PQR(honeycomb, /* out */p, /* out */q, /* out */r);
            let inRadius: number = Honeycomb.InRadius(honeycomb);
            let facets: Cell.Facet[] = H3.GenFacetSpheres(tiling, inRadius);
            let first: Cell = new Cell(p, facets);
            //  We are already working in the ball model.
            // first = new Cell( p, GenFacets( tiling ) );
            // first.ToSphere();
            // first.ApplyMobius( m_settings.Mobius ); Done in recursive code below.
            //  Recurse.
            let completedCellCenters: HashSet<Vector3D> = new HashSet<Vector3D>();
            let completedEdges: Record<Cell.Edge, number> = new Record<Cell.Edge, number>(new Cell.EdgeEqualityComparer());
            //  Values are recursion level, so we can save this out.
            let completedFacets: HashSet<Sphere> = new HashSet<Sphere>(facets.Select(() => {  }, f.Sphere));
            let completedCells: List<Cell> = new List<Cell>();
            let starting: List<Cell> = new List<Cell>();
            starting.Add(first);
            completedCellCenters.Add(first.Center);
            completedCells.Add(first);
            let level: number = 0;
            H3.ReflectRecursiveDual(level, starting, completedCellCenters, completedCells, completedEdges, completedFacets);
            //  Can't do this on i33!
            // RemoveDanglingEdgesRecursive( completedEdges );
            // SaveToFile( honeycombString, completedEdges, finite: true );
            PovRay.AppendFacets(completedFacets.ToArray(), (m_baseDir
                            + (honeycombString + ".pov")));
            // PovRay.AppendFacets( completedCells.ToArray(), m_baseDir + honeycombString + ".pov" );
        }

        public static RemoveDanglingEdgesRecursive(edges: Record<Cell.Edge, number>) {
            const let requiredVertexValence: number = 3;
            let needRemoval: List<Cell.Edge> = new List<Cell.Edge>();
            //  Info we'll need to remove dangling edges.
            let vertexCounts: Record<Vector3D, number> = new Record<Vector3D, number>();
            for (let edge: Cell.Edge in edges.Keys) {
                H3.CheckAndAdd(vertexCounts, edge.Start);
                H3.CheckAndAdd(vertexCounts, edge.End);
            }

            for (let kvp: KeyValuePair<Cell.Edge, number> in edges) {
                let e: Cell.Edge = kvp.Key;
                if (((vertexCounts[e.Start] < requiredVertexValence)
                            || (vertexCounts[e.End] < requiredVertexValence))) {
                    needRemoval.Add(e);
                }

            }

            if ((needRemoval.Count > 0)) {
                for (let edge: Cell.Edge in needRemoval) {
                    edges.Remove(edge);
                }

                H3.RemoveDanglingEdgesRecursive(edges);
            }

        }

        ///  <summary>
        ///  This will add spheres at incomplete edges.
        ///  </summary>
        private static AddSpheres(mesh: Shapeways, edges: Record<Cell.Edge, number>) {
            let vertexCounts: Record<Vector3D, number> = new Record<Vector3D, number>();
            for (let kvp: KeyValuePair<Cell.Edge, number> in edges) {
                // if( !m_levelsToKeep.Contains( kvp.Value ) )
                //     continue;
                let e: Cell.Edge = kvp.Key;
                H3.CheckAndAdd(vertexCounts, e.Start);
                H3.CheckAndAdd(vertexCounts, e.End);
            }

            for (let kvp: KeyValuePair<Vector3D, number> in vertexCounts) {
                // if( kvp.Value < 4 ) // XXX - not always this.
                if (m_settings.ThinEdges) {
                    mesh.AddSphere(kvp.Key, H3.SizeFuncConst(new Vector3D()));
                }
                else {
                    let div2: number;
                    let div1: number;
                    H3Models.Ball.LOD_Finite(kvp.Key, kvp.Key, /* out */div1, /* out */div2, m_settings);
                    let sphere: Sphere = Util.SphereFunc(kvp.Key);
                    H3Sphere.AddSphere(mesh, sphere, div2);
                }

            }

        }

        ///  <summary>
        ///  This will add in all our bananas.
        ///  </summary>
        private static AddBananas(mesh: Shapeways, edges: Record<Cell.Edge, number>) {
            for (let kvp: KeyValuePair<Cell.Edge, number> in edges) {
                // if( !m_levelsToKeep.Contains( kvp.Value ) )
                //     continue;
                let e: Cell.Edge = kvp.Key;
                // if( CheckRange( e.Start ) &&
                //     CheckRange( e.End ) )
                //     continue;
                if (m_settings.ThinEdges) {
                    let normal: Vector3D;
                    let center: Vector3D;
                    let angleTot: number;
                    let radius: number;
                    let div: number = 10;
                    if (m_settings.Halfspace) {
                        H3Models.UHS.Geodesic(e.Start, e.End, /* out */center, /* out */radius, /* out */normal, /* out */angleTot);
                    }
                    else {
                        H3Models.Ball.Geodesic(e.Start, e.End, /* out */center, /* out */radius, /* out */normal, /* out */angleTot);
                        H3Models.Ball.LODThin(e.Start, e.End, /* out */div);
                    }

                    // mesh.AddArc( center, radius, e.Start, normal, angleTot, div, SizeFuncConst );
                    H3.Util.AddToMeshInternal(mesh, e.Start, e.End);
                }
                else {
                    Banana.AddBanana(mesh, e.Start, e.End, m_settings);
                }

            }

        }

        private static CheckAndAdd(vertexCounts: Record<Vector3D, number>, v: Vector3D) {
            let count: number;
            if (vertexCounts.TryGetValue(v, /* out */count)) {
                count++;
            }
            else {
                count = 1;
            }

            vertexCounts[v] = count;
        }

        private static SaveOutEdges(edges: Record<Cell.Edge, number>, fileName: string) {
            let sw: StreamWriter = File.CreateText(fileName);
            for (let kvp: KeyValuePair<Cell.Edge, number> in edges) {
                kvp.Key.Write(sw, kvp.Value);
            }

        }

        ///  <summary>
        ///  This method works for honeycombs having cells with a finite number of facets.
        ///  The cell vertices may be ideal or finite.
        ///  Calculations are carried out in the ball model.
        ///  </summary>
        private static ReflectRecursive(level: number, cells: List<Cell>, completedCellCenters: HashSet<Vector3D>, completedEdges: Record<Cell.Edge, number>, completedCells: List<Cell>, facets: HashSet<Sphere>) {
            //  Breadth first recursion.
            if ((0 == cells.Count)) {
                return;
            }

            if ((level > 4)) {
                return;
            }

            level++;
            let reflected: List<Cell> = new List<Cell>();
            for (let cell: Cell in cells) {
                let idealVerts: boolean = cell.IdealVerts;
                let facetSpheres: List<Sphere> = new List<Sphere>();
                for (let facet: Cell.Facet in cell.Facets) {
                    if ((facet.Sphere != null)) {
                        facetSpheres.Add(facet.Sphere);
                    }
                    else if (idealVerts) {
                        facetSpheres.Add(H3Models.Ball.OrthogonalSphere(facet.Verts[0], facet.Verts[1], facet.Verts[2]));
                    }
                    else {
                        facetSpheres.Add(H3Models.Ball.OrthogonalSphereInterior(facet.Verts[0], facet.Verts[1], facet.Verts[2]));
                    }

                }

                for (let facetSphere: Sphere in facetSpheres) {
                    if ((completedCellCenters.Count > m_settings.MaxCells)) {
                        return;
                    }

                    let newCell: Cell = cell.Clone();
                    newCell.Reflect(facetSphere);
                    if ((completedCellCenters.Contains(newCell.ID)
                                || !H3.CellOk(newCell))) {
                        // TODO: Warning!!! continue If
                    }

                    Util.AddEdges(newCell, level, completedEdges);
                    reflected.Add(newCell);
                    completedCellCenters.Add(newCell.ID);
                    completedCells.Add(newCell);
                    for (let facet: Cell.Facet in newCell.Facets) {
                        facets.Add(facet.Sphere);
                    }

                }

            }

            H3.ReflectRecursive(level, reflected, completedCellCenters, completedEdges, completedCells, facets);
        }

        private static CellOk(cell: Cell): boolean {
            return true;
            let idealVerts: boolean = cell.IdealVerts;
            //  ZZZ - maybe criterion should be total perimeter?
            for (let facet: Cell.Facet in cell.Facets) {
                for (let i: number = 0; (i < cell.P); i++) {
                    let i1: number = i;
                    let i2: number = 0;
                    // TODO: Warning!!!, inline IF is not supported ?
                    (i
                                == (cell.P - 1));
                    (i + 1);
                    let v1: Vector3D = facet.Verts[i1];
                    let v2: Vector3D = facet.Verts[i2];
                    //  Handle the cutoff differently when we are in the ball model,
                    //  and the cell vertices are finite.
                    if ((!m_settings.Halfspace
                                && !idealVerts)) {
                        let cutoff: number = m_settings.Ball_Cutoff;
                        if (((v1.Abs() > cutoff)
                                    || (v2.Abs() > cutoff))) {
                            return false;
                        }

                    }
                    else if (m_settings.Halfspace) {
                        v1 = H3Models.BallToUHS(v1);
                        v2 = H3Models.BallToUHS(v2);
                        if (((((v1.Z > m_settings.UHS_Horocycle)
                                    && (v2.Z < m_settings.UHS_Horocycle))
                                    || ((v2.Z > m_settings.UHS_Horocycle)
                                    && (v1.Z < m_settings.UHS_Horocycle)))
                                    && ((v1.Abs() < m_settings.UHS_MaxBounds)
                                    && (v2.Abs() < m_settings.UHS_MaxBounds)))) {
                            return true;
                        }

                    }
                    else {
                        let dist: number = v1.Dist(v2);
                        if (((dist < m_settings.Ball_MinLength)
                                    || (dist > m_settings.Ball_MaxLength))) {
                            return false;
                        }

                    }

                }

            }

            return true;
            // return false;    // for some UHS stuff, we reverse this.
        }

        ///  <summary>
        ///  This is to generate tilings with infinite faceted cells (dual to the input cells).
        ///  It works natively in the Ball model.
        ///  </summary>c
        private static ReflectRecursiveDual(level: number, cells: List<Cell>, completedCellCenters: HashSet<Vector3D>, completedCells: List<Cell>, completedEdges: Record<Cell.Edge, number>, facets: HashSet<Sphere>) {
            //  Breadth first recursion.
            if ((0 == cells.Count)) {
                return;
            }

            level++;
            let reflected: List<Cell> = new List<Cell>();
            for (let cell: Cell in cells) {
                let facetSpheres: List<Sphere> = new List<Sphere>();
                for (let facet: Cell.Facet in cell.Facets) {
                    facetSpheres.Add(facet.Sphere);
                    // facetSpheres.Add( H3Models.Ball.OrthogonalSphere( facet.Verts[0], facet.Verts[1], facet.Verts[2] ) );
                }

                for (let facetSphere: Sphere in facetSpheres) {
                    if ((completedCellCenters.Count > m_settings.MaxCells)) {
                        return;
                    }

                    let newCell: Cell = cell.Clone();
                    newCell.Reflect(facetSphere);
                    let start: Vector3D = H3Models.Ball.ApplyMobius(m_settings.Mobius, cell.Center);
                    let end: Vector3D = H3Models.Ball.ApplyMobius(m_settings.Mobius, newCell.Center);
                    let edge: Cell.Edge = new Cell.Edge(start, end);
                    if (completedEdges.ContainsKey(edge)) {
                        // TODO: Warning!!! continue If
                    }

                    //  This check was making things not work.
                    // if( completedCellCenters.Contains( newCell.Center ) )
                    //     continue;
                    if (!H3.EdgeOk(edge)) {
                        // TODO: Warning!!! continue If
                    }

                    reflected.Add(newCell);
                    completedCells.Add(newCell);
                    completedCellCenters.Add(newCell.Center);
                    completedEdges.Add(edge, level);
                    for (let facet: Cell.Facet in newCell.Facets) {
                        facets.Add(facet.Sphere);
                    }

                }

            }

            H3.ReflectRecursiveDual(level, reflected, completedCellCenters, completedCells, completedEdges, facets);
        }

        private static EdgeOk(edge: Cell.Edge): boolean {
            let minEdgeLength: number = m_settings.UHS_MinEdgeLength;
            let maxBounds: number = m_settings.UHS_MaxBounds;
            if (m_settings.Halfspace) {
                let start: Vector3D = H3Models.BallToUHS(edge.Start);
                let end: Vector3D = H3Models.BallToUHS(edge.End);
                if ((start.Dist(end) < minEdgeLength)) {
                    return false;
                }

                if (((start.Abs() > maxBounds)
                            || (end.Abs() > maxBounds))) {
                    return false;
                }

                return true;
            }
            else {
                // return edge.Start.Dist( edge.End ) > minEdgeLength*.5;
                //  Calculated by size testing.  This is the point where the thickness will be .025 inches, assuming we'll scale the ball by a factor of 2.
                //  This pushes the limits of Shapeways.
                // double thresh = 0.93;    // {6,3,3}
                // double thresh = 0.972;    // {7,3,3}
                // double thresh = 0.94;
                // double thresh = 0.984;
                // thresh = 0.9975;    // XXX - put in settings.
                let thresh: number = 0.999;
                return ((edge.Start.Abs() < thresh)
                            && (edge.End.Abs() < thresh));
            }

        }

        public static SizeFuncConst(v: Vector3D): number {
            return H3Models.SizeFuncConst(v, m_settings.Scale);
        }
    }
}
