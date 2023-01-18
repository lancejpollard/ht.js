import Math = System.Math;
import R3.Core;
import System.Collections.Generic;
import System.Diagnostics;
import System.Globalization;
import System.Numerics;
import System.Runtime.Serialization;

module R3.Geometry {

    @DebuggerDisplay("X:{X} Y:{Y} Z:{Z} W:{W}")
    @DataContract(Namespace="")
    export struct Vector3D {

        public constructor (x: number, y: number, z: number, w: number) {
            X = x;
            Y = y;
            Z = z;
            W = w;
        }

        public constructor (vals: number[]) {
            X = vals[0];
            Y = vals[1];
            Z = vals[2];
            W = vals[3];
        }

        public constructor (x: number, y: number, z: number) {
            X = x;
            Y = y;
            Z = z;
            W = 0;
        }

        public constructor (x: number, y: number) {
            X = x;
            Y = y;
            W = 0;
            Z = 0;
        }

        @DataMember()
        public get X(): number {
        }
        @DataMember()
        public set X(value: number)  {
        }

        @DataMember()
        public get Y(): number {
        }
        @DataMember()
        public set Y(value: number)  {
        }

        @DataMember()
        public get Z(): number {
        }
        @DataMember()
        public set Z(value: number)  {
        }

        @DataMember()
        public get W(): number {
        }
        @DataMember()
        public set W(value: number)  {
        }

        public /* override */ ToString(): string {
            return string.Format("{0},{1},{2},{3}", this.X, this.Y, this.Z, this.W);
        }

        public Save(): string {
            return this.ToString();
        }

        public ToStringXYZOnly(): string {
            return string.Format("{0},{1},{2}", this.X, this.Y, this.Z);
        }

        public Load(s: string) {
            let split: string[] = s.Split(',');
            if (((split.Length == 3)
                        || (split.Length == 4))) {
                this.X = number.Parse(split[0], CultureInfo.InvariantCulture);
                this.Y = number.Parse(split[1], CultureInfo.InvariantCulture);
                this.Z = number.Parse(split[2], CultureInfo.InvariantCulture);
            }

            if ((split.Length == 4)) {
                this.W = number.Parse(split[3], CultureInfo.InvariantCulture);
            }

        }

        ///  <summary>
        ///  Implicit vector to complex conversion operator.
        ///  </summary>>
        public static implicitOperator(v: Vector3D): Complex {
            return v.ToComplex();
        }

        public static Operator(v1: Vector3D, v2: Vector3D): boolean {
            return v1.Compare(v2);
        }

        public static Operator(v1: Vector3D, v2: Vector3D): boolean {
            return !(v1 == v2);
        }

        public /* override */ Equals(obj: Object): boolean {
            let v: Vector3D = (<Vector3D>(obj));
            return (v == this);
        }

        public /* override */ GetHashCode(): number {
            return this.GetHashCode(Tolerance.Threshold);
        }

        public GetHashCode(tolerance: number): number {
            //  Normalize DNE vectors (since we consider any with any NaN component the same).
            if (this.DNE) {
                return number.GetHashCode();
            }

            //  The hash code is dependent on the tolerance: more precision -> less rounding.
            //  Rounding the hashcodes is necessary, since for a given tolerence we might
            //  consider two quantities to be equal, but their hashcodes might differ
            //  without the rounding.
            let inverse: number = (1 / tolerance);
            let decimals: number = (<number>(Math.log10(inverse)));
            return (Math.Round(this.X, decimals).GetHashCode()
                        | (Math.Round(this.Y, decimals).GetHashCode()
                        | (Math.Round(this.Z, decimals).GetHashCode() | Math.Round(this.W, decimals).GetHashCode())));
            // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
            // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
            // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
            //  if 0 tolerance
            // return X.GetHashCode() ^ Y.GetHashCode() ^ Z.GetHashCode();
        }

        public Compare(other: Vector3D, threshold: number): boolean {
            //  NOTE: This is here because when the vector is infinite, it fails the tolerance checks below.
            if (((this.X == other.X)
                        && ((this.Y == other.Y)
                        && ((this.Z == other.Z)
                        && (this.W == other.W))))) {
                return true;
            }

            if ((this.DNE && other.DNE)) {
                return true;
            }

            if ((this.DNE || other.DNE)) {
                return false;
            }

            return (Tolerance.Equal(this.X, other.X, threshold)
                        && (Tolerance.Equal(this.Y, other.Y, threshold)
                        && (Tolerance.Equal(this.Z, other.Z, threshold) && Tolerance.Equal(this.W, other.W, threshold))));
        }

        public Compare(other: Vector3D): boolean {
            return this.Compare(other, Tolerance.Threshold);
        }

        public static Operator(v: Vector3D, s: number): Vector3D {
            return new Vector3D((v.X * s), (v.Y * s), (v.Z * s), (v.W * s));
        }

        public static Operator(s: number, v: Vector3D): Vector3D {
            return (v * s);
        }

        public static Operator(v: Vector3D, s: number): Vector3D {
            return new Vector3D((v.X / s), (v.Y / s), (v.Z / s), (v.W / s));
        }

