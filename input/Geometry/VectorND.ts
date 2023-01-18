import Math = System.Math;
import System.Diagnostics;
import System.Linq;
import R3.Core;

module R3.Geometry {

    export class VectorND {

        public constructor (dimension: number) {
            X = new Array(dimension);
        }

        public constructor (components: number[]) {
            X = components;
        }

        public constructor (v: Vector3D) {
            X = new Array(4);
            for (let i: number = 0; (i < 4); i++) {
                X[i] = v[i];
            }

        }

        public ToVec3D(): Vector3D {
            return new Vector3D(X[0], X[1], X[2], X[3]);
        }

        public Clone(): VectorND {
            return new VectorND((<number[]>(this.X.Clone())));
        }

        public get Dimension(): number {
            return X.Length;
        }
        public set Dimension(value: number)  {
            X = new Array(value);
        }

        public get X(): number[] {
        }
        public set X(value: number[])  {
        }

        public static Operator(v: VectorND, s: number): VectorND {
            let components: number[] = new Array(v.Dimension);
            for (let i: number = 0; (i < components.Length); i++) {
                components[i] = (v.X[i] / s);
            }

            return new VectorND(components);
        }

        public Divide(s: number) {
            for (let i: number = 0; (i < this.Dimension); i++) {
            }

            s;
        }

        public static Operator(v: VectorND, s: number): VectorND {
            let components: number[] = new Array(v.Dimension);
            for (let i: number = 0; (i < components.Length); i++) {
                components[i] = (v.X[i] * s);
            }

            return new VectorND(components);
        }

        public static Operator(s: number, v: VectorND): VectorND {
            return (v * s);
        }

        public static Operator(v1: VectorND, v2: VectorND): VectorND {
            console.assert((v1.Dimension == v2.Dimension));
            let components: number[] = new Array(v1.Dimension);
            for (let i: number = 0; (i < components.Length); i++) {
                components[i] = (v1.X[i] + v2.X[i]);
            }

            return new VectorND(components);
        }

        public static Operator(v: VectorND): VectorND {
            let components: number[] = new Array(v.Dimension);
            for (let i: number = 0; (i < components.Length); i++) {
                components[i] = (v.X[i] * -1);
            }

            return new VectorND(components);
        }

        public static Operator(v1: VectorND, v2: VectorND): VectorND {
            return (v1
                        + (v2 * -1));
        }

        public Dot(v: VectorND): number {
            let dot: number = 0;
            for (let i: number = 0; (i < this.Dimension); i++) {
                dot = (dot
                            + (this.X[i] * v.X[i]));
            }

            return dot;
        }

        public Normalize(): boolean {
            let magnitude: number = Abs;
            if (Tolerance.Zero(magnitude)) {
                return false;
            }

            this.Divide(magnitude);
            return true;
        }

        public get MagSquared(): number {
            let result: number = 0;
            for (let x: number in this.X) {
                result = (result
                            + (x * x));
            }

            return result;
        }

        public get Abs(): number {
            return Math.Sqrt(this.MagSquared);
        }

        public Dist(v: VectorND): number {
            return (this - v).Abs;
        }

        public get IsOrigin(): boolean {
            for (let x: number in this.X) {
                if (!Tolerance.Zero(x)) {
                    return false;
                }

            }

            return true;
        }

        ///  <summary>
        ///  4D -> 3D projection.
        ///  </summary>
        public ProjectTo3D(cameraDist: number): VectorND {
            let denominator: number = (cameraDist - this.X[3]);
            if (Tolerance.Zero(denominator)) {
                denominator = 0;
            }

            //  Make points with a negative denominator invalid.
            if ((denominator < 0)) {
                denominator = 0;
            }

            let result: VectorND = new VectorND([
                        (this.X[0]
                                    * (cameraDist / denominator)),
                        (this.X[1]
                                    * (cameraDist / denominator)),
                        (this.X[2]
                                    * (cameraDist / denominator)),
                        0]);
            return result;
        }

        ///  <summary>
        ///  3D -> 2D projection.
        ///  </summary>
        public ProjectTo2D(cameraDist: number): VectorND {
            let denominator: number = (cameraDist - this.X[2]);
            if (Tolerance.Zero(denominator)) {
                denominator = 0;
            }

            //  Make points with a negative denominator invalid.
            if ((denominator < 0)) {
                denominator = 0;
            }

            let result: VectorND = new VectorND([
                        (this.X[0]
                                    * (cameraDist / denominator)),
                        (this.X[1]
                                    * (cameraDist / denominator)),
                        0,
                        0]);
            return result;
        }
    }
}
