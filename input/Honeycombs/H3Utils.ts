import R3.Core;
import R3.Math;
import System.Collections.Generic;
import System.Linq;
import System.Numerics;
import Math = System.Math;

module R3.Geometry {

    //  XXX - move to another file
    //  http://en.wikipedia.org/wiki/Spherical_coordinate_system#Coordinate_system_conversions
    //  theta is inclination (like latitude, but from 0 to pi)
    //  phi is azimuth (like longitude)
    export class SphericalCoords {

        //  x,y,z -> r,theta,phi
        public static CartesianToSpherical(v: Vector3D): Vector3D {
            let r: number = v.Abs();
            if (Tolerance.Zero(r)) {
                return new Vector3D();
            }

            return new Vector3D(r, Math.Acos((v.Z / r)), Math.atan2(v.Y, v.X));
        }

        //  r,theta,phi -> x,y,z
        public static SphericalToCartesian(v: Vector3D): Vector3D {
            if (Tolerance.Zero(v.Abs())) {
                return new Vector3D();
            }

            return new Vector3D((v.X
                            * (Math.Sin(v.Y) * Math.Cos(v.Z))), (v.X
                            * (Math.Sin(v.Y) * Math.Sin(v.Z))), (v.X * Math.Cos(v.Y)));
        }
    }

    export class H3Models {

        public static BallToUHS(v: Vector3D): Vector3D {
            return TransformHelper(v, toUpperHalfPlane);
        }

        public static UHSToBall(v: Vector3D): Vector3D {
            if (isInfinite(v)) {
                return new Vector3D(0, 0, 1);
            }

            return TransformHelper(v, fromUpperHalfPlane);
        }

        ///  <summary>
        ///  NOTE! This should only be used if m is a transform that preserves the imaginary axis!
        ///  </summary>
        public static TransformHelper(v: Vector3D, m: Mobius): Vector3D {
            let spherical: Vector3D = SphericalCoords.CartesianToSpherical(v);
            let c1: Complex = Complex.FromPolarCoordinates(spherical.X, ((Math.PI / 2)
                            - spherical.Y));
            let c2: Complex = m.Apply(c1);
            let s2: Vector3D = new Vector3D(c2.Magnitude, ((Math.PI / 2)
                            - c2.Phase), spherical.Z);
            return SphericalCoords.SphericalToCartesian(s2);
        }

        private static ToUpperHalfPlaneMobius(): Mobius {
            let m: Mobius = new Mobius();
            m.UpperHalfPlane();
            return m;
        }

        private static FromUpperHalfPlaneMobius(): Mobius {
            return ToUpperHalfPlaneMobius().Inverse();
        }

        private static toUpperHalfPlane: Mobius = ToUpperHalfPlaneMobius();

        private static fromUpperHalfPlane: Mobius = FromUpperHalfPlaneMobius();

        public static UHSToBallNotGeodesic(s: Sphere): Sphere {
            let four: Vector3D[] = s.Get4Points();
            for (let i: number = 0; (i < 4); i++) {
                four[i] = BallToUHS(four[i]);
            }

            return Sphere.From4Points(four[0], four[1], four[2], four[3]);
        }

        ///  <summary>
        ///  NOTE: s must be geodesic! (orthogonal to boundary).
        ///  </summary>
        public static UHSToBall(s: Sphere): Sphere {
            let center: Vector3D;
            let rad: number;
            if (s.IsPlane) {
                //  Planes through the origin will stay unchanged.
                if ((s.Offset == new Vector3D())) {
                    return s.Clone();
                }

                //  It must be vertical (because it is orthogonal).
                let b1: Vector3D = H3Models.UHSToBall(Infinity.InfinityVector);
                let b2: Vector3D = H3Models.UHSToBall(s.Offset);
                let b3: Vector3D = s.Normal;
                b3.RotateXY((Math.PI / 2));
                b3 = H3Models.UHSToBall((s.Offset + b3));
                let tempS: Sphere = H3Models.Ball.OrthogonalSphere(b1, b2, b3);
                center = tempS.Center;
                rad = tempS.Radius;
            }
            else {
                let temp: Vector3D;
                if (s.Center.IsOrigin) {
                    temp = new Vector3D(s.Radius, 0, 0);
                }
                else {
                    temp = s.Center;
                    temp.Normalize();
                    temp = (temp * s.Radius);
                }

                let centerUhs: Vector3D = s.Center;
                let b1: Vector3D = H3Models.UHSToBall((centerUhs - temp));
                let b2: Vector3D = H3Models.UHSToBall((centerUhs + temp));
                H3Models.Ball.OrthogonalCircle(b1, b2, /* out */center, /* out */rad);
                //  Safer to use OrthogonalSphere?
                //  Did we project to a plane?
                if (isInfinite(rad)) {
                    temp.RotateXY((Math.PI / 2));
                    let b3: Vector3D = H3Models.UHSToBall((centerUhs + temp));
                    center = b1.Cross(b3);
                    rad = Number.POSITIVE_INFINITY;
                }

            }

            return new Sphere();
        }

        //  XXX - Not general yet, won't handle planes well.
        //  s does not have to be geodesic.
        public static BallToUHS(s: Sphere): Sphere {
            let spherePoints = s.Get4Points();
            for (let i: number = 0; (i < 4); i++) {
                spherePoints[i] = H3Models.BallToUHS(spherePoints[i]);
            }

            return Sphere.From4Points(spherePoints[0], spherePoints[1], spherePoints[2], spherePoints[3]);
        }

        public static BallToUHS(c: Circle3D): Circle3D {
            let points: Vector3D[] = c.RepresentativePoints;
            for (let i: number = 0; (i < 3); i++) {
                points[i] = H3Models.BallToUHS(points[i]);
            }

            return new Circle3D(points[0], points[1], points[2]);
        }

        ///  <summary>
        ///  Transform a geodesic sphere in the ball model to the Klein model.
        ///  Output will be a plane.
        ///  </summary>
        public static BallToKlein(s: Sphere): Sphere {
            //  If we are already a plane, no transformation is needed.
            if (s.IsPlane) {
                return s.Clone();
            }

            let closest: Vector3D = Ball.ClosestToOrigin(s);
            let p1: Vector3D = HyperbolicModels.PoincareToKlein(closest);
            //  Ideal points are the same in the Klein/Poincare models, so grab
            //  two more plane points from the ideal circle.
            let dummy: Vector3D;
            let p2: Vector3D;
            let p3: Vector3D;
            Ball.IdealPoints(s, /* out */p2, /* out */dummy, /* out */p3);
            let offset: Vector3D = p1;
            let normal: Vector3D = ((p2 - p1)).Cross((p3 - p1));
            normal.Normalize();
            if (!s.Invert) {
                normal = (normal * -1);
            }

            return Sphere.Plane(offset, normal);
        }