        public Divide(s: number) {
            s;
            s;
            s;
            s;
        }

        public static Operator(v1: Vector3D, v2: Vector3D): Vector3D {
            return new Vector3D((v1.X + v2.X), (v1.Y + v2.Y), (v1.Z + v2.Z), (v1.W + v2.W));
        }

        public static Operator(v: Vector3D): Vector3D {
            return new Vector3D((v.X * -1), (v.Y * -1), (v.Z * -1), (v.W * -1));
        }

        public static Operator(v1: Vector3D, v2: Vector3D): Vector3D {
            return (v1
                        + (v2 * -1));
        }

        public Round(digits: number) {
            for (let i: number = 0; (i < 3); i++) {
                this[i] = Math.Round(this[i], digits);
            }

        }

        public get Item(i: number): number {
            switch (i) {
                case 0:
                    return this.X;
                    break;
                case 1:
                    return this.Y;
                    break;
                case 2:
                    return this.Z;
                    break;
                case 3:
                    return this.W;
                    break;
            }

            throw new Error('Argument Error');
        }
        public set Item(value: number, i: number)  {
            switch (i) {
                case 0:
                    this.X = value;
                    break;
                case 1:
                    this.Y = value;
                    break;
                case 2:
                    this.Z = value;
                    break;
                case 3:
                    this.W = value;
                    break;
            }

        }

        public Valid(): boolean {
            //  ZZZ - This is what I did in MagicTile, but what about infinities?.
            //  ZZZ - Make a property
            return (!number.IsNaN(this.X)
                        && (!number.IsNaN(this.Y)
                        && (!number.IsNaN(this.Z)
                        && !number.IsNaN(this.W))));
        }

        public get DNE(): boolean {
            return (number.IsNaN(this.X)
                        || (number.IsNaN(this.Y)
                        || (number.IsNaN(this.Z) || number.IsNaN(this.W))));
        }

        public static DneVector(): Vector3D {
            return new Vector3D(NaN, NaN, NaN, NaN);
        }

        public Empty() {
            this.W = 0;
            this.Z = 0;
            this.Y = 0;
            this.X = 0;
        }

        public Normalize(): boolean {
            let magnitude: number = this.Abs();
            if (Tolerance.Zero(magnitude, 1E-10)) {
                return false;
            }

            this.Divide(magnitude);
            return true;
        }

        ///  <summary>
        ///  Normalize and scale.
        ///  </summary>
        public Normalize(scale: number): boolean {
            if (!this.Normalize()) {
                return false;
            }

            this = (this * scale);
            return true;
        }

        public MagSquared(): number {
            return ((this.X * this.X)
                        + ((this.Y * this.Y)
                        + ((this.Z * this.Z)
                        + (this.W * this.W))));
        }

        public Abs(): number {
            return Math.Sqrt(this.MagSquared());
        }

        public get IsOrigin(): boolean {
            return (this == new Vector3D());
        }

        public get IsZAxis(): boolean {
            let copy: Vector3D = this;
            copy.Normalize();
            return Tolerance.Equal(1, Math.abs(copy.Z));
        }

        public Dist(v: Vector3D): number {
            return ((this - v)).Abs();
        }

        public Dot(v: Vector3D): number {
            return ((this.X * v.X)
                        + ((this.Y * v.Y)
                        + ((this.Z * v.Z)
                        + (this.W * v.W))));
        }

        ///  <summary>
        ///  3D cross product.
        ///  4th component does not enter into calculations.
        ///  </summary>
        public Cross(v: Vector3D): Vector3D {
            let xVal: number = ((this.Y * v.Z)
                        - (this.Z * v.Y));
            let yVal: number = ((this.Z * v.X)
                        - (this.X * v.Z));
            let zVal: number = ((this.X * v.Y)
                        - (this.Y * v.X));
            return new Vector3D(xVal, yVal, zVal);
        }

        ///  <summary>
        ///  Rotate CCW in the XY plane by an angle in radians.
        ///  </summary>
        public RotateXY(angle: number) {
            let component1: number = this.X;
            let component2: number = this.Y;
            this.X = ((Math.Cos(angle) * component1)
                        - (Math.Sin(angle) * component2));
            this.Y = ((Math.Sin(angle) * component1)
                        + (Math.Cos(angle) * component2));
        }

        ///  <summary>
        ///  Rotate CCW in the XY plane about a center.  Angle is in radians.
        ///  </summary>
        public RotateXY(center: Vector3D, angle: number) {
            this = (this - center);
            this.RotateXY(angle);
            this = (this + center);
        }

