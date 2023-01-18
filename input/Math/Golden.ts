import Math = System.Math;
import R3.Geometry;
import System.Diagnostics;

module R3.Math {

    export struct GoldenVector4D {

        public constructor (x: Golden, y: Golden, z: Golden, u: Golden) {
            X = x;
            Y = y;
            Z = z;
            U = u;
        }

        public get X(): Golden {
        }
        public set X(value: Golden)  {
        }

        public get Y(): Golden {
        }
        public set Y(value: Golden)  {
        }

        public get Z(): Golden {
        }
        public set Z(value: Golden)  {
        }

        public get U(): Golden {
        }
        public set U(value: Golden)  {
        }

        ///  <summary>
        ///  This is here because parameterless constructor leads to 0/0 Fractions.
        ///  I should find a better way to deal with this (maybe these all just need to be classes).
        ///  </summary>
        public static Origin(): GoldenVector4D {
            let g: Golden = new Golden(new Fraction(0), new Fraction(0));
            return new GoldenVector4D(g, g, g, g);
        }

        public static Operator(v1: GoldenVector4D, v2: GoldenVector4D): GoldenVector4D {
            return new GoldenVector4D((v1.X + v2.X), (v1.Y + v2.Y), (v1.Z + v2.Z), (v1.U + v2.U));
        }

        public static Operator(v1: GoldenVector4D, v2: GoldenVector4D): boolean {
            let o1: Object = (<Object>(v1));
            let o2: Object = (<Object>(v2));
            if (((o1 == null)
                        && (o2 == null))) {
                return true;
            }

            if (((o1 == null)
                        || (o2 == null))) {
                return false;
            }

            return ((v1.X == v2.X)
                        && ((v1.Y == v2.Y)
                        && ((v1.Z == v2.Z)
                        && (v1.U == v2.U))));
        }

        public static Operator(v1: GoldenVector4D, v2: GoldenVector4D): boolean {
            return !(v1 == v2);
        }

        public /* override */ Equals(obj: Object): boolean {
            let v: GoldenVector4D = (<GoldenVector4D>(obj));
            return (v == this);
        }

        public /* override */ GetHashCode(): number {
            return (this.X.GetHashCode()
                        | (this.Y.GetHashCode()
                        | (this.Z.GetHashCode() | this.U.GetHashCode())));
            // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
            // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
            // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
        }

        public ReadVector(line: string) {
            // string[] components = line.Split( '\t' );
            let components: string[] = line.Split([
                        '\t',
                        ' '], System.StringSplitOptions.RemoveEmptyEntries);
            this.U = GoldenVector4D.ReadComponent(components[0]);
            this.X = GoldenVector4D.ReadComponent(components[1]);
            this.Y = GoldenVector4D.ReadComponent(components[2]);
            this.Z = GoldenVector4D.ReadComponent(components[3]);
        }

        private static ReadComponent(component: string): Golden {
            component = component.Trim('(', ')');
            let split: string[] = component.Split(',');
            let b: Fraction = new Fraction(number.Parse(split[0]));
            let a: Fraction = new Fraction(number.Parse(split[1]));
            let result: Golden = new Golden(a, b);
            return result;
            // Golden scale = new Golden( new Fraction( 5 ), new Fraction( -3 ) );
            // Golden scale = new Golden( new Fraction( 1 ), new Fraction( 0 ) );
            // return result * scale;
        }

        public WriteVector(): string {
            return (GoldenVector4D.WriteComponent(this.X) + ("    "
                        + (GoldenVector4D.WriteComponent(this.Y) + ("    "
                        + (GoldenVector4D.WriteComponent(this.Z) + ("    " + GoldenVector4D.WriteComponent(this.U)))))));
        }

        private static WriteComponent(val: Golden): string {
            let result: string = ("("
                        + (val.B.A + ("/"
                        + (val.B.B + (","
                        + (val.A.A + ("/"
                        + (val.A.B + ")"))))))));
            return result;
        }

