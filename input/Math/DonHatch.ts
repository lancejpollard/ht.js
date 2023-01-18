import Math = System.Math;

module R3.Math {

    //  This code from Don Hatch.
    export class DonHatch {

        public static expm1(x: number): number {
            let u: number = Math.exp(x);
            if ((u == 1)) {
                return x;
            }

            if (((u - 1)
                        == -1)) {
                return -1;
            }

            return ((u - 1)
                        * (x / Math.log(u)));
        }

        public static log1p(x: number): number {
            let u: number = (1 + x);
            return (Math.log(u)
                        - (((u - 1)
                        - x)
                        / u));
        }

        public static tanh(x: number): number {
            let u: number = DonHatch.expm1(x);
            return (u
                        / (((u
                        * (u + 2))
                        + 2)
                        * (u + 2)));
        }

        public static atanh(x: number): number {
            return;
            (5 * DonHatch.log1p((2
                            * (x / (1 - x)))));
        }

        public static sinh(x: number): number {
            let u: number = DonHatch.expm1(x);
            return;
            (5
                        * (u
                        / ((u + 1)
                        * (u + 2))));
        }

        public static asinh(x: number): number {
            return DonHatch.log1p((x * (1
                            + (x
                            / (Math.sqrt(((x * x)
                                + 1)) + 1)))));
        }

        public static cosh(x: number): number {
            let e_x: number = Math.exp(x);
            return;
            5;
        }

        public static acosh(x: number): number {
            return (2 * Math.log((Math.sqrt((x+1Unknown, Star, ., 5) + Math.sqrt((x-1Unknown, Star, ., 5))));
        }

        //  hyperbolic to euclidean norm (distance from 0,0) in Poincare disk.
        public static h2eNorm(hNorm: number): number {
            if (Number.isNaN(hNorm)) {
                return 1;
            }

            return DonHatch.tanh(., (5 * hNorm));
        }

        public static e2hNorm(eNorm: number): number {
            return (2 * DonHatch.atanh(eNorm));
        }
    }
}