        ///  <summary>
        ///  Transform a sphere in the ball, such that p goes to the origin.
        ///  ZZZ - Not tested well yet.
        ///  </summary>
        public static Transform_PointToOrigin(s: Sphere, p: Vector3D): Sphere {
            let clone: Sphere = s.Clone();
            let z: Vector3D = new Vector3D(0, 0, 1);
            let a: number = p.AngleTo(z);
            let isZ: boolean = p.IsZAxis;
            if (!isZ) {
                Sphere.RotateSphere(clone, p.Cross(z), a);
            }

            let m: Mobius = new Mobius();
            m.Isometry(Geometry.Hyperbolic, 0, new Complex(0, (p.Abs() * -1)));
            clone = TransformInBall(clone, m);
            if (!isZ) {
                Sphere.RotateSphere(clone, p.Cross(z), (a * -1));
            }

            return clone;
        }

        ///  <summary>
        ///  Transform a vector in the ball, such that p goes to the origin.
        ///  ZZZ - Not tested well yet.
        ///  </summary>
        public static Transform_PointToOrigin(v: Vector3D, p: Vector3D): Vector3D {
            let z: Vector3D = new Vector3D(0, 0, 1);
            let a: number = p.AngleTo(z);
            let isZ: boolean = p.IsZAxis;
            if (!isZ) {
                v.RotateAboutAxis(p.Cross(z), a);
            }

            let m: Mobius = new Mobius();
            m.Isometry(Geometry.Hyperbolic, 0, new Complex(0, (p.Abs() * -1)));
            v = TransformHelper(v, m);
            if (!isZ) {
                v.RotateAboutAxis(p.Cross(z), (a * -1));
            }

            return v;
        }

        ///  <summary>
        ///  This applies the same Mobius transform to all vertical planes through the z axis.
        ///  NOTE: m must therefore be a mobius transform that keeps the imaginary axis constant!
        ///  NOTE: s must be geodesic! (orthogonal to boundary).
        ///  ZZZ - it would be better to use m to control the plane at infinity, e.g.
        ///           go to UHS, transform, go back (like ApplyMobius below)
        ///  </summary>
        public static TransformInBall(s: Sphere, m: Mobius): Sphere {
            if (s.IsPlane) {
                //  All planes in the ball go through the origin.
                if (!s.Offset.IsOrigin) {
                    throw new Error('Argument Error');
                }

                if (Tolerance.Equal(s.Normal.Z, 0)) {
                    return s.Clone();
                }

                //  Other planes will become spheres.
                let pointOnSphere: Vector3D = s.Normal.Perpendicular();
                pointOnSphere.Normalize();
                let b1: Vector3D = H3Models.TransformHelper(pointOnSphere, m);
                let b2: Vector3D = H3Models.TransformHelper((pointOnSphere * -1), m);
                pointOnSphere.RotateAboutAxis(s.Normal, (Math.PI / 2));
                let b3: Vector3D = H3Models.TransformHelper(pointOnSphere, m);
                return H3Models.Ball.OrthogonalSphere(b1, b2, b3);
            }
            else {
                let s3: Vector3D;
                let s1: Vector3D;
                let s2: Vector3D;
                H3Models.Ball.IdealPoints(s, /* out */s1, /* out */s2, /* out */s3);
                //  Transform the points.
                let b1: Vector3D = H3Models.TransformHelper(s1, m);
                let b2: Vector3D = H3Models.TransformHelper(s2, m);
                let b3: Vector3D = H3Models.TransformHelper(s3, m);
                return H3Models.Ball.OrthogonalSphere(b1, b2, b3);
            }

        }

        ///  <summary>
        ///  This applies the the Mobius transform to the plane at infinity.
        ///  Any Mobius is acceptable.
        ///  NOTE: s must be geodesic! (orthogonal to boundary).
        ///  </summary>
        public static TransformInUHS(s: Sphere, m: Mobius): Sphere {
            let s3: Vector3D;
            let s1: Vector3D;
            let s2: Vector3D;
            if (s.IsPlane) {
                //  It must be vertical (because it is orthogonal).
                let direction: Vector3D = s.Normal;
                direction.RotateXY((Math.PI / 2));
                s1 = s.Offset;
                s2 = (s1 + direction);
                s3 = (s1 - direction);
            }
            else {
                let offset: Vector3D = new Vector3D(s.Radius, 0, 0);
                s1 = (s.Center + offset);
                s2 = (s.Center - offset);
                s3 = offset;
                s3.RotateXY((Math.PI / 2));
                s3 = (s3 + s.Center);
            }

            let b1: Vector3D = m.Apply(s1);
            let b2: Vector3D = m.Apply(s2);
            let b3: Vector3D = m.Apply(s3);
            let boundaryCircle: Circle3D = new Circle3D(b1, b2, b3);
            let cen: Vector3D = boundaryCircle.Center;
            let off: Vector3D = new Vector3D();
            if (isInfinite(boundaryCircle.Radius)) {
                boundaryCircle.Radius = Number.POSITIVE_INFINITY;
                let normal: Vector3D = (b2 - b1);
                normal.Normalize();
                normal.RotateXY(((Math.PI / 2)
                                * -1));
                //  XXX - The direction isn't always correct.
                cen = normal;
                off = Euclidean2D.ProjectOntoLine(new Vector3D(), b1, b2);
            }

            return [][
                    Center=cen,
                    Radius=boundaryCircle.Radius,
                    Offset=off];
        }

        public static TransformInBall2(s: Sphere, m: Mobius) {
            let newSphere: Sphere = TransformInBall(s, m);
            s.Center = newSphere.Center;
            s.Radius = newSphere.Radius;
            s.Offset = newSphere.Offset;
        }

        public static TransformInUHS2(s: Sphere, m: Mobius) {
            let newSphere: Sphere = TransformInUHS(s, m);
            s.Center = newSphere.Center;
            s.Radius = newSphere.Radius;
            s.Offset = newSphere.Offset;
        }