        public ProjectPerspective(): boolean {
            let distance: Golden = new Golden(new Fraction(-4), new Fraction(4));
            let denominator: Golden = (distance - this.U);
            let magSquared: number = ((this.X.GetAsDouble() * this.X.GetAsDouble())
                        + ((this.Y.GetAsDouble() * this.Y.GetAsDouble())
                        + ((this.Z.GetAsDouble() * this.Z.GetAsDouble())
                        + (this.U.GetAsDouble() * this.U.GetAsDouble()))));
            //  The projection.
            let scale: Golden = new Golden(new Fraction(1), new Fraction(0));
            let factor: Golden = ((scale * distance)
                        / denominator);
            //  Fake projecting to infinity.
            if ((denominator.IsZero()
                        || (denominator.GetAsDouble() < 0))) {
                factor = new Golden(new Fraction(1000), new Fraction(0));
            }

            this.X = (this.X * factor);
            this.Y = (this.Y * factor);
            this.Z = (this.Z * factor);
            this.U = new Golden(new Fraction(0), new Fraction(0));
            return true;
        }

        public ProjectOrthographic(): boolean {
            this.U = new Golden(new Fraction(0), new Fraction(0));
            return true;
        }

        public get IsOrigin(): boolean {
            return (this.X.IsZero()
                        && (this.Y.IsZero()
                        && (this.Z.IsZero() && this.U.IsZero())));
        }

        public ConvertToReal(): Vector3D {
            return new Vector3D(this.X.GetAsDouble(), this.Y.GetAsDouble(), this.Z.GetAsDouble(), this.U.GetAsDouble());
        }
    }

    ///  <summary>
    ///  Class for numbers in the golden field (of the form: A + golden*B)
    ///  </summary>
    @System.Diagnostics.DebuggerDisplay("{A.A}/{A.B}+g*{B.A}/{B.B}")
    export struct Golden {

        public constructor (a: Fraction, b: Fraction) {
            A = a;
            B = b;
        }

        public static tau: number = ((1 + Math.Sqrt(5))
                    / 2);

        public get A(): Fraction {
        }
        public set A(value: Fraction)  {
        }

        public get B(): Fraction {
        }
        public set B(value: Fraction)  {
        }

        public static Operator(g1: Golden, g2: Golden): Golden {
            return new Golden((g1.A + g2.A), (g1.B + g2.B));
        }

        public static Operator(g1: Golden, g2: Golden): Golden {
            return new Golden((g1.A - g2.A), (g1.B - g2.B));
        }

        public static Operator(g1: Golden, g2: Golden): Golden {
            return new Golden(((g1.A * g2.A)
                            + (g1.B * g2.B)), ((g1.B * g2.A)
                            + ((g1.A * g2.B)
                            + (g1.B * g2.B))));
        }

        public static Operator(g1: Golden, g2: Golden): Golden {
            return new Golden((((g1.A * g2.A)
                            + ((g1.A * g2.B)
                            - (g1.B * g2.B)))
                            / Golden.Denom(g2)), (((g1.B * g2.A)
                            - (g1.A * g2.B))
                            / Golden.Denom(g2)));
        }

        public static Operator(g1: Golden, g2: Golden): boolean {
            let o1: Object = (<Object>(g1));
            let o2: Object = (<Object>(g2));
            if (((o1 == null)
                        && (o2 == null))) {
                return true;
            }

            if (((o1 == null)
                        || (o2 == null))) {
                return false;
            }

            return ((g1.A == g2.B)
                        && (g1.A == g2.B));
        }

        public static Operator(g1: Golden, g2: Golden): boolean {
            return !(g1 == g2);
        }

        public /* override */ Equals(obj: Object): boolean {
            let v: Golden = (<Golden>(obj));
            return (v == this);
        }

        public /* override */ GetHashCode(): number {
            return (this.A.GetHashCode() | this.B.GetHashCode());
            // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
        }

