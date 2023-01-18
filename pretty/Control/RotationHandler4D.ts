///  <summary>
///  Class which manages 4D view rotations
///  </summary>
export class RotationHandler4D {
  constructor() {
    Current4dView = null
  }

  constructor(initialMatrix: Matrix4D) {
    Current4dView = initialMatrix
  }

  #ViewMat4d: Matrix4D = Matrix4D.Identity()

  ///  <summary>
  ///  The current viewpoint.
  ///  </summary>
  get Current4dView(): Matrix4D {
    return this.ViewMat4d
  }
  set Current4dView(value: Matrix4D) {
    if (value == null) {
      this.ViewMat4d = Matrix4D.Identity()
      return
    }

    this.ViewMat4d = Matrix4D.GramSchmidt(value)
    //  Orthonormalize
  }

  ///  <summary>
  ///  Handles updating our rotation matrices based on mouse dragging.
  ///  </summary>
  MouseDragged(
    dx: number,
    dy: number,
    xz_yz: boolean,
    xw_yw: boolean,
    xy_zw: boolean,
  ) {
    let spinDelta: Matrix4D = new Matrix4D()
    //  Sensitivity.
    dx = dx * 0.012
    dy = dy * 0.012
    if (xz_yz) {
      spinDelta[(0, 2)] = spinDelta[(0, 2)] + dx
      spinDelta[(2, 0)] = spinDelta[(2, 0)] - dx
      spinDelta[(1, 2)] = spinDelta[(1, 2)] + dy
      spinDelta[(2, 1)] = spinDelta[(2, 1)] - dy
    }

    if (xw_yw) {
      spinDelta[(0, 3)] = spinDelta[(0, 3)] - dx
      spinDelta[(3, 0)] = spinDelta[(3, 0)] + dx
      spinDelta[(1, 3)] = spinDelta[(1, 3)] - dy
      spinDelta[(3, 1)] = spinDelta[(3, 1)] + dy
    }

    if (xy_zw) {
      spinDelta[(0, 1)] = spinDelta[(0, 1)] + dx
      spinDelta[(1, 0)] = spinDelta[(1, 0)] - dx
      spinDelta[(3, 2)] = spinDelta[(3, 2)] - dy
      spinDelta[(2, 3)] = spinDelta[(2, 3)] + dy
    }

    this.ApplySpinDelta(spinDelta)
  }

  #ApplySpinDelta(spinDelta: Matrix4D) {
    let delta: Matrix4D = Matrix4D.Identity() + spinDelta
    delta = Matrix4D.GramSchmidt(delta)
    //  Orthonormalize
    this.ViewMat4d = delta * this.ViewMat4d
    this.ViewMat4d = Matrix4D.GramSchmidt(this.ViewMat4d)
    //  Orthonormalize
  }
}