        public static SizeFuncConst(v: Vector3D, scale: number): number {
            // return 0.01;    // 2mm diameter
            // return 0.02;
            return (3 / (2 / scale));
        }

        export class Ball {

            //  The radius of our Poincare ball model.
            private static m_pRadius: number = 1;

            ///  <summary>
            ///  Calculates the euclidean center/radius of a standard sphere transformed to the nonEuclidean point v.
            ///  The standard sphere is the sphere at the origin having euclidean radius 'radiusEuclideanOrigin'.
            ///  </summary>
            public static DupinCyclideSphere(v: Vector3D, radiusEuclideanOrigin: number, /* out */centerEuclidean: Vector3D, /* out */radiusEuclidean: number) {
                Ball.DupinCyclideSphere(v, radiusEuclideanOrigin, Geometry.Hyperbolic, /* out */centerEuclidean, /* out */radiusEuclidean);
                // ApplyMinRadiusForWiki( ref radiusEuclidean );
                // ApplyMinRadiusForPrinting( ref radiusEuclidean );
            }

            ///  <summary>
            ///  Helper that works in all geometries.
            ///  center: http://www.wolframalpha.com/input/?i=%28+%28+%28+r+%2B+p+%29+%2F+%28+1+-+r*p+%29+%29+%2B+%28+%28+-r+%2B+p+%29+%2F+%28+1+%2B+r*p+%29+%29++%29+%2F+2
            ///  radius: http://www.wolframalpha.com/input/?i=%28+%28+%28+r+%2B+p+%29+%2F+%28+1+-+r*p+%29+%29+-+%28+%28+-r+%2B+p+%29+%2F+%28+1+%2B+r*p+%29+%29++%29+%2F+2
            ///  </summary>
            public static DupinCyclideSphere(vNonEuclidean: Vector3D, radiusEuclideanOrigin: number, g: Geometry, /* out */centerEuclidean: Vector3D, /* out */radiusEuclidean: number) {
                if ((g == Geometry.Euclidean)) {
                    centerEuclidean = vNonEuclidean;
                    radiusEuclidean = radiusEuclideanOrigin;
                    return;
                }

                let p: number = vNonEuclidean.Abs();
                if (!vNonEuclidean.Normalize()) {
                    //  We are at the origin.
                    centerEuclidean = vNonEuclidean;
                    radiusEuclidean = radiusEuclideanOrigin;
                    return;
                }

                let r: number = radiusEuclideanOrigin;
                let numeratorCenter: number = (1
                            - (r * r));
                // TODO: Warning!!!, inline IF is not supported ?
                (g == Geometry.Hyperbolic);
                (1
                            + (r * r));
                let numeratorRadius: number = (1
                            - (p * p));
                // TODO: Warning!!!, inline IF is not supported ?
                (g == Geometry.Hyperbolic);
                (1
                            + (p * p));
                let center: number = (p
                            * (numeratorCenter / (1
                            - (p
                            * (p
                            * (r * r))))));
                radiusEuclidean = (r
                            * (numeratorRadius / (1
                            - (p
                            * (p
                            * (r * r))))));
                centerEuclidean = (vNonEuclidean * center);
            }

            ///  <summary>
            ///  Returns the distance from the origin in the ball model that will give a desired euclidean radius,
            ///  given a euclidean radius at the origin.  This is a helper method for shapeways planning, since
            ///  there are minimum wire thickness.  We can use this to help figure out how far we can recurse.
            ///  http://www.wolframalpha.com/input/?i=m+%3D+r+*+(+1+-+p+*+p+)+%2F+(+1+-+p+*+p+*+r+*+r+),+solve+for+p
            ///  </summary>
            public static FindLocationForDesiredRadius(radiusEuclideanOrigin: number, desiredRadiusEuclidean: number): number {
                let r: Complex = radiusEuclideanOrigin;
                let m: Complex = desiredRadiusEuclidean;
                let result: Complex = (Complex.Sqrt((m - r)) / Complex.Sqrt(((m
                                * (r * r))
                                - r)));
                return result.Real;
            }

            private static ApplyMinRadiusForWiki(/* ref */radius: number) {
                radius = Math.Max(radius, 0.0001);
                // radius = Math.Max( radius, 0.0005 );
                // radius = Math.Max( radius, 0.00001 );
            }

            private static ApplyMinRadiusForPrinting(/* ref */radius: number) {
                radius = Math.Max(radius, ((1.05 / 2)
                                / H3.m_settings.Scale));
            }

            ///  <summary>
            ///  A size function for the ball model.
            ///  Returns a radius.
            ///  </summary>
            public static SizeFunc(v: Vector3D, angularThickness: number): number {
                //  Leverage the UHS function.
                let uhs: Vector3D = BallToUHS(v);
                let result: number = UHS.SizeFunc(uhs, angularThickness);
                uhs.X = (uhs.X + result);
                let ball: Vector3D = UHSToBall(uhs);
                result = ((v - ball)).Abs();
                //  Wiki images.
                result = Math.Max(result, 0.0005);
                return result;
                //  Shapeways.
                // result = Math.Max( result, ( 1.05 /*mm*/ / 2 ) / H3.m_settings.Scale );
                // return result;
            }

            ///  <summary>
            ///  Given 2 points on the surface of the ball, calculate the center and radius of the orthogonal circle.
            ///  </summary>
            public static OrthogonalCircle(v1: Vector3D, v2: Vector3D, /* out */center: Vector3D, /* out */radius: number) {
                //  Picture at http://planetmath.org/OrthogonalCircles.html helpful for what I'm doing here.
                let sectorAngle: number = v1.AngleTo(v2);
                if (Tolerance.Equal(sectorAngle, Math.PI)) {
                    center = Infinity.InfinityVector;
                    radius = Number.POSITIVE_INFINITY;
                    return;
                }

                let distToCenter: number = (m_pRadius / Math.Cos((sectorAngle / 2)));
                center = (v1 + v2);
                center.Normalize();
                center = (center * distToCenter);
                radius = (distToCenter * Math.Sin((sectorAngle / 2)));
            }

            public static OrthogonalCircle(v1: Vector3D, v2: Vector3D): Circle3D {
                let center: Vector3D;
                let rad: number;
                Ball.OrthogonalCircle(v1, v2, /* out */center, /* out */rad);
                let normal: Vector3D = v1.Cross(v2);
                return [][
                        Center=center,
                        Normal=normal,
                        Radius=rad];
            }

