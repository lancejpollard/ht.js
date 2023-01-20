import { Vector3D } from '@Geometry/Vector3D'

export class Matrix4D {
  constructor() {
    const data = new Array(4) as Array<Array<number>>
    for (let i: number = 0; i < 4; i++) {
      data[i] = new Array(4) as Array<number>
    }
    this.Data = data
  }

  // constructor (data: number[,]) {
  //     this.Initialize();
  //     for (let i: number = 0; (i < 4); i++) {
  //         for (let j: number = 0; (j < 4); j++) {
  //             Data[i][j] = data[i, j];
  //         }

  //     }

  // }

  static constructWithRows(rows: Array<Vector3D>) {
    const self = new Matrix4D()

    for (let i: number = 0; i < 4; i++) {
      self.Data[i] = [rows[i].X, rows[i].Y, rows[i].Z, rows[i].W]
    }
  }

  Data: Array<Array<number>>

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
      result.Data[i][i] = 1
    }

    return result
  }

  static Add(m1: Matrix4D, m2: Matrix4D): Matrix4D {
    let result: Matrix4D = new Matrix4D()
    for (let i: number = 0; i < 4; i++) {
      for (let j: number = 0; j < 4; j++) {
        result.Data[i][j] = m1.Data[i][j] + m2.Data[i][j]
      }
    }

    return result
  }

  static Multiply(m1: Matrix4D, m2: Matrix4D): Matrix4D {
    let result: Matrix4D = new Matrix4D()
    for (let i: number = 0; i < 4; i++) {
      for (let j: number = 0; j < 4; j++) {
        for (let k: number = 0; k < 4; k++) {
          result.Data[i][j] =
            result.Data[i][j] + m1.Data[i][k] * m2.Data[k][j]
        }
      }
    }

    return result
  }

  static MultiplyByNumber(m: Matrix4D, s: number): Matrix4D {
    let result: Matrix4D = new Matrix4D()
    for (let i: number = 0; i < 4; i++) {
      for (let j: number = 0; j < 4; j++) {
        result.Data[i][j] = m.Data[i][j] * s
      }
    }

    return result
  }

  static Transpose(m: Matrix4D): Matrix4D {
    let result: Matrix4D = new Matrix4D()
    for (let i: number = 0; i < 4; i++) {
      for (let j: number = 0; j < 4; j++) {
        result.Data[i][j] = m.Data[j][i]
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
        this.Data[1][2] *
        this.Data[2][1] *
        this.Data[3][0] -
      this.Data[0][2] *
        this.Data[1][3] *
        this.Data[2][1] *
        this.Data[3][0] -
      this.Data[0][3] *
        this.Data[1][1] *
        this.Data[2][2] *
        this.Data[3][0] +
      this.Data[0][1] *
        this.Data[1][3] *
        this.Data[2][2] *
        this.Data[3][0] +
      this.Data[0][2] *
        this.Data[1][1] *
        this.Data[2][3] *
        this.Data[3][0] -
      this.Data[0][1] *
        this.Data[1][2] *
        this.Data[2][3] *
        this.Data[3][0] -
      this.Data[0][3] *
        this.Data[1][2] *
        this.Data[2][0] *
        this.Data[3][1] +
      this.Data[0][2] *
        this.Data[1][3] *
        this.Data[2][0] *
        this.Data[3][1] +
      this.Data[0][3] *
        this.Data[1][0] *
        this.Data[2][2] *
        this.Data[3][1] -
      this.Data[0][0] *
        this.Data[1][3] *
        this.Data[2][2] *
        this.Data[3][1] -
      this.Data[0][2] *
        this.Data[1][0] *
        this.Data[2][3] *
        this.Data[3][1] +
      this.Data[0][0] *
        this.Data[1][2] *
        this.Data[2][3] *
        this.Data[3][1] +
      this.Data[0][3] *
        this.Data[1][1] *
        this.Data[2][0] *
        this.Data[3][2] -
      this.Data[0][1] *
        this.Data[1][3] *
        this.Data[2][0] *
        this.Data[3][2] -
      this.Data[0][3] *
        this.Data[1][0] *
        this.Data[2][1] *
        this.Data[3][2] +
      this.Data[0][0] *
        this.Data[1][3] *
        this.Data[2][1] *
        this.Data[3][2] +
      this.Data[0][1] *
        this.Data[1][0] *
        this.Data[2][3] *
        this.Data[3][2] -
      this.Data[0][0] *
        this.Data[1][1] *
        this.Data[2][3] *
        this.Data[3][2] -
      this.Data[0][2] *
        this.Data[1][1] *
        this.Data[2][0] *
        this.Data[3][3] +
      this.Data[0][1] *
        this.Data[1][2] *
        this.Data[2][0] *
        this.Data[3][3] +
      this.Data[0][2] *
        this.Data[1][0] *
        this.Data[2][1] *
        this.Data[3][3] -
      this.Data[0][0] *
        this.Data[1][2] *
        this.Data[2][1] *
        this.Data[3][3] -
      this.Data[0][1] *
        this.Data[1][0] *
        this.Data[2][2] *
        this.Data[3][3] +
      this.Data[0][0] *
        this.Data[1][1] *
        this.Data[2][2] *
        this.Data[3][3]
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
        let iVec: Vector3D = Vector3D.constructFrom4dArray(
          result.Data[i],
        )
        let jVec: Vector3D = Vector3D.constructFrom4dArray(
          result.Data[j],
        )
        iVec = iVec.Subtract(jVec.MultiplyWithNumber(iVec.Dot(jVec)))
        result.Data[i] = [iVec.X, iVec.Y, iVec.Z, iVec.W]
      }

      let iVec: Vector3D = Vector3D.constructFrom4dArray(result.Data[i])
      iVec.Normalize()

      result.Data[i] = [iVec.X, iVec.Y, iVec.Z, iVec.W]
    }

    return result
  }

  ///  <summary>
  ///  Gram-Schmidt orthonormalize
  ///  </summary>
  static GramSchmidtOrthonormalize(
    input: Matrix4D,
    innerProduct: (a: Vector3D, b: Vector3D) => number,
    normalize: (v: Vector3D) => Vector3D,
  ): Matrix4D {
    let result: Matrix4D = input
    for (let i: number = 0; i < 4; i++) {
      for (let j: number = i + 1; j < 4; j++) {
        let iVec: Vector3D = Vector3D.constructFrom4dArray(
          result.Data[i],
        )
        let jVec: Vector3D = Vector3D.constructFrom4dArray(
          result.Data[j],
        )

        iVec = iVec.Subtract(
          jVec.MultiplyWithNumber(innerProduct(iVec, jVec)),
        )

        result.Data[i] = [iVec.X, iVec.Y, iVec.Z, iVec.W]
      }

      let iVec: Vector3D = Vector3D.constructFrom4dArray(result.Data[i])
      let oVec: Vector3D = normalize(iVec)

      result.Data[i] = [oVec.X, oVec.Y, oVec.Z, oVec.W]
    }

    return result
  }

  ///  <summary>
  ///  Rotate a vector with this matrix.
  ///  </summary>
  RotateVector(input: Vector3D): Vector3D {
    let result: Vector3D = Vector3D.construct()
    let copy: Vector3D = Vector3D.construct4d(
      input.X,
      input.Y,
      input.Z,
      input.W,
    )

    result.X =
      copy.X * this.Data[0][0] +
      copy.Y * this.Data[0][1] +
      copy.Z * this.Data[0][2] +
      copy.W * this.Data[0][3]
    result.Y =
      copy.X * this.Data[1][0] +
      copy.Y * this.Data[1][1] +
      copy.Z * this.Data[1][2] +
      copy.W * this.Data[1][3]
    result.Z =
      copy.X * this.Data[2][0] +
      copy.Y * this.Data[2][1] +
      copy.Z * this.Data[2][2] +
      copy.W * this.Data[2][3]
    result.W =
      copy.X * this.Data[3][0] +
      copy.Y * this.Data[3][1] +
      copy.Z * this.Data[3][2] +
      copy.W * this.Data[3][3]

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
    result.Data[c1][c1] = Math.cos(angle)
    result.Data[c1][c2] = Math.sin(angle) * -1
    result.Data[c2][c1] = Math.sin(angle)
    result.Data[c2][c2] = Math.cos(angle)
    return result
  }
}
