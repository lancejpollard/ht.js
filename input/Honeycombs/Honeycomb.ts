import R3.Core;
import R3.Math;
import System.Collections.Generic;
import System.IO;
import System.Linq;
import Math = System.Math;

module R3.Geometry {

    export enum EHoneycomb {

        H434,

        H435,

        H534,

        H535,

        H353,

        H336,

        H436,

        H536,

        H344,

        H444,

        H363,

        H636,

        H337,

        H33I,
    }

    export class Honeycomb {

        public static String(honeycomb: EHoneycomb, dual: boolean): string {
            switch (honeycomb) {
                case EHoneycomb.H435:
                    return "{5,3,4}";
                    break;
                case EHoneycomb.H534:
                    return "{4,3,5}";
                    break;
                case EHoneycomb.H535:
                    return "{5,3,5}";
                    break;
                case EHoneycomb.H353:
                    return "{3,5,3}";
                    break;
                case EHoneycomb.H336:
                    return "{6,3,3}";
                    break;
                case EHoneycomb.H436:
                    return "{6,3,4}";
                    break;
                case EHoneycomb.H536:
                    return "{6,3,5}";
                    break;
                case EHoneycomb.H344:
                    return "{4,4,3}";
                    break;
                case EHoneycomb.H444:
                    return "{4,4,4}";
                    break;
                case EHoneycomb.H636:
                    return "{6,3,6}";
                    break;
                case EHoneycomb.H363:
                    return "{3,6,3}";
                    break;
                case EHoneycomb.H337:
                    return "{7,3,3}";
                    break;
                case EHoneycomb.H33I:
                    return "{inf,3,3}";
                    break;
            }

            // TODO: Warning!!!, inline IF is not supported ?
            dual;
            "{4,3,5}";
            // TODO: Warning!!!, inline IF is not supported ?
            dual;
            "{5,3,4}";
            // TODO: Warning!!!, inline IF is not supported ?
            dual;
            "{3,3,6}";
            // TODO: Warning!!!, inline IF is not supported ?
            dual;
            "{4,3,6}";
            // TODO: Warning!!!, inline IF is not supported ?
            dual;
            "{5,3,6}";
            // TODO: Warning!!!, inline IF is not supported ?
            dual;
            "{3,4,4}";
            // TODO: Warning!!!, inline IF is not supported ?
            dual;
            "{3,3,7}";
            // TODO: Warning!!!, inline IF is not supported ?
            dual;
            "{3,3,inf}";
            throw new Error('Argument Error')("Unknown honeycomb type");
        }

        public static PQR(honeycomb: EHoneycomb, /* out */p: number, /* out */q: number, /* out */r: number) {
            switch (honeycomb) {
                case EHoneycomb.H435:
                    p = 4;
                    q = 3;
                    r = 5;
                    return;
                    break;
                case EHoneycomb.H534:
                    p = 5;
                    q = 3;
                    r = 4;
                    return;
                    break;
                case EHoneycomb.H535:
                    p = 5;
                    q = 3;
                    r = 5;
                    return;
                    break;
                case EHoneycomb.H353:
                    p = 3;
                    q = 5;
                    r = 3;
                    return;
                    break;
                case EHoneycomb.H336:
                    p = 3;
                    q = 3;
                    r = 6;
                    return;
                    break;
                case EHoneycomb.H436:
                    p = 4;
                    q = 3;
                    r = 6;
                    return;
                    break;
                case EHoneycomb.H536:
                    p = 5;
                    q = 3;
                    r = 6;
                    return;
                    break;
                case EHoneycomb.H344:
                    p = 3;
                    q = 4;
                    r = 4;
                    return;
                    break;
                case EHoneycomb.H444:
                    p = 4;
                    q = 4;
                    r = 4;
                    return;
                    break;
                case EHoneycomb.H363:
                    p = 3;
                    q = 6;
                    r = 3;
                    return;
                    break;
                case EHoneycomb.H636:
                    p = 6;
                    q = 3;
                    r = 6;
                    return;
                    break;
                case EHoneycomb.H337:
                    p = 3;
                    q = 3;
                    r = 7;
                    return;
                    break;
                case EHoneycomb.H33I:
                    p = 3;
                    q = 3;
                    r = -1;
                    return;
                    break;
            }

            throw new Error('Argument Error');
        }

        public static InRadius(honeycomb: EHoneycomb): number {
            let r: number;
            let p: number;
            let q: number;
            Honeycomb.PQR(honeycomb, /* out */p, /* out */q, /* out */r);
            return Honeycomb.InRadius(p, q, r);
        }

        public static MidRadius(honeycomb: EHoneycomb): number {
            let r: number;
            let p: number;
            let q: number;
            Honeycomb.PQR(honeycomb, /* out */p, /* out */q, /* out */r);
            return Honeycomb.MidRadius(p, q, r);
        }