            ///  <summary>
            ///  Given 2 points on the boundary of a circle, calculate the orthogonal circle.
            ///  </summary>
            public static OrthogonalCircle(c: Circle3D, v1: Vector3D, v2: Vector3D): Circle3D {
                //  Move/Scale c to unit circle.
                let offset: Vector3D = c.Center;
                let scale: number = c.Radius;
                v1 = (v1 - offset);
                v2 = (v2 - offset);
                scale;
                scale;
                //  Call the other method.
                let center: Vector3D;
                let rad: number;
                Ball.OrthogonalCircle(v1, v2, /* out */center, /* out */rad);
                rad = (rad * scale);
                center = (center + offset);
                //  Needs testing.
                throw new Error('Not implemented');
            }

            ///  <summary>
            ///  Given 2 points in the interior of the ball, calculate the center and radius of the orthogonal circle.
            ///  One point may optionally be on the boundary, but one should be in the interior.
            ///  If both points are on the boundary, we'll fall back on our other method.
            ///  </summary>
            public static OrthogonalCircleInterior(v1: Vector3D, v2: Vector3D, /* out */circle: Circle3D) {
                if ((Tolerance.Equal(v1.Abs(), 1) && Tolerance.Equal(v2.Abs(), 1))) {
                    circle = Ball.OrthogonalCircle(v1, v2);
                    return;
                }

                //  http://www.math.washington.edu/~king/coursedir/m445w06/ortho/01-07-ortho-to3.html
                //  http://www.youtube.com/watch?v=Bkvo09KE1zo
                let interior: Vector3D = Tolerance.Equal(v1.Abs(), 1);
                // TODO: Warning!!!, inline IF is not supported ?
                // TODO: Warning!!!! NULL EXPRESSION DETECTED...
                ;
                let ball: Sphere = new Sphere();
                let reflected: Vector3D = ball.ReflectPoint(interior);
                circle = new Circle3D(reflected, v1, v2);
            }

            ///  <summary>
            ///  Find the sphere defined by 3 points on the unit sphere, and orthogonal to the unit sphere.
            ///  Returns null if points are not on the unit sphere.
            ///  </summary>
            public static OrthogonalSphere(b1: Vector3D, b2: Vector3D, b3: Vector3D): Sphere {
                let unitSphere: Sphere = new Sphere();
                if ((!unitSphere.IsPointOn(b1)
                            || (!unitSphere.IsPointOn(b2)
                            || !unitSphere.IsPointOn(b3)))) {
                    return null;
                }

                let c: Circle3D = new Circle3D(b1, b2, b3);
                //  Same impl as orthogonal circles now.
                let center: Vector3D;
                let radius: number;
                Ball.OrthogonalCircle(b1, (b1
                                + ((c.Center - b1)
                                * 2)), /* out */center, /* out */radius);
                let sphere: Sphere = new Sphere();
                if (isInfinite(radius)) {
                    //  Have the center act as a normal.
                    sphere.Center = c.Normal;
                    sphere.Radius = Number.POSITIVE_INFINITY;
                }
                else {
                    sphere.Center = center;
                    sphere.Radius = radius;
                }

                return sphere;
            }

            ///  <summary>
            ///  Given a geodesic sphere, returns it's intersection with the boundary plane.
            ///  </summary>
            public static IdealCircle(s: Sphere): Circle3D {
                let s3: Vector3D;
                let s1: Vector3D;
                let s2: Vector3D;
                Ball.IdealPoints(s, /* out */s1, /* out */s2, /* out */s3);
                return new Circle3D(s1, s2, s3);
            }

            ///  <summary>
            ///  Given a geodesic sphere, calculates 3 ideal points of the sphere.
            ///  NOTE: s1 and s2 will be antipodal on the ideal circle.
            ///  </summary>
            public static IdealPoints(s: Sphere, /* out */s1: Vector3D, /* out */s2: Vector3D, /* out */s3: Vector3D) {
                //  Get two points on the ball and sphere.
                //  http://mathworld.wolfram.com/OrthogonalCircles.html
                //  Orthogonal circles, plus some right angle stuff...
                let r: number = s.Radius;
                let direction: Vector3D = s.Center;
                let perp: Vector3D = direction.Perpendicular();
                direction.Normalize();
                s1 = direction;
                s2 = direction;
                let alpha: number = Math.Atan(r);
                s1.RotateAboutAxis(perp, alpha);
                s2.RotateAboutAxis(perp, (alpha * -1));
                s3 = s1;
                s3.RotateAboutAxis(direction, (Math.PI / 2));
            }

            ///  <summary>
            ///  Find the sphere defined by 3 points in the interior of the unit sphere, and orthogonal to the unit sphere.
            ///  </summary>
            public static OrthogonalSphereInterior(c1: Vector3D, c2: Vector3D, c3: Vector3D): Sphere {
                //  Use circle points to find points on our boundary.
                let dummy: Vector3D;
                let b1: Vector3D;
                let b2: Vector3D;
                let b3: Vector3D;
                Ball.GeodesicIdealEndpoints(c1, c2, /* out */b1, /* out */b2);
                Ball.GeodesicIdealEndpoints(c3, c2, /* out */b3, /* out */dummy);
                return Ball.OrthogonalSphere(b1, b2, b3);
            }

            ///  <summary>
            ///  Find an orthogonal sphere defined by a single interior point.
            ///  This point is the unique point on the sphere that is furthest from the ball boundary.
            ///  (equivalently, closest to the origin)
            ///  </summary>
            public static OrthogonalSphereInterior(v: Vector3D): Sphere {
                //  r = radius of sphere
                //  c = distance from origin to passed in point
                //  http://www.wolframalpha.com/input/?i=%28c%2Br%29%5E2+%3D+1+%2B+r%5E2%2C+solve+for+r
                let c: number = v.Abs();
                let r: number = ((((c * c)
                            - 1) / (2 * c))
                            * -1);
                v.Normalize();
                return new Sphere();
            }

            ///  <summary>
            ///  Given a geodesic sphere, find the point closest to the origin.
            ///  </summary>
            public static ClosestToOrigin(s: Sphere): Vector3D {
                return s.ProjectToSurface(new Vector3D());
            }

