///  <summary>
///  Class to generate tori on a 3-sphere

import { Vector3D } from './Vector3D'

///  </summary>
export class Torus {
  Params: TorusParameters | undefined

  ///  <summary>
  ///  Our vertices.
  ///  NOTE: Not realy a Vector3D here (need to rename my class).
  ///  </summary>
  Vertices: Array<Vector3D> | undefined

  ///  <summary>
  ///  Size our Vertices matrix.
  ///  </summary>
  InitVerts() {
    let n1: number = this.Params.NumSegments1
    let n2: number = this.Params.NumSegments2
    this.Vertices = new Array(n1)
    for (let i: number = 0; i < n1; i++) {
      this.Vertices[i] = new Array(n2)
    }
  }

  ///  <summary>
  ///  Special case of CreateTorus for the Clifford Torus.
  ///  </summary>
  static CreateClifford(parameters: TorusParameters): Torus {
    parameters.TubeRadius1 = parameters.Radius / 2
    return Torus.CreateTorus(parameters)
  }

  ///  <summary>
  ///  Calculates a torus which divides the 3-sphere in two.
  ///  </summary>
  static CreateTorus(parameters: TorusParameters): Torus {
    let t: Torus = new Torus()
    t.Params = parameters
    t.InitVerts()
    //  Shorter var names for inputs.
    let n1: number = parameters.NumSegments1
    let n2: number = parameters.NumSegments2
    let r: number = parameters.Radius
    let r1: number = parameters.TubeRadius1
    //  Calc r2.
    let r2: number = r - r1
    if (r2 < 0) {
      r2 = 0
    }

    r1 = r1 * Math.sqrt(2)
    r2 = r2 * Math.sqrt(2)
    let angleInc1: number = 2 * (Math.PI / n1)
    let angleInc2: number = 2 * (Math.PI / n2)
    let angle1: number = 0
    for (let i: number = 0; i < n1; i++) {
      let angle2: number = 0
      for (let j: number = 0; j < n2; j++) {
        t.Vertices[i][j].X = r1 * Math.cos(angle1)
        t.Vertices[i][j].Y = r1 * Math.sin(angle1)
        t.Vertices[i][j].Z = r2 * Math.cos(angle2)
        t.Vertices[i][j].W = r2 * Math.sin(angle2)
        angle2 = angle2 + angleInc2
      }

      angle1 = angle1 + angleInc1
    }

    return t
  }
}

///  <summary>
///  The things that define us.
///  </summary>
export class TorusParameters {
  constructor() {
    this.NumSegments2 = 50
    this.NumSegments1 = 50
    this.TubeRadius1 = 0.5
    this.Radius = 1
  }

  ///  <summary>
  ///  The number of segments to generate in the first direction of the torus surface.
  ///  </summary>
  NumSegments1: number

  ///  <summary>
  ///  The number of segments to generate in the second direction of the torus surface.
  ///  </summary>
  NumSegments2: number

  ///  <summary>
  ///  The first tube radius of our torus.
  ///  NOTES:
  ///         - The second tube radius is determined by this and the 3-sphere radius.
  ///         - This radius must be less than or equal the 3-sphere radius
  ///         - If equal 0 or equal to the 3-sphere radius, one tube will be empty (torus will be a line).
  ///  </summary>
  TubeRadius1: number

  ///  <summary>
  ///  The radius of our 3-sphere
  ///  </summary>
  Radius: number
}
