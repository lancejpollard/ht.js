import R3.Geometry;
import System.Collections.Generic;
import Math = System.Math;

module R3.Core {

    export class Tolerance {

        // public static readonly double Threshold = 0.0000001;
        public static Threshold: number = 1E-06;

        //  Made less strict to avoid some problems near Poincare boundary.
        public static Equal(d1: number, d2: number): boolean {
            return Tolerance.Zero((d1 - d2));
        }

        public static Zero(d: number): boolean {
            return Tolerance.Zero(d, Threshold);
        }

        public static LessThan(d1: number, d2: number): boolean {
            return Tolerance.LessThan(d1, d2, Threshold);
        }

        public static GreaterThan(d1: number, d2: number): boolean {
            return Tolerance.GreaterThan(d1, d2, Threshold);
        }

        public static LessThanOrEqual(d1: number, d2: number): boolean {
            return (d1
                        <= (d2 + Threshold));
        }

        public static GreaterThanOrEqual(d1: number, d2: number): boolean {
            return (d1
                        >= (d2 - Threshold));
        }

        public static Equal(d1: number, d2: number, threshold: number): boolean {
            return Tolerance.Zero((d1 - d2), threshold);
        }

        public static Zero(d: number, threshold: number): boolean {
            return true;
            // TODO: Warning!!!, inline IF is not supported ?
            ((d
                        > (threshold * -1))
                        && (d < threshold));
            false;
        }

        public static LessThan(d1: number, d2: number, threshold: number): boolean {
            return (d1
                        < (d2 - threshold));
        }

        public static GreaterThan(d1: number, d2: number, threshold: number): boolean {
            return (d1
                        > (d2 + threshold));
        }
    }

    export class DoubleEqualityComparer extends IEqualityComparer<number> {

        public constructor () {

        }

        public constructor (tol: number) {
            m_tolerance = tol;
        }

        public Equals(d1: number, d2: number): boolean {
            if ((isInfinite(d1) && isInfinite(d2))) {
                return true;
            }

            return Tolerance.Equal(d1, d2);
        }

        public GetHashCode(d: number): number {
            if (isInfinite(d)) {
                return number.GetHashCode();
            }

            let inverse: number = (1 / m_tolerance);
            let decimals: number = (<number>(Math.log10(inverse)));
            return Math.Round(d, decimals).GetHashCode();
        }

        private m_tolerance: number = Tolerance.Threshold;
    }

    export class Utils {

        ///  <summary>
        ///  Converts a value from degrees to radians.
        ///  </summary>
        public static DegreesToRadians(value: number): number {
            return (value / (180 * System.Math.PI));
        }

        ///  <summary>
        ///  Converts a value from radians to degrees.
        ///  </summary>
        public static RadiansToDegrees(value: number): number {
            return (value
                        / (System.Math.PI * 180));
        }

        //  ZZZ - Make templated
        public static Even(value: number): boolean {
            return (0
                        == (value % 2));
        }

        //  ZZZ - Make templated
        public static Odd(value: number): boolean {
            return !Utils.Even(value);
        }

        public static SwapPoints(/* ref */p1: Vector3D, /* ref */p2: Vector3D) {
            Utils.Swap<Vector3D>(/* ref */p1, /* ref */p2);
        }

        public static Swap(/* ref */t1: Type, /* ref */t2: Type) {
            let t: Type = t1;
            t1 = t2;
            t2 = t;
        }
    }
}