            ///  <summary>
            ///  Given a geodesic circle, find the point closest to the origin.
            ///  </summary>
            public static ClosestToOrigin(c: Circle3D): Vector3D {
                let s: Sphere = [][
                        Center=c.Center,
                        Radius=c.Radius];
                return Ball.ClosestToOrigin(s);
            }

            ///  <summary>
            ///  Returns the hyperbolic distance between two points.
            ///  </summary>
            public static HDist(u: Vector3D, v: Vector3D): number {
                let isometricInvariant: number = (2
                            * (((u - v)).MagSquared()
                            / ((1 - u.MagSquared()) * (1 - v.MagSquared()))));
                return DonHatch.acosh((1 + isometricInvariant));
            }

            ///  <summary>
            ///  Returns the spherical distance between two points.
            ///  </summary>
            public static SDist(u: Vector3D, v: Vector3D): number {
                //  Likely a more efficient way to do this, analagous to HDist func.
                let v_: Vector3D = Sterographic.R3toS3(v);
                let u_: Vector3D = Sterographic.R3toS3(u);
                return u_.AngleTo(v_);
            }

            ///  <summary>
            ///  Calculate the hyperbolic midpoint of an edge.
            ///  Only works for non-ideal edges at the moment.
            ///  </summary>
            public static Midpoint(edge: H3.Cell.Edge): Vector3D {
                //  Special case if edge has endpoint on origin.
                //  XXX - Really this should be special case anytime edge goes through origin.
                let e1: Vector3D = edge.Start;
                let e2: Vector3D = edge.End;
                if ((e1.IsOrigin || e2.IsOrigin)) {
                    if (e2.IsOrigin) {
                        Utils.Swap<Vector3D>(/* ref */e1, /* ref */e2);
                    }

                    return Ball.HalfTo(e2);
                }

                //  No doubt there is a much better way, but
                //  work in H2 slice transformed to xy plane, with e1 on x-axis.
                let angle: number = e1.AngleTo(e2);
                //  always <= 180
                e1 = new Vector3D(e1.Abs(), 0);
                e2 = new Vector3D(e2.Abs(), 0);
                e2.RotateXY(angle);
                //  Mobius that will move e1 to origin.
                let m: Mobius = new Mobius();
                m.Isometry(Geometry.Hyperbolic, 0, (e1 * -1));
                e2 = m.Apply(e2);
                let midOnPlane: Vector3D = Ball.HalfTo(e2);
                midOnPlane = m.Inverse().Apply(midOnPlane);
                let midAngle: number = e1.AngleTo(midOnPlane);
                let mid: Vector3D = edge.Start;
                mid.RotateAboutAxis(edge.Start.Cross(edge.End), midAngle);
                mid.Normalize(midOnPlane.Abs());
                return mid;
            }

            private static HalfTo(v: Vector3D): Vector3D {
                let distHyperbolic: number = DonHatch.e2hNorm(v.Abs());
                let halfDistEuclidean: number = DonHatch.h2eNorm((distHyperbolic / 2));
                let result: Vector3D = v;
                result.Normalize(halfDistEuclidean);
                return result;
            }

            ///  <summary>
            ///  Given two points (in the ball model), find the endpoints
            ///  of the associated geodesic that lie on the boundary.
            ///  </summary>
            public static GeodesicIdealEndpoints(v1: Vector3D, v2: Vector3D, /* out */b1: Vector3D, /* out */b2: Vector3D) {
                if ((Tolerance.Equal(v1.MagSquared(), 1) && Tolerance.Equal(v2.MagSquared(), 1))) {
                    b1 = v1;
                    b2 = v2;
                    return;
                }

                //  Leverage the UHS method.
                let v1_UHS: Vector3D = H3Models.BallToUHS(v1);
                let v2_UHS: Vector3D = H3Models.BallToUHS(v2);
                H3Models.UHS.GeodesicIdealEndpoints(v1_UHS, v2_UHS, /* out */b1, /* out */b2);
                b1 = H3Models.UHSToBall(b1);
                b2 = H3Models.UHSToBall(b2);
            }

            public static Geodesic(v1: Vector3D, v2: Vector3D, /* out */center: Vector3D, /* out */radius: number, /* out */normal: Vector3D, /* out */angleTot: number) {
                let finite: boolean = (!Tolerance.Equal(v1.MagSquared(), 1)
                            || !Tolerance.Equal(v2.MagSquared(), 1));
                if (finite) {
                    let c: Circle3D;
                    H3Models.Ball.OrthogonalCircleInterior(v1, v2, /* out */c);
                    center = c.Center;
                    radius = c.Radius;
                }
                else {
                    H3Models.Ball.OrthogonalCircle(v1, v2, /* out */center, /* out */radius);
                }

                let t1: Vector3D = (v1 - center);
                let t2: Vector3D = (v2 - center);
                t1.Normalize();
                //  This was necessary so that the cross product below didn't get too small.
                t2.Normalize();
                normal = t1.Cross(t2);
                normal.Normalize();
                angleTot = t1.AngleTo(t2);
            }

            ///  <summary>
            ///  Calculate points along a geodesic segment from v1 to v2.
            ///  quality can vary from 0 to 1.
            ///  </summary>
            public static GeodesicPoints(v1: Vector3D, v2: Vector3D, quality: number = 1): Vector3D[] {
                let max: number = 57;
                let div: number = 40;
                //  Wiki
                div = max;
                // LODThin( v1, v2, out div );
                //  Account for quality.
                div = (<number>((Math.Pow(quality, 1) * div)));
                //  Keep in reasonable range.
                div = Math.Max(div, 4);
                div = Math.min(div, max);
                return Ball.GeodesicPoints(v1, v2, div);
            }

            ///  <summary>
            ///  Calculate points along a geodesic segment from v1 to v2.
            ///  </summary>
            public static GeodesicPoints(v1: Vector3D, v2: Vector3D, div: number): Vector3D[] {
                let normal: Vector3D;
                let center: Vector3D;
                let angleTot: number;
                let radius: number;
                Ball.Geodesic(v1, v2, /* out */center, /* out */radius, /* out */normal, /* out */angleTot);
                if ((isInfinite(radius)
                            || (Tolerance.Zero(v1.Abs()) || Tolerance.Zero(v2.Abs())))) {
                    let seg: Segment = Segment.Line(v1, v2);
                    return seg.Subdivide(div);
                    // return new Vector3D[] { v1, v2 };
                }
                else {
                    return Shapeways.CalcArcPoints(center, radius, v1, normal, angleTot, div);
                }

            }

