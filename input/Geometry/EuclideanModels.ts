import R3.Geometry;
import R3.Math;
import System.Numerics;
import Math = System.Math;

module R3.Geometry {

    export enum EuclideanModel {

        Isometric,

        Conformal,

        Disk,

        UpperHalfPlane,

        Spiral,

        Loxodromic,
    }

    export class EuclideanModels {

        public static DiskToIsometric(v: Vector3D): Vector3D {
            //  ZZZ - Check that this is correct (it's quite close if not!)
            return SphericalModels.StereoToGnomonic(v);
        }

        public static UpperHalfPlaneToIsometric(v: Vector3D): Vector3D {
            v = HyperbolicModels.UpperToPoincare(v);
            v = SphericalModels.StereoToGnomonic(v);
            return v;
        }

        public static SpiralToIsometric(v: Vector3D, p: number, m: number, n: number): Vector3D {
            let vc: Complex = v.ToComplex();
            v = new Vector3D(Math.log(vc.Magnitude), vc.Phase);
            let e1: Vector3D = new Vector3D(0, 1);
            let e2: Vector3D;
            switch (p) {
                case 3:
                    e2 = new Vector3D();
                    break;
                case 4:
                    e2 = new Vector3D();
                    break;
                case 6:
                    e2 = new Vector3D();
                    break;
                default:
                    throw new Error('Argument Error');
                    break;
            }

            let scale: number = Math.sqrt(((m * m)
                            + (n * n)));
            let a: number = Euclidean2D.AngleToClock(new Vector3D(0, 1), new Vector3D(m, n));
            v.RotateXY(a);
            //  Rotate
            v = (v * scale);
            //  Scale
            v = (v
                        * (Math.sqrt(2)
                        * (Geometry2D.EuclideanHypotenuse / (2 * Math.PI))));
            v.RotateXY((Math.PI / 4));
            return v;
        }

        public static LoxodromicToIsometric(v: Vector3D, p: number, m: number, n: number): Vector3D {
            let mob: Mobius = Mobius.CreateFromIsometry(Geometry.Spherical, 0, new System.Numerics.Complex(1, 0));
            v = mob.Apply(v);
            return EuclideanModels.SpiralToIsometric(v, p, m, n);
        }
    }
}