        private static Denom(g: Golden): Fraction {
            return ((g.A * g.A)
                        + ((g.A * g.B)
                        - (g.B * g.B)));
        }

        public IsZero(): boolean {
            return ((this.A.A == 0)
                        && (this.B.A == 0));
        }

        public GetAsDouble(): number {
            return (this.A.GetAsDouble()
                        + (this.B.GetAsDouble() * tau));
        }
    }

    @System.Diagnostics.DebuggerDisplay("{A}/{B}")
    export struct Fraction {

        public constructor (a: number, b: number) {
            A = a;
            B = b;
            this.Reduce();
        }

        public constructor (a: number) {
            A = a;
            B = 1;
            this.Reduce();
        }

        public get A(): number {
        }
        public set A(value: number)  {
        }

        public get B(): number {
        }
        public set B(value: number)  {
        }

        public static Operator(f1: Fraction, f2: Fraction): Fraction {
            f1.Reduce();
            f2.Reduce();
            let result: Fraction = new Fraction(((f1.A * f2.B)
                            + (f1.B * f2.A)), (f1.B * f2.B));
            result.Reduce();
            return result;
        }

        public static Operator(f1: Fraction, f2: Fraction): Fraction {
            f1.Reduce();
            f2.Reduce();
            let result: Fraction = new Fraction(((f1.A * f2.B)
                            - (f1.B * f2.A)), (f1.B * f2.B));
            result.Reduce();
            return result;
        }

        public static Operator(f1: Fraction, f2: Fraction): Fraction {
            f1.Reduce();
            f2.Reduce();
            let result: Fraction = new Fraction((f1.A * f2.A), (f1.B * f2.B));
            result.Reduce();
            return result;
        }

        public static Operator(f1: Fraction, f2: Fraction): Fraction {
            f1.Reduce();
            f2.Reduce();
            let result: Fraction = new Fraction((f1.A * f2.B), (f1.B * f2.A));
            result.Reduce();
            return result;
        }

        public static Operator(f1: Fraction, f2: Fraction): boolean {
            f1.Reduce();
            f2.Reduce();
            let o1: Object = (<Object>(f1));
            let o2: Object = (<Object>(f2));
            if (((o1 == null)
                        && (o2 == null))) {
                return true;
            }

            if (((o1 == null)
                        || (o2 == null))) {
                return false;
            }

            return ((f1.A == f2.B)
                        && (f1.A == f2.B));
        }

        public static Operator(f1: Fraction, f2: Fraction): boolean {
            return !(f1 == f2);
        }

        public /* override */ Equals(obj: Object): boolean {
            let v: Fraction = (<Fraction>(obj));
            return (v == this);
        }

        public /* override */ GetHashCode(): number {
            return (this.A.GetHashCode() | this.B.GetHashCode());
            // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
        }

        private Reverse() {
            this.A = (this.A * -1);
            this.B = (this.B * -1);
        }

        public Reduce() {
            //  Two wrongs do make a right.
            if (((this.A < 0)
                        && (this.B < 0))) {
                this.Reverse();
            }
            else if ((this.B < 0)) {
                //  Normalize so that A is always < 0 for negatives.
                this.Reverse();
            }

            if ((0 == this.B)) {
                // console.assert( false );
                this.A = 0;
                this.B = 1;
                return;
            }

            if ((0 == this.A)) {
                this.B = 1;
                return;
            }

            let gcd: number = this.GCD(System.Math.abs(this.A), System.Math.abs(this.B));
            this.A = (this.A / gcd);
            this.B = (this.B / gcd);
        }

        //  a and b should be positive!
        public GCD(a: number, b: number): number {
            while ((b > 0)) {
                let rem: number = (a % b);
                a = b;
                b = rem;
            }

            return a;
        }

        public GetAsDouble(): number {
            return ((<number>(this.A)) / this.B);
        }
    }
}