            public static LODThin(e1: Vector3D, e2: Vector3D, /* out */div: number) {
                let maxHit: number = 12;
                // Vector3D avg = ( e1 + e2 ) / 2;
                // int hit = (int)( avg.Abs() * maxHit );
                let dist: number = e1.Dist(e1);
                let hit: number = ((<number>(dist)) * (20 * maxHit));
                div = (20 - hit);
            }

            ///  <summary>
            ///  LOD
            ///  </summary>
            public static LOD_Finite(e1: Vector3D, e2: Vector3D, /* out */div1: number, /* out */div2: number, settings: H3.Settings) {
                // if( settings.Halfspace )
                //     throw new Error('Not implemented');
                let maxHit: number = 7;
                let hit: number = (<number>((Math.Pow(Math.min(e1.Abs(), e2.Abs()), 3) * maxHit)));
                div1 = (10 - hit);
                div2 = (35
                            - (hit * 3));
            }

            public static LOD_Ideal(e1: Vector3D, e2: Vector3D, /* out */div1: number, /* out */div2: number, settings: H3.Settings) {
                if (settings.Halfspace) {
                    throw new Error('Not implemented');
                }

                div1 = 13;
                div2 = (<number>((5
                            + (Math.sqrt(e1.Dist(e2)) * 10))));
            }

            ///  <summary>
            ///  Helper to apply a Mobius to the ball model.
            ///  Vector is taken to UHS, mobius applied, then taken back.
            ///  </summary>
            public static ApplyMobius(m: Mobius, v: Vector3D): Vector3D {
                v = BallToUHS(v);
                v = m.ApplyToQuaternion(v);
                return UHSToBall(v);
            }
        }

        export class UHS {

            ///  <summary>
            ///  Hyperbolic to Euclidean norm
            ///  The output is a vertical distance from 0,0,0
            ///  </summary>
            public static ToE(hNorm: number): number {
                let eNorm: number = DonHatch.h2eNorm(hNorm);
                let uhs: Vector3D = H3Models.BallToUHS(new Vector3D(0, 0, eNorm));
                return uhs.Z;
            }

            ///  <summary>
            ///  Euclidean to UHS norm
            ///  </summary>
            public static FromE(eNorm: number): number {
                throw new Error('Not implemented');
            }

            ///  <summary>
            ///  Hyperbolic to Euclidean norml
            ///  The output is a horizontal distance from 0,0,z
            ///  </summary>
            public static ToEHorizontal(hNorm: number, z: number): number {
                //  https://en.wikipedia.org/wiki/Poincar%C3%A9_half-plane_model
                let offset: number = Math.sqrt(((DonHatch.cosh(hNorm) - 1) * (2
                                * (z * z))));
                return offset;
            }

            ///  <summary>
            ///  A size function for the UHS model.
            ///  Returns a radius.
            ///  </summary>
            public static SizeFunc(v: Vector3D, angularThickness: number): number {
                let size: number = (v.Z * Math.Tan(angularThickness));
                // if( size == 0 )
                //     size = 0.001;
                return size;
            }

            ///  <summary>
            ///  Given two points (in the UHS model), find the endpoints
            ///  of the associated geodesic that lie on the z=0 plane.
            ///  </summary>
            public static GeodesicIdealEndpoints(v1: Vector3D, v2: Vector3D, /* out */z1: Vector3D, /* out */z2: Vector3D) {
                //  We have to special case when geodesic is vertical (parallel to z axis).
                let diff: Vector3D = (v2 - v1);
                let diffFlat: Vector3D = new Vector3D(diff.X, diff.Y);
                if (Tolerance.Zero(diffFlat.Abs())) {
                    let basePoint: Vector3D = new Vector3D(v1.X, v1.Y);
                    z1 = (diff.Z > 0);
                    // TODO: Warning!!!, inline IF is not supported ?
                    // TODO: Warning!!!! NULL EXPRESSION DETECTED...
                    ;
                    z2 = (diff.Z < 0);
                    // TODO: Warning!!!, inline IF is not supported ?
                    // TODO: Warning!!!! NULL EXPRESSION DETECTED...
                    ;
                }
                else {
                    if ((Tolerance.Zero(v1.Z) && Tolerance.Zero(v2.Z))) {
                        z1 = v1;
                        z2 = v2;
                        return;
                    }

                    //  If one point is ideal, we need to not reflect that one!
                    let swapped: boolean = false;
                    if (Tolerance.Zero(v1.Z)) {
                        Utils.SwapPoints(/* ref */v1, /* ref */v2);
                        swapped = true;
                    }

                    let v1_reflected: Vector3D = v1;
                    v1_reflected.Z = (v1_reflected.Z * -1);
                    let c: Circle3D = new Circle3D(v1_reflected, v1, v2);
                    let radial: Vector3D = (v1 - c.Center);
                    radial.Z = 0;
                    if (!radial.Normalize()) {
                        radial = (v2 - c.Center);
                        radial.Z = 0;
                        if (!radial.Normalize()) {
                            System.Diagnostics.Debugger.Break();
                        }

                    }

                    radial = (radial * c.Radius);
                    z1 = (c.Center + radial);
                    z2 = (c.Center - radial);
                    //  Make sure the order will be right.
                    //  (z1 closest to v1 along arc).
                    if ((v1.Dist(z1) > v2.Dist(z1))) {
                        Utils.SwapPoints(/* ref */z1, /* ref */z2);
                    }

                    if (swapped) {
                        Utils.SwapPoints(/* ref */z1, /* ref */z2);
                    }

                }

            }

            ///  <summary>
            ///  Takes a set of finite edges, and returns a new set of ideal edges which touch the boundary.
            ///  Duplicate ideal edges are removed (since multiple finite edges can result in the same ideal edge).
            ///  </summary>
            public static ExtendEdges(edges: IEnumerable<H3.Cell.Edge>): IEnumerable<H3.Cell.Edge> {
                let infiniteEdges: HashSet<H3.Cell.Edge> = new HashSet<H3.Cell.Edge>();
                for (let edge: H3.Cell.Edge in edges) {
                    let end_i: Vector3D;
                    let start_i: Vector3D;
                    H3Models.Ball.GeodesicIdealEndpoints(edge.Start, edge.End, /* out */start_i, /* out */end_i);
                    infiniteEdges.Add(new H3.Cell.Edge(start_i, end_i));
                }

                return infiniteEdges;
            }

