import { Vector3D } from './Vector3D'

export class MeshTriangle {
  constructor(_a: Vector3D, _b: Vector3D, _c: Vector3D) {
    a = _a
    b = _b
    c = _c
    color = new Vector3D(1, 1, 1)
  }

  a: Vector3D

  b: Vector3D

  c: Vector3D

  //  The reason we use a vector here is so the components
  //  can be interpreted in different color schemes (HLS, RGB, etc.)
  color: Vector3D

  get Normal(): Vector3D {
    //  Doing this in drawn out steps was because I was having floating point issues for small triangles.
    //  This mid-way normalization solved this.
    let v1: Vector3D = this.b - this.a
    let v2: Vector3D = this.c - this.a
    v1.Normalize()
    v2.Normalize()
    let n: Vector3D = v1.Cross(v2)
    n.Normalize()
    return n
  }

  get Center(): Vector3D {
    return (this.a + (this.b + this.c)) / 3
  }

  ChangeOrientation() {
    let t: Vector3D = this.b
    this.b = this.c
    this.c = t
  }
}
