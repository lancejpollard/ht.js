
    export class Hyperbolic2D {
        
        ///  <summary>
        ///  Offsets a vector by a hyperbolic distance.
        ///  </summary>
        static Offset(v: Vector3D, hDist: number): Vector3D {
            let mag: number = v.Abs();
            mag = DonHatch.h2eNorm((DonHatch.e2hNorm(mag) + hDist));
            v.Normalize();
            v = (v * mag);
            return v;
        }
    }