            public static Geodesic(v1: Vector3D, v2: Vector3D, /* out */center: Vector3D, /* out */radius: number) {
                let dummy: Vector3D;
                let dummyAngle: number;
                UHS.Geodesic(v1, v2, /* out */center, /* out */radius, /* out */dummy, /* out */dummyAngle);
            }

            public static Geodesic(v1: Vector3D, v2: Vector3D, /* out */center: Vector3D, /* out */radius: number, /* out */normal: Vector3D, /* out */angleTot: number) {
                let _v2: Vector3D;
                let _v1: Vector3D;
                UHS.GeodesicIdealEndpoints(v1, v2, /* out */_v1, /* out */_v2);
                center = ((_v1 + _v2)
                            / 2);
                radius = (_v1.Dist(_v2) / 2);
                let vertical: Vector3D = new Vector3D(center.X, center.Y, radius);
                normal = ((_v1 - center)).Cross((vertical - center));
                normal.Normalize();
                angleTot = ((v1 - center)).AngleTo((v2 - center));
            }

            ///  <summary>
            ///  Calculate points along a geodesic segment from v1 to v2.
            ///  </summary>
            public static GeodesicPoints(v1: Vector3D, v2: Vector3D): Vector3D[] {
                return UHS.GeodesicPoints(v1, v2, 37);
            }

            ///  <summary>
            ///  Calculate points along a geodesic segment from v1 to v2.
            ///  </summary>
            public static GeodesicPoints(v1: Vector3D, v2: Vector3D, div: number): Vector3D[] {
                let normal: Vector3D;
                let center: Vector3D;
                let angleTot: number;
                let radius: number;
                UHS.Geodesic(v1, v2, /* out */center, /* out */radius, /* out */normal, /* out */angleTot);
                //  Vertical?
                if (isInfinite(radius)) {
                    let seg: Segment = Segment.Line(v1, v2);
                    return seg.Subdivide(div);
                }

                return Shapeways.CalcArcPoints(center, radius, v1, normal, angleTot, div);
            }

            ///  <summary>
            ///  Given a geodesic sphere, returns it's intersection with the boundary plane.
            ///  </summary>
            public static IdealCircle(s: Sphere): Circle {
                let s3: Vector3D;
                let s1: Vector3D;
                let s2: Vector3D;
                UHS.IdealPoints(s, /* out */s1, /* out */s2, /* out */s3);
                return new Circle(s1, s2, s3);
            }

            ///  <summary>
            ///  Given a geodesic sphere, calculates 3 ideal points of the sphere.
            ///  </summary>
            public static IdealPoints(s: Sphere, /* out */s1: Vector3D, /* out */s2: Vector3D, /* out */s3: Vector3D) {
                if (s.IsPlane) {
                    s1 = s.Offset;
                    s3 = s.Normal;
                    s2 = s.Normal;
                    s2.RotateXY((Math.PI / 2));
                    s2 = (s2 + s1);
                    s3.RotateXY(((Math.PI / 2)
                                    * -1));
                    s3 = (s3 + s1);
                    return;
                }

                let cen: Vector3D = s.Center;
                cen.Z = 0;
                s1 = new Vector3D(s.Radius, 0);
                s3 = s1;
                s2 = s1;
                s2.RotateXY((Math.PI / 2));
                s3.RotateXY(Math.PI);
                s1 = (s1 + cen);
                s2 = (s2 + cen);
                s3 = (s3 + cen);
            }
        }
    }

    export class H3Sphere {

        public static AddSphere(mesh: Shapeways, s: Sphere, div: number) {
            mesh.Div = div;
            mesh.AddSphere(s.Center, s.Radius);
        }

        ///  <summary>
        ///  A helper for adding a sphere.  center should be passed in the ball model.
        ///  The approach is similar to how we do the bananas below.
        ///  </summary>
        public static AddSphere(mesh: Shapeways, center: Vector3D, settings: H3.Settings) {
            let centerUHS: Vector3D = H3Models.BallToUHS(center);
            //  Find the Mobius we need.
            //  We'll do this in two steps.
            //  (1) Find a mobius taking center to (0,0,h).
            //  (2) Deal with scaling to a height of 1.
            let flattened: Vector3D = centerUHS;
            flattened.Z = 0;
            let m1: Mobius = new Mobius(flattened, Complex.One, Infinity.InfinityVector);
            let centerUHS_transformed: Vector3D = m1.ApplyToQuaternion(centerUHS);
            let scale: number = (1 / centerUHS_transformed.Z);
            let m2: Mobius = new Mobius(scale, Complex.Zero, Complex.Zero, Complex.One);
            let m: Mobius = (m2 * m1);
            //  Compose them (multiply in reverse order).
            //  Add the sphere at the Ball origin.
            //  It will *always* be generated with the same radius.
            let tempMesh: Shapeways = new Shapeways();
            tempMesh.AddSphere(new Vector3D(), H3Models.Ball.SizeFunc(new Vector3D(), settings.AngularThickness));
            //  Unwind the transforms.
            for (let i: number = 0; (i < tempMesh.Mesh.Triangles.Count); i++) {
                tempMesh.Mesh.Triangles[i] = new Mesh.Triangle(H3Models.BallToUHS(tempMesh.Mesh.Triangles[i].a), H3Models.BallToUHS(tempMesh.Mesh.Triangles[i].b), H3Models.BallToUHS(tempMesh.Mesh.Triangles[i].c));
            }

            Banana.TakePointsBack(tempMesh.Mesh, m.Inverse(), settings);
            mesh.Mesh.Triangles.AddRange(tempMesh.Mesh.Triangles);
        }
    }

    ///  <summary>
    ///  A helper class for doing proper calculations of H3 "bananas"
    ///
    ///  Henry thought this out.  His words:
    ///  Take a pair of points giving the ends of the geodesic.
    ///  If the points are in the ball model, move them to the UHS model.
    ///  Find the endpoints of the geodesic through the two points on the z=0 plane in the UHS model.
    ///  Apply the Mobius transform that takes the geodesic to the z-axis, and takes the first endpoint of the segment to height 1, and so the other to height h>1.
    ///  The hyperbolic banana is a truncated cone in this configuration with axis the z-axis, truncated at 1 and h. The slope of the cone is the parameter for the thickness of the banana.
    ///  Choose points for approximating the cone with polygons. We have some number of circles spaced vertically up the cone, and lines perpendicular to these circles that go through the origin. The intersections between the circles and the lines are our vertices. We want the lines with equal angle spacing around the z-axis, and the circles spaced exponentially up the z-axis, with one circle at 1 and one at h.
    ///  Now map those vertices forward through all of our transformations.
    ///  </summary>
    export class Banana {

