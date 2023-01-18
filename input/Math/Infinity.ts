import System.Numerics;

module R3.Geometry {

    ///  <summary>
    ///  Class with some hackish methods for dealing with points projected to infinite.
    ///  </summary>
    export class Infinity {

        public static InfinityVector: Vector3D = new Vector3D(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);

        public static InfinityComplex: Complex = new Complex(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);

        public static LargeFiniteVector: Vector3D = new Vector3D(FiniteScale, FiniteScale, FiniteScale);

        public /* const */ static FiniteScale: number = 10000;

        public /* const */ static InfiniteScale: number = 500000;

        public static IsInfinite(input: Vector3D): boolean {
            //  XXX - ugly hack I'd like to improve.
            return (isInfinite(input.X)
                        || (isInfinite(input.Y)
                        || (isInfinite(input.Z)
                        || (isInfinite(input.W)
                        || (input.Abs() > InfiniteScale)))));
        }

        public static IsInfinite(input: Complex): boolean {
            return (isInfinite(input.Real) || isInfinite(input.Imaginary));
        }

        public static IsInfinite(input: number): boolean {
            return (number.IsNaN(input)
                        || (number.IsInfinity(input)
                        || (input >= InfiniteScale)));
        }

        public static InfinitySafe(input: Vector3D): Vector3D {
            if (isInfinite(input)) {
                return Infinity.LargeFiniteVector;
            }

            return input;
        }
    }
}