        //  NOTE: angle should be in radians.
        public RotateAboutAxis(axis: Vector3D, angle: number) {
            //  normalize the axis
            axis.Normalize();
            let _x: number = axis.X;
            let _y: number = axis.Y;
            let _z: number = axis.Z;
            //  build the rotation matrix - I got this from http://www.makegames.com/3dRotation/
            let c: number = Math.Cos(angle);
            let s: number = ((1 * Math.Sin(angle))
                        * -1);
            let t: number = (1 - c);
            let Unknown: number[,];
            let mRot: number[,] = [];
            let _x: t;
            (_x + c);
            let _x: t;
            (_y
                        - (s * _z));
            let _x: t;
            (_z
                        + (s * _y));
            let _x: t;
            (_y
                        + (s * _z));
            let _y: t;
            (_y + c);
            let _y: t;
            (_z
                        - (s * _x));
            let _x: t;
            (_z
                        - (s * _y));
            let _y: t;
            (_z
                        + (s * _x));
            let _z: t;
            (_z + c);

            let x: number = this.X;
            let y: number = this.Y;
            let z: number = this.Z;
            //  do the multiplication
            this = new Vector3D(((mRot[0, 0] * x)
                            + ((mRot[1, 0] * y)
                            + (mRot[2, 0] * z))), ((mRot[0, 1] * x)
                            + ((mRot[1, 1] * y)
                            + (mRot[2, 1] * z))), ((mRot[0, 2] * x)
                            + ((mRot[1, 2] * y)
                            + (mRot[2, 2] * z))));
        }

        ///  <summary>
        ///  Unsigned (not handed) angle between 0 and pi.
        ///  </summary>
        public AngleTo(p2: Vector3D): number {
            let magmult: number = (this.Abs() * p2.Abs());
            if (Tolerance.Zero(magmult)) {
                return 0;
            }

            //  Make sure the val we take acos() of is in range.
            //  Floating point errors can make us slightly off and cause acos() to return bad values.
            let val: number = (this.Dot(p2) / magmult);
            if ((val > 1)) {
                console.assert(Tolerance.Zero((1 - val)));
                val = 1;
            }

            if ((val < -1)) {
                console.assert(Tolerance.Zero(((1 - val)
                                    * -1)));
                val = -1;
            }

            return Math.Acos(val);
        }

        ///  <summary>
        ///  Finds a perpendicular vector (just one of many possible).
        ///  Result will be normalized.
        ///  </summary>
        public Perpendicular(): Vector3D {
            if (this.IsOrigin) {
                return new Vector3D();
            }

            let perp: Vector3D = this.Cross(new Vector3D(0, 0, 1));
            //  If we are a vector on the z-axis, the above will result in the zero vector.
            if (perp.IsOrigin) {
                perp = this.Cross(new Vector3D(1, 0, 0));
            }

            if (!perp.Normalize()) {
                throw new System.Exception("Failed to find perpendicular.");
            }

            return perp;
        }

        ///  <summary>
        ///  4D -> 3D projection.
        ///  The "safe" part is that we won't make any points invalid (only large).
        ///  </summary>
        public ProjectTo3DSafe(cameraDist: number): Vector3D {
            const let minDenom: number = 0.0001;
            //  The safe part.
            let denominator: number = (cameraDist - this.W);
            if (Tolerance.Zero(denominator)) {
                denominator = minDenom;
            }

            if ((denominator < 0)) {
                denominator = minDenom;
            }

            let result: Vector3D = new Vector3D((this.X
                            * (cameraDist / denominator)), (this.Y
                            * (cameraDist / denominator)), (this.Z
                            * (cameraDist / denominator)), 0);
            return result;
        }

        ///  <summary>
        ///  3D -> 2D projection.
        ///  </summary>
        public CentralProject(cameraDist: number): Vector3D {
            let denominator: number = (cameraDist - this.Z);
            if (Tolerance.Zero(denominator)) {
                denominator = 0;
            }

            //  Make points with a negative denominator invalid.
            if ((denominator < 0)) {
                denominator = 0;
            }

            let result: Vector3D = new Vector3D((this.X
                            * (cameraDist / denominator)), (this.Y
                            * (cameraDist / denominator)), 0);
            return result;
        }

        public ToComplex(): Complex {
            return new Complex(this.X, this.Y);
        }

        public static FromComplex(value: Complex): Vector3D {
            return new Vector3D(value.Real, value.Imaginary);
        }
    }

    ///  <summary>
    ///  For comparing vectors (for ordering, etc.)
    ///  NOTE: I made the comparison tolerance safe.
    ///  </summary>
    export class Vector3DComparer extends IComparer<Vector3D> {

        public Compare(v1: Vector3D, v2: Vector3D): number {
            const let less: number = -1;
            const let greater: number = 1;
            if (Tolerance.LessThan(v1.X, v2.X)) {
                return less;
            }

            if (Tolerance.GreaterThan(v1.X, v2.X)) {
                return greater;
            }

            if (Tolerance.LessThan(v1.Y, v2.Y)) {
                return less;
            }

            if (Tolerance.GreaterThan(v1.Y, v2.Y)) {
                return greater;
            }

            if (Tolerance.LessThan(v1.Z, v2.Z)) {
                return less;
            }

            if (Tolerance.GreaterThan(v1.Z, v2.Z)) {
                return greater;
            }

            if (Tolerance.LessThan(v1.W, v2.W)) {
                return less;
            }

            if (Tolerance.GreaterThan(v1.W, v2.W)) {
                return greater;
            }

            //  Making it here means we are equal.
            return 0;
        }
    }
}