        ///  <summary>
        ///  Add an ideal banana to our mesh.  Passed in edge should be in Ball model.
        ///  </summary>
        public static AddIdealBanana(mesh: Shapeways, e1: Vector3D, e2: Vector3D, settings: H3.Settings) {
            let z1: Vector3D = H3Models.BallToUHS(e1);
            let z2: Vector3D = H3Models.BallToUHS(e2);
            //  Mobius taking z1,z2 to origin,inf
            let dummy: Complex = new Complex(Math.E, Math.PI);
            let m: Mobius = new Mobius(z1, dummy, z2);
            //  Make our truncated cone.  We need to deal with the two ideal endpoints specially.
            let points: List<Vector3D> = new List<Vector3D>();
            let logHeight: number = 2;
            //  XXX - magic number, and going to cause problems for infinity checks if too big.
            let div2: number;
            let div1: number;
            H3Models.Ball.LOD_Ideal(e1, e2, /* out */div1, /* out */div2, settings);
            let increment: number = (logHeight / div1);
            for (let i: number = (div1 * -1); (i <= div1); i += 2) {
                points.Add(new Vector3D(0, 0, Math.exp((increment * i))));
            }

            let tempMesh: Shapeways = new Shapeways();
            tempMesh.Div = div2;
            let sizeFunc: System.Func<Vector3D, number>;
            H3Models.UHS.SizeFunc(v, settings.AngularThickness);
            // Mesh.OpenCylinder...  pass in two ideal endpoints?
            tempMesh.AddCurve(points.ToArray(), sizeFunc, new Vector3D(), Infinity.InfinityVector);
            //  Unwind the transforms.
            Banana.TakePointsBack(tempMesh.Mesh, m.Inverse(), settings);
            mesh.Mesh.Triangles.AddRange(tempMesh.Mesh.Triangles);
        }

        ///  <summary>
        ///  Add a finite (truncated) banana to our mesh.  Passed in edge should be in Ball model.
        ///  </summary>
        public static AddBanana(mesh: Shapeways, e1: Vector3D, e2: Vector3D, settings: H3.Settings) {
            let e1UHS: Vector3D = H3Models.BallToUHS(e1);
            let e2UHS: Vector3D = H3Models.BallToUHS(e2);
            //  Endpoints of the goedesic on the z=0 plane.
            let z2: Vector3D;
            let z1: Vector3D;
            H3Models.UHS.GeodesicIdealEndpoints(e1UHS, e2UHS, /* out */z1, /* out */z2);
            //  XXX - Do we want to do a better job worrying about rotation here?
            //  (multiply by complex number with certain imaginary part as well)
            // Vector3D z3 = ( z1 + z2 ) / 2;
            // if( isInfinite( z3 ) )
            //     z3 = new Vector3D( 1, 0 );
            let z3: Vector3D = new Vector3D(Math.E, Math.PI);
            //  This should vary the rotations a bunch.
            //  Find the Mobius we need.
            //  We'll do this in two steps.
            //  (1) Find a mobius taking z1,z2 to origin,inf
            //  (2) Deal with scaling e1 to a height of 1.
            let m1: Mobius = new Mobius(z1, z3, z2);
            let e1UHS_transformed: Vector3D = m1.ApplyToQuaternion(e1UHS);
            let scale: number = (1 / e1UHS_transformed.Z);
            let m2: Mobius = Mobius.Scale(scale);
            let m: Mobius = (m2 * m1);
            //  Compose them (multiply in reverse order).
            let e2UHS_transformed: Vector3D = m.ApplyToQuaternion(e2UHS);
            //  Make our truncated cone.
            //  For regular tilings, we really would only need to do this once for a given LOD.
            let points: List<Vector3D> = new List<Vector3D>();
            let logHeight: number = Math.log(e2UHS_transformed.Z);
            if ((logHeight < 0)) {
                throw new System.Exception("impl issue");
            }

            let div2: number;
            let div1: number;
            H3Models.Ball.LOD_Finite(e1, e2, /* out */div1, /* out */div2, settings);
            let increment: number = (logHeight / div1);
            for (let i: number = 0; (i <= div1); i++) {
                let h: number = (increment * i);
                //  This is to keep different bananas from sharing exactly coincident vertices.
                let tinyOffset: number = 0.001;
                if ((i == 0)) {
                    h = (h - tinyOffset);
                }

                if ((i == div1)) {
                    h = (h + tinyOffset);
                }

                let point: Vector3D = new Vector3D(0, 0, Math.exp(h));
                points.Add(point);
            }

            let tempMesh: Shapeways = new Shapeways();
            tempMesh.Div = div2;
            tempMesh.AddCurve(points.ToArray(), () => {  }, H3Models.UHS.SizeFunc(v, settings.AngularThickness));
            //  Unwind the transforms.
            Banana.TakePointsBack(tempMesh.Mesh, m.Inverse(), settings);
            mesh.Mesh.Triangles.AddRange(tempMesh.Mesh.Triangles);
        }

        private /* internal */ static TakePointsBack(mesh: Mesh, m: Mobius, settings: H3.Settings) {
            for (let i: number = 0; (i < mesh.Triangles.Count); i++) {
                mesh.Triangles[i] = new Mesh.Triangle(m.ApplyToQuaternion(mesh.Triangles[i].a), m.ApplyToQuaternion(mesh.Triangles[i].b), m.ApplyToQuaternion(mesh.Triangles[i].c));
            }

            //  Take all points back to Ball, if needed.
            if (!settings.Halfspace) {
                for (let i: number = 0; (i < mesh.Triangles.Count); i++) {
                    mesh.Triangles[i] = new Mesh.Triangle(H3Models.UHSToBall(mesh.Triangles[i].a), H3Models.UHSToBall(mesh.Triangles[i].b), H3Models.UHSToBall(mesh.Triangles[i].c));
                }

            }

        }
    }
}
