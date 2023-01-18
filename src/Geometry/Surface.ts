import { UtilsInfinity } from '@Math/Infinity'
import { Mobius } from '@Math/Mobius'
import { isInfinite } from '@Math/Utils'
import { Mesh } from './Mesh'
import { Vector3D } from './Vector3D'

export class Surface {
  // Transform a mesh in the Poincare model to Dini's surface.

  static Dini(mesh: Mesh): Mesh {
    let transform: System.Func<Vector3D, Vector3D> = v => {
      this.Dini(v)
    }

    let result: Mesh = new Mesh()
    for (let i: number = 0; i < mesh.Triangles.Count; i++) {
      let a: Vector3D = transform(mesh.Triangles[i].a)
      let b: Vector3D = transform(mesh.Triangles[i].b)
      let c: Vector3D = transform(mesh.Triangles[i].c)
      if (isInfinite(a) || isInfinite(b) || isInfinite(c)) {
        continue
      }

      result.Triangles.Add(new Mesh.Triangle(a, b, c))
    }

    return result
  }

  static Dini(uv: Vector3D): Vector3D {
    return Surface.Dini2(uv)
  }

  static Sech(val: number): number {
    return 1 / Math.cosh(val)
  }

  // From the virtual math museum

  static Dini2(disk: Vector3D): Vector3D {
    let uv: Vector3D = Surface.DiskToUpper(disk)
    let u: number = Math.log(uv.Y)
    // double v = DonHatch.acosh( 1 + ( Math.Pow( uv.X, 2 ) + 0 ) / ( 2 * Math.Pow( uv.Y, 2 ) ) ) ;
    // if( uv.X < 0 )
    //     v *= -1;
    let v: number = uv.X
    if (u <= -4 || u > 4 || v < 6 * Math.PI * -1 || v > 6 * Math.PI) {
      return UtilsInfinity.InfinityVector
    }

    let psi: number = 0.5
    psi = psi * Math.PI
    let sinpsi: number = Math.sin(psi)
    let cospsi: number = Math.cos(psi)
    let g: number = (u - cospsi * v) / sinpsi
    let s: number = Math.exp(g)
    let r: number = (2 * sinpsi) / (s + 1 / s)
    let t: number = r * ((s - 1 / s) * 0.5)
    return new Vector3D(u - t, r * Math.cos(v), r * Math.sin(v))
  }

  static Dini(uv: Vector3D, a: number, b: number): Vector3D {
    uv = Surface.DiskToUpper(uv)
    //  Eq 1.86 on p36 of book Backlund and Darboux Transformations
    let eta: number = Math.PI / 2 - Math.PI / 20
    // double eta = Math.PI / 2;
    let p: number = 1
    //  curvature
    let x: number = DonHatch.acosh(uv.Y)
    //  Used info on mathworld for tractrix to figure this out.
    // double x = DonHatch.acosh( Math.exp( DonHatch.acosh( ( uv.Y * uv.Y + 1 ) / ( 2 * uv.Y ) ) ) );
    // double x = Math.log( uv.Y );
    let y: number = uv.X
    let pSinEta: number = p * Math.sin(eta)
    let chi: number = (x - y * Math.cos(eta)) / pSinEta
    if (x <= -4 || x > 4 || y < 3 * Math.PI * -1 || y > 3 * Math.PI) {
      return UtilsInfinity.InfinityVector
    }

    let result: Vector3D = new Vector3D(
      pSinEta * (Surface.Sech(chi) * Math.cos(y / p)),
      pSinEta * (Surface.Sech(chi) * Math.sin(y / p)),
      x - pSinEta * Math.Tanh(chi),
    )
    return result
  }

  static DiskToUpper(input: Vector3D): Vector3D {
    let m: Mobius = new Mobius()
    m.UpperHalfPlane()
    return m.Apply(input)
  }
}
