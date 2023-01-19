import { Vector3D } from './Vector3D'

export class MeshTriangle {
  constructor(_a: Vector3D, _b: Vector3D, _c: Vector3D) {
    this.a = _a
    this.b = _b
    this.c = _c
  }

  a: Vector3D

  b: Vector3D

  c: Vector3D

  get Normal(): Vector3D {
    //  Doing this in drawn out steps was because I was having floating point issues for small triangles.
    //  This mid-way normalization solved this.
    let v1: Vector3D = this.b.Subtract(this.a)
    let v2: Vector3D = this.c.Subtract(this.a)
    v1.Normalize()
    v2.Normalize()
    let n: Vector3D = v1.Cross(v2)
    n.Normalize()
    return n
  }

  get Center(): Vector3D {
    return this.a.Add(this.b).Add(this.c).Divide(3)
  }

  ChangeOrientation() {
    let t: Vector3D = this.b
    this.b = this.c
    this.c = t
  }
}