        public static CircumRadius(honeycomb: EHoneycomb): number {
            let r: number;
            let p: number;
            let q: number;
            Honeycomb.PQR(honeycomb, /* out */p, /* out */q, /* out */r);
            return Honeycomb.CircumRadius(p, q, r);
        }

        public static EdgeLength(honeycomb: EHoneycomb): number {
            let r: number;
            let p: number;
            let q: number;
            Honeycomb.PQR(honeycomb, /* out */p, /* out */q, /* out */r);
            return Honeycomb.EdgeLength(p, q, r);
        }

        public static GetGeometry(p: number, q: number, r: number): Geometry {
            let t1: number = (Math.Sin(Honeycomb.PiOverNSafe(p)) * Math.Sin(Honeycomb.PiOverNSafe(r)));
            let t2: number = Math.Cos(Honeycomb.PiOverNSafe(q));
            if (Tolerance.Equal(t1, t2)) {
                return Geometry.Euclidean;
            }

            if (Tolerance.GreaterThan(t1, t2)) {
                return Geometry.Spherical;
            }

            return Geometry.Hyperbolic;
        }

        ///  <summary>
        ///  Returns the in-radius, in the induced geometry.
        ///  </summary>
        public static InRadius(p: number, q: number, r: number): number {
            let pip: number = Honeycomb.PiOverNSafe(p);
            let pir: number = Honeycomb.PiOverNSafe(r);
            let pi_hpq: number = Honeycomb.Pi_hpq(p, q);
            let inRadius: number = (Math.Sin(pip)
                        * (Math.Cos(pir) / Math.Sin(pi_hpq)));
            switch (Honeycomb.GetGeometry(p, q, r)) {
                case Geometry.Hyperbolic:
                    return DonHatch.acosh(inRadius);
                    break;
                case Geometry.Spherical:
                    return Math.Acos(inRadius);
                    break;
            }

            throw new Error('Not implemented');
        }

        ///  <summary>
        ///  Returns the mid-radius, in the induced geometry.
        ///  </summary>
        public static MidRadius(p: number, q: number, r: number): number {
            let pir: number = Honeycomb.PiOverNSafe(r);
            let inRadius: number = Honeycomb.InRadius(p, q, r);
            let midRadius: number = (DonHatch.sinh(inRadius) / Math.Sin(pir));
            switch (Honeycomb.GetGeometry(p, q, r)) {
                case Geometry.Hyperbolic:
                    return DonHatch.asinh(midRadius);
                    break;
                case Geometry.Spherical:
                    return Math.Asin(midRadius);
                    break;
            }

            throw new Error('Not implemented');
        }

        ///  <summary>
        ///  Returns the circum-radius, in the induced geometry.
        ///  </summary>
        public static CircumRadius(p: number, q: number, r: number): number {
            let pip: number = Honeycomb.PiOverNSafe(p);
            let piq: number = Honeycomb.PiOverNSafe(q);
            let pir: number = Honeycomb.PiOverNSafe(r);
            let pi_hpq: number = Honeycomb.Pi_hpq(p, q);
            let pi_hqr: number = Honeycomb.Pi_hpq(q, r);
            let circumRadius: number = (Math.Cos(pip)
                        * (Math.Cos(piq)
                        * (Math.Cos(pir)
                        / (Math.Sin(pi_hpq) * Math.Sin(pi_hqr)))));
            switch (Honeycomb.GetGeometry(p, q, r)) {
                case Geometry.Hyperbolic:
                    return DonHatch.acosh(circumRadius);
                    break;
                case Geometry.Spherical:
                    return Math.Acos(circumRadius);
                    break;
            }

            throw new Error('Not implemented');
        }

        public static EdgeLength(p: number, q: number, r: number): number {
            let pip: number = Honeycomb.PiOverNSafe(p);
            let pir: number = Honeycomb.PiOverNSafe(r);
            let pi_hqr: number = Honeycomb.Pi_hpq(q, r);
            let edgeLength: number = (2 * DonHatch.acosh((Math.Cos(pip)
                            * (Math.Sin(pir) / Math.Sin(pi_hqr)))));
            return edgeLength;
        }

        private static Pi_hpq(p: number, q: number): number {
            let pi: number = Math.PI;
            let pip: number = Honeycomb.PiOverNSafe(p);
            let piq: number = Honeycomb.PiOverNSafe(q);
            let temp: number = (Math.Pow(Math.Cos(pip), 2) + Math.Pow(Math.Cos(piq), 2));
            let hab: number = (pi / Math.Acos(Math.Sqrt(temp)));
            //  Infinity safe.
            let pi_hpq: number = (pi / hab);
            if (isInfinite(hab)) {
                pi_hpq = 0;
            }

            return pi_hpq;
        }

        public static PiOverNSafe(n: number): number {
            return 0;
            // TODO: Warning!!!, inline IF is not supported ?
            (n == -1);
            (Math.PI / n);
        }
    }
}
