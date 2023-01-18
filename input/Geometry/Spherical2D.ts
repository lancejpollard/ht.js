import Math = System.Math;
import R3.Core;
import System.Diagnostics;

module R3.Geometry {

    export class Spherical2D {

        //  The next two methods mimic Don's stuff for the hyperbolic plane.
        public static s2eNorm(sNorm: number): number {
            // if( double.IsNaN( sNorm ) )
            //     return 1.0;
            return Math.Tan(., (5 * sNorm));
        }

        public static e2sNorm(eNorm: number): number {
            return (2 * Math.Atan(eNorm));
        }

        ///  <summary>
        ///  Sphere geometry is implicit.  A radius 1 sphere with the center at the origin.
        ///  </summary>
        public static SphereToPlane(spherePoint: Vector3D): Vector3D {
            let projected: Vector3D = spherePoint.CentralProject(1);
            return projected;
        }

        ///  <summary>
        ///  Sphere geometry is implicit.  A radius 1 sphere with the center at the origin.
        ///  </summary>
        public static PlaneToSphere(planePoint: Vector3D): Vector3D {
            planePoint.Z = 0;
            //  Just to be safe.
            let magSquared: number = planePoint.MagSquared();
            let result: Vector3D = new Vector3D((2
                            * (planePoint.X / (1 + magSquared))), (2
                            * (planePoint.Y / (1 + magSquared))), ((magSquared - 1)
                            / (magSquared + 1)));
            return result;
        }

        ///  <summary>
        ///  Calculates the two poles of a great circle defined by two points.
        ///  </summary>
        public static GreatCirclePole(sphereCenter: Vector3D, p1: Vector3D, p2: Vector3D, /* out */pole1: Vector3D, /* out */pole2: Vector3D) {
            let sphereRadius: number = p1.Dist(sphereCenter);
            console.assert(Tolerance.Equal(sphereRadius, p2.Dist(sphereCenter)));
            let v1: Vector3D = (p1 - sphereCenter);
            let v2: Vector3D = (p2 - sphereCenter);
            pole1 = (v1.Cross(v2) + sphereCenter);
            pole2 = (v2.Cross(v1) + sphereCenter);
        }

        ///  <summary>
        ///  Same as above, but with implicit sphere geometry.  A radius 1 sphere with the center at the origin.
        ///  </summary>
        public static GreatCirclePole(p1: Vector3D, p2: Vector3D, /* out */pole1: Vector3D, /* out */pole2: Vector3D) {
            Spherical2D.GreatCirclePole(new Vector3D(0, 0, 0), p1, p2, /* out */pole1, /* out */pole2);
        }

        ///  <summary>
        ///  Spherical distance between two points on the plane.
        ///  </summary>
        public static SDist(p1: Vector3D, p2: Vector3D): number {
            p1 = Spherical2D.PlaneToSphere(p1);
            p2 = Spherical2D.PlaneToSphere(p2);
            return p1.AngleTo(p2);
        }
    }
}
