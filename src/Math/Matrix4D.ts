export class Matrix4D {
  constructor() {
    this.Initialize()
  }

  // constructor (data: number[,]) {
  //     this.Initialize();
  //     for (let i: number = 0; (i < 4); i++) {
  //         for (let j: number = 0; (j < 4); j++) {
  //             Data[i][j] = data[i, j];
  //         }

  //     }

  // }

  constructor(rows: Array<Vector3D>) {
    this.Initialize()
    for (let i: number = 0; i < 4; i++) {
      Data[i] = [rows[i].X, rows[i].Y, rows[i].Z, rows[i].W]
    }
  }

  #Initialize() {
    Data = new Array(4)
    for (let i: number = 0; i < 4; i++) {
      Data[i] = new Array(4)
    }
  }

  get Data(): Array<Array<number>> {}

  set Data(value: Array<Array<number>>) {}

  Clone(): Matrix4D {
    let result: Matrix4D = new Matrix4D()
    for (let i: number = 0; i < 4; i++) {
      for (let j: number = 0; j < 4; j++) {
        result.Data[i][j] = this.Data[i][j]
      }
    }

    return result
  }

  static Identity(): Matrix4D {
    let result: Matrix4D = new Matrix4D()
    for (let i: number = 0; i < 4; i++) {
      result[(i, i)] = 1
    }

    return result
  }

  ///  <summary>
  ///  Mixing multidim and jagged array notation here, but whatevs.
  ///  </summary>
  get Item(i: number, j: number): number {
    return this.Data[i][j]
  }

  set Item(value: number, i: number, j: number) {
    this.Data[i][j] = value
  }

  get Item(i: number): Vector3D {
    return new Vector3D(this.Data[i])
  }

  set Item(value: Vector3D, i: number) {
    this.Data[i] = [value.X, value.Y, value.Z, value.W]
  }

  static Operator(m1: Matrix4D, m2: Matrix4D): Matrix4D {
    let result: Matrix4D = new Matrix4D()
    for (let i: number = 0; i < 4; i++) {
      for (let j: number = 0; j < 4; j++) {
        result[(i, j)] = m1[(i, j)] + m2[(i, j)]
      }
    }

    return result
  }

  static Operator(m1: Matrix4D, m2: Matrix4D): Matrix4D {
    let result: Matrix4D = new Matrix4D()
    for (let i: number = 0; i < 4; i++) {
      for (let j: number = 0; j < 4; j++) {
        for (let k: number = 0; k < 4; k++) {
          result[(i, j)] = result[(i, j)] + m1[(i, k)] * m2[(k, j)]
        }
      }
    }

    return result
  }

  static Operator(m: Matrix4D, s: number): Matrix4D {
    let result: Matrix4D = new Matrix4D()
    for (let i: number = 0; i < 4; i++) {
      for (let j: number = 0; j < 4; j++) {
        result[(i, j)] = m[(i, j)] * s
      }
    }

    return result
  }

  static Transpose(m: Matrix4D): Matrix4D {
    let result: Matrix4D = new Matrix4D()
    for (let i: number = 0; i < 4; i++) {
      for (let j: number = 0; j < 4; j++) {
        result[(i, j)] = m[(j, i)]
      }
    }

    return result
  }

  ///  <summary>
  ///  http://www.euclideanspace.com/maths/algebra/matrix/functions/determinant/fourD/index.htm
  ///  </summary>
  get Determinant(): number {
    let det: number =
      this.Data[0][3] *
        (this.Data[1][2] * (this.Data[2][1] * this.Data[3][0])) -
      (this.Data[0][2] *
        (this.Data[1][3] * (this.Data[2][1] * this.Data[3][0])) -
        this.Data[0][3] *
          (this.Data[1][1] * (this.Data[2][2] * this.Data[3][0]))) +
      (this.Data[0][1] *
        (this.Data[1][3] * (this.Data[2][2] * this.Data[3][0])) +
        (this.Data[0][2] *
          (this.Data[1][1] * (this.Data[2][3] * this.Data[3][0])) -
          (this.Data[0][1] *
            (this.Data[1][2] * (this.Data[2][3] * this.Data[3][0])) -
            this.Data[0][3] *
              (this.Data[1][2] * (this.Data[2][0] * this.Data[3][1]))) +
          (this.Data[0][2] *
            (this.Data[1][3] * (this.Data[2][0] * this.Data[3][1])) +
            (this.Data[0][3] *
              (this.Data[1][0] * (this.Data[2][2] * this.Data[3][1])) -
              (this.Data[0][0] *
                (this.Data[1][3] *
                  (this.Data[2][2] * this.Data[3][1])) -
                this.Data[0][2] *
                  (this.Data[1][0] *
                    (this.Data[2][3] * this.Data[3][1]))) +
              (this.Data[0][0] *
                (this.Data[1][2] *
                  (this.Data[2][3] * this.Data[3][1])) +
                (this.Data[0][3] *
                  (this.Data[1][1] *
                    (this.Data[2][0] * this.Data[3][2])) -
                  (this.Data[0][1] *
                    (this.Data[1][3] *
                      (this.Data[2][0] * this.Data[3][2])) -
                    this.Data[0][3] *
                      (this.Data[1][0] *
                        (this.Data[2][1] * this.Data[3][2]))) +
                  (this.Data[0][0] *
                    (this.Data[1][3] *
                      (this.Data[2][1] * this.Data[3][2])) +
                    (this.Data[0][1] *
                      (this.Data[1][0] *
                        (this.Data[2][3] * this.Data[3][2])) -
                      (this.Data[0][0] *
                        (this.Data[1][1] *
                          (this.Data[2][3] * this.Data[3][2])) -
                        this.Data[0][2] *
                          (this.Data[1][1] *
                            (this.Data[2][0] * this.Data[3][3]))) +
                      (this.Data[0][1] *
                        (this.Data[1][2] *
                          (this.Data[2][0] * this.Data[3][3])) +
                        (this.Data[0][2] *
                          (this.Data[1][0] *
                            (this.Data[2][1] * this.Data[3][3])) -
                          (this.Data[0][0] *
                            (this.Data[1][2] *
                              (this.Data[2][1] * this.Data[3][3])) -
                            this.Data[0][1] *
                              (this.Data[1][0] *
                                (this.Data[2][2] * this.Data[3][3]))) +
                          this.Data[0][0] *
                            (this.Data[1][1] *
                              (this.Data[2][2] *
                                this.Data[3][3]))))))))))))
    return det
  }

  ///  <summary>
  ///  Gram-Schmidt orthonormalize
  ///  </summary>
  static GramSchmidt(input: Matrix4D): Matrix4D {
    let result: Matrix4D = input
    for (let i: number = 0; i < 4; i++) {
      for (let j: number = 0; j < i; j++) {
        //  result[j] is already unit length...
        //  result[i] -= (result[i] dot result[j])*result[j]
        let iVec: Vector3D = result[i]
        let jVec: Vector3D = result[j]
        iVec = iVec - iVec.Dot(jVec) * jVec
        result[i] = iVec
      }

      result[i].Normalize()
    }

    return result
  }

  ///  <summary>
  ///  Gram-Schmidt orthonormalize
  ///  </summary>
  static GramSchmidt(
    input: Matrix4D,
    innerProduct: Func<Vector3D, Vector3D, number>,
    normalize: Func<Vector3D, Vector3D>,
  ): Matrix4D {
    let result: Matrix4D = input
    for (let i: number = 0; i < 4; i++) {
      for (let j: number = i + 1; j < 4; j++) {
        let iVec: Vector3D = result[i]
        let jVec: Vector3D = result[j]
        iVec = iVec - innerProduct(iVec, jVec) * jVec
        result[i] = iVec
      }

      result[i] = normalize(result[i])
    }

    return result
  }

  ///  <summary>
  ///  Rotate a vector with this matrix.
  ///  </summary>
  RotateVector(input: Vector3D): Vector3D {
    let result: Vector3D = new Vector3D()
    let copy: Vector3D = new Vector3D([
      input.X,
      input.Y,
      input.Z,
      input.W,
    ])
    for (let i: number = 0; i < 4; i++) {
      result[i] =
        copy[0] * this[(i, 0)] +
        (copy[1] * this[(i, 1)] +
          (copy[2] * this[(i, 2)] + copy[3] * this[(i, 3)]))
    }

    return result
  }

  ///  <summary>
  ///  Returns a matrix which will rotate in a coordinate plane by an angle in radians.
  ///  </summary>
  static MatrixToRotateinCoordinatePlane(
    angle: number,
    c1: number,
    c2: number,
  ): Matrix4D {
    let result: Matrix4D = Matrix4D.Identity()
    result[(c1, c1)] = Math.cos(angle)
    result[(c1, c2)] = Math.sin(angle) * -1
    result[(c2, c1)] = Math.sin(angle)
    result[(c2, c2)] = Math.cos(angle)
    return result
  }
}
