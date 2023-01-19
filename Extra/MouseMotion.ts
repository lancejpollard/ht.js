import { Vector3D } from '@Geometry/Vector3D'
import { Isometry } from '@Math/Isometry'
import { Mobius } from '@Math/Mobius'

enum ControlType {
  Mouse_2D,

  Mouse_3D,

  Mouse_4D,
}

///  <summary>
///  Helper class to hold the code for panning/rotating/zooming the view.
///  </summary>
class MouseMotion {
  constructor(
    glControl: OpenTK.GLControl,
    settings: Settings,
    clickHandler: System.Action<ClickData>,
    tickleMouse: System.Action,
  ) {
    m_glControl = glControl
    m_settings = settings
    RotHandler4D = new RotationHandler4D()
    m_tickle = tickleMouse
    this.Reset(Geometry.Spherical)
    ControlType = ControlType.Mouse_2D
    Handler = new MouseHandler()
    Handler.Setup(m_glControl)
    Handler.SetDragHandler(this.PerformDrag)
    Handler.SetSpinHandler(this.PerformSpin)
    Handler.SetClickHandler(clickHandler)
    //  Setup our auto-motion timer.
    m_timer = new System.Timers.Timer(30)
    m_timer.SynchronizingObject = glControl
    m_timer.Enabled = false
    m_timer.Elapsed.addEventListener(
      new System.Timers.ElapsedEventHandler(this.SpinStep),
    )
  }

  get Handler(): MouseHandler {}

  set Handler(value: MouseHandler) {}

  get m_viewScale(): number {}

  set m_viewScale(value: number) {}

  get m_rotation(): number {}

  set m_rotation(value: number) {}

  get m_isometry(): Isometry {}

  set m_isometry(value: Isometry) {}

  m_iSpace: ImageSpace

  //  4D related variables.
  get RotHandler4D(): RotationHandler4D {}

  set RotHandler4D(value: RotationHandler4D) {}

  get ProjectionDistance4D(): number {}

  set ProjectionDistance4D(value: number) {}

  //  References we need.
  m_glControl: OpenTK.GLControl

  m_settings: Settings

  m_geometry: Geometry

  m_tickle: System.Action

  ///  <summary>
  ///  Called to reset us (needs to be done when the puzzle changes).
  ///  </summary>
  Reset(g: Geometry) {
    this.m_geometry = g
    this.m_isometry = new Isometry()
    this.m_rotation = 0
    this.m_viewScale = 1.1
    m_viewLookFrom3D = new Vector3D(15, 15, 0)
    m_viewLookFrom4D = new Vector3D(0, 0, 7)
    m_up3D = new Vector3D(0, 0, 1)
    this.RotHandler4D.Current4dView = null
    this.ProjectionDistance4D = 1
    this.UpdateImageSpace()
  }

  ///  <summary>
  ///  The type of mouse control we're doing.
  ///  </summary>
  get ControlType(): ControlType {}

  set ControlType(value: ControlType) {}

  ///  <summary>
  ///  Returns the current isometry from the mouse motion.
  ///  </summary>
  get Isometry(): Isometry {
    return this.m_isometry
  }

  ///  <summary>
  ///  Returns the current rotation from the mouse motion.
  ///  </summary>
  get Rotation(): number {
    return this.m_rotation
  }

  ///  <summary>
  ///  Returns the current view scale from the mouse motion.
  ///  </summary>
  get ViewScale(): number {
    return this.m_viewScale
  }

  set ViewScale(value: number) {
    this.m_viewScale = value
  }

  ///  <summary>
  ///  The camera location, when the view is 3D.
  ///  </summary>
  get ViewLookFrom(): Vector3D {
    if (this.ControlType == this.ControlType.Mouse_4D) {
      return m_viewLookFrom4D
    }

    return m_viewLookFrom3D
  }

  m_viewLookFrom3D: Vector3D

  m_viewLookFrom4D: Vector3D

  ScaleLookFrom3D(scale: number) {
    this.m_viewLookFrom3D = this.m_viewLookFrom3D * scale
  }

  ScaleLookFrom4D(scale: number) {
    this.m_viewLookFrom4D = this.m_viewLookFrom4D * scale
  }

  ///  <summary>
  ///  The camera up vector, when the view is 3D.
  ///  </summary>
  get ViewUp(): Vector3D {
    if (this.ControlType == this.ControlType.Mouse_4D) {
      return new Vector3D(0, 1, 0)
    }

    return m_up3D
  }

  m_up3D: Vector3D

  ///  <summary>
  ///  The cell closest to the center of the view after a drag.
  ///  This is calculated at rendering time and must be set here from there.
  ///  It is used to continually recenter infinite tilings.
  ///  </summary>
  get Closest(): Cell {}

  set Closest(value: Cell) {}

  ///  <summary>
  ///  ZZZ - only here for numerical accuracy.
  ///  </summary>
  get Template(): Cell {}

  set Template(value: Cell) {}

  ///  <summary>
  ///  Helper to go from screen to GL coords.
  ///  </summary>
  ScreenToGL(screenCoords: Vector3D): Vector3D {
    //  Our absolute coordinates of dragged sreen point.
    let result: Vector3D = this.m_iSpace.Point(screenCoords)
    result.RotateXY(this.m_rotation * -1)
    return this.ToStandardIfNeeded(result)
  }

  ///  <summary>
  ///  Helper to transform to standard model if needed.
  ///  </summary>
  ToStandardIfNeeded(point: Vector3D): Vector3D {
    if (
      this.m_geometry == Geometry.Hyperbolic &&
      this.m_settings.HyperbolicModel != HModel.Poincare
    ) {
      if (this.m_settings.HyperbolicModel == HModel.Klein) {
        return HyperbolicModels.KleinToPoincare(point)
      }

      if (this.m_settings.HyperbolicModel == HModel.UpperHalfPlane) {
        return HyperbolicModels.UpperToPoincare(point)
      }

      if (this.m_settings.HyperbolicModel == HModel.Orthographic) {
        return HyperbolicModels.OrthoToPoincare(point)
      }
    }

    if (this.m_geometry == Geometry.Spherical) {
      if (this.m_settings.SphericalModel == SphericalModel.Gnomonic) {
        return SphericalModels.GnomonicToStereo(point)
      }

      if (this.m_settings.SphericalModel == SphericalModel.Fisheye) {
        return SphericalModels.StereoToGnomonic(point)
      }

      if (
        this.m_settings.SphericalModel == SphericalModel.HemisphereDisks
      ) {
        return SphericalModels.FromDisks(
          point * 2,
          /* normalize:*/ false,
        )
      }
    }

    return point
  }

  ///  <summary>
  ///  This is here to keep our coordinates consistent after resizing and zooming.
  ///  </summary>
  UpdateImageSpace() {
    this.m_iSpace = new ImageSpace(
      this.m_glControl.Width,
      this.m_glControl.Height,
    )
    let aspect: number =
      this.m_glControl.Width / this.m_glControl.Height
    this.m_iSpace.XMax = aspect * this.m_viewScale
    this.m_iSpace.XMin = aspect * this.m_viewScale * -1
    this.m_iSpace.YMax = this.m_viewScale
    this.m_iSpace.YMin = this.m_viewScale * -1
  }

  ///  <summary>
  ///  Drag handler.
  ///  </summary>
  PerformDrag(dragData: DragData) {
    this.PerformDragInternal(dragData)
    //  Save this for spinning.
    m_lastDragDataQueue.Enqueue(dragData)
    if (m_lastDragDataQueue.Count > m_numToAverage) {
      m_lastDragDataQueue.Dequeue()
    }

    this.m_glControl.Invalidate()
  }

  PerformDragInternal(dragData: DragData) {
    switch (this.ControlType) {
      case this.ControlType.Mouse_2D:
        this.PerformDrag2D(dragData)
        break
      case this.ControlType.Mouse_3D:
        this.PerformDrag3D(dragData)
        break
      case this.ControlType.Mouse_4D:
        this.PerformDrag4D(dragData)
        break
    }
  }

  //  Spin variables.
  //  The queue is so we can average the last couple drag values.
  //  This helped with making autorotation smoother.
  m_lastDragDataQueue: Queue<DragData> = new Queue<DragData>()

  m_lastDragData: DragData

  m_numToAverage: number = 2

  m_timer: System.Timers.Timer

  PerformSpin() {
    if (this.m_lastDragDataQueue.Count < this.m_numToAverage) {
      return
    }

    if (0 == Glide) {
      return
    }

    System.Diagnostics.Trace.WriteLine('Start Spin')
    //  Set the last drag data to averaged out values.
    this.m_lastDragData = this.m_lastDragDataQueue.Last()
    this.m_lastDragData.XDiff = this.m_lastDragDataQueue.Average(
      () => {},
      dd.XDiff,
    )
    this.m_lastDragData.YDiff = this.m_lastDragDataQueue.Average(
      () => {},
      dd.YDiff,
    )
    this.m_lastDragData.XPercent = this.m_lastDragDataQueue.Average(
      () => {},
      dd.XPercent,
    )
    this.m_lastDragData.YPercent = this.m_lastDragDataQueue.Average(
      () => {},
      dd.YPercent,
    )
    this.m_timer.Enabled = true
  }

  StopTimer() {
    this.m_timer.Enabled = false
  }

  get Glide(): number {
    let glide: number = Math.Pow(this.m_settings.Gliding, 0.15)
    //  0 to 1
    if (glide > 1) {
      glide = 1
    }

    if (glide < 0) {
      glide = 0
    }

    return glide
  }

  SpinStep(source: Object, e: System.Timers.ElapsedEventArgs) {
    //  Dampen as needed..
    let glide: number = this.Glide
    this.m_lastDragData.XDiff = this.m_lastDragData.XDiff * glide
    this.m_lastDragData.YDiff = this.m_lastDragData.YDiff * glide
    this.m_lastDragData.XPercent = this.m_lastDragData.XPercent * glide
    this.m_lastDragData.YPercent = this.m_lastDragData.YPercent * glide
    const cutoff: number = 0.01
    let done: boolean =
      Math.Abs(this.m_lastDragData.XDiff) < cutoff ||
      Math.Abs(this.m_lastDragData.YDiff) < cutoff
    if (!this.Handler.IsSpinning || done) {
      System.Diagnostics.Trace.WriteLine('End Spin')
      this.Handler.IsSpinning = false
      this.m_lastDragDataQueue.Clear()
      this.StopTimer()
    } else {
      // System.Diagnostics.Trace.WriteLine( "Spin Step" );
      this.PerformDrag(this.m_lastDragData)
    }

    //  This will invalidate the control.
    m_tickle()
  }

  PerformDrag2D(dragData: DragData) {
    switch (dragData.Button) {
      case MouseButtons.Left:
        this.Recenter()
        // System.Diagnostics.Trace.WriteLine( "DragData:" + dragData.X + ":" + dragData.Y );
        //  Our absolute coordinates of dragged sreen point.
        let point1: Vector3D = this.ScreenToGL(
          new Vector3D(
            dragData.X - dragData.XDiff,
            dragData.Y - dragData.YDiff,
          ),
        )
        let point2: Vector3D = this.ScreenToGL(
          new Vector3D(dragData.X, dragData.Y),
        )
        //  We're going to use a different motion model for Don's code.
        switch (this.m_geometry) {
          case Geometry.Hyperbolic:
            let pan: Mobius = new Mobius()
            //  Clamp it.
            const max: number = 0.98
            if (point1.Abs() > max || point2.Abs() > max) {
              break
            }

            //  Don's pure translation code has to be composed in the correct order.
            //  (the pan must be applied first).
            pan.PureTranslation(Geometry.Hyperbolic, point1, point2)
            this.m_isometry.Mobius = pan.Multiply(
              this.m_isometry.Mobius,
            )
            //  Numerical stability hack.
            //  Things explode after panning for a while otherwise.
            let temp: Mobius = this.m_isometry.Mobius

            //  6 didn't turn out to be enough for one puzzle.  Downside to rounding too much?
            temp.Round(5)

            this.m_isometry.Mobius = temp
            //  Should have a 0 imaginary component.
            // System.Diagnostics.Trace.WriteLine( "TraceSquared:" + m_isometry.Mobius.TraceSquared );
            break
          case Geometry.Euclidean:
          case Geometry.Spherical:
            //  Do a geodesic pan.
            this.GeodesicPan(point1, point2)
            break
          default:
            break
        }

        break
      case MouseButtons.Middle:
        this.m_rotation = this.m_rotation + dragData.Rotation
        break
      case MouseButtons.Right:
        this.m_viewScale =
          this.m_viewScale + 3 * (this.m_viewScale * dragData.YPercent)
        const smallestScale: number
        2
        let largestScale: number = 3
        if (this.m_geometry == Geometry.Spherical) {
          largestScale = largestScale * 20
        }

        if (
          this.m_geometry == Geometry.Hyperbolic &&
          this.m_settings.HyperbolicModel == HModel.Orthographic
        ) {
          largestScale = largestScale * 5
        }

        if (this.m_viewScale < smallestScale) {
          this.m_viewScale = smallestScale
        }

        if (this.m_viewScale > largestScale) {
          this.m_viewScale = largestScale
        }

        this.UpdateImageSpace()
        break
      default:
        break
    }
  }

  PerformDrag3D(dragData: DragData) {
    switch (dragData.Button) {
      case MouseButtons.Left:
        //  The spherical coordinate radius.
        let radius: number = this.m_viewLookFrom3D.Abs()
        if (!Tolerance.Zero(radius)) {
          let newLookFrom: Vector3D = this.m_viewLookFrom3D
          let newUp: Vector3D = this.m_up3D
          let rotationAxis: Vector3D = newUp.Cross(newLookFrom)
          rotationAxis.Normalize()
          let angle: number = System.Math.Atan2(
            dragData.XDiff,
            dragData.YDiff,
          )
          rotationAxis.RotateAboutAxis(newLookFrom, angle)
          let magnitude: number =
            (System.Math.Sqrt(
              dragData.XDiff * dragData.XDiff +
                dragData.YDiff * dragData.YDiff,
            ) /
              100) *
            -1
          newLookFrom.RotateAboutAxis(rotationAxis, magnitude)
          newUp.RotateAboutAxis(rotationAxis, magnitude)
          this.m_viewLookFrom3D = newLookFrom
          this.m_up3D = newUp
        }

        break
      case MouseButtons.Right:
        this.m_viewLookFrom3D = MouseMotion.PerformDrag3DRight(
          dragData,
          this.m_viewLookFrom3D,
        )
        break
      default:
        break
    }
  }

  static PerformDrag3DRight(
    dragData: DragData,
    lookFrom: Vector3D,
  ): Vector3D {
    //  The view vector magnitude.
    let abs: number = lookFrom.Abs()
    let newLookFrom: Vector3D = lookFrom
    //  Increment it.
    abs = abs + 5 * (abs * dragData.YPercent)
    newLookFrom.Normalize()
    newLookFrom = newLookFrom * abs
    let smallestRadius: number
    2
    if (newLookFrom.Abs() < smallestRadius) {
      newLookFrom.Normalize()
      newLookFrom = newLookFrom * smallestRadius
    }

    let largestRadius: number = 100
    if (newLookFrom.Abs() > largestRadius) {
      newLookFrom.Normalize()
      newLookFrom = newLookFrom * largestRadius
    }

    return newLookFrom
  }

  UpdateProjectionDistance(dragData: DragData) {
    let val: number = this.ProjectionDistance4D
    //  Increment it.
    val = val + 5 * (val * dragData.YPercent)
    if (val < 1) {
      val = 1
    }

    if (val > 10) {
      val = 10
    }

    this.ProjectionDistance4D = val
  }

  PerformDrag4D(dragData: DragData) {
    let left: boolean = dragData.Button == MouseButtons.Left
    let right: boolean = dragData.Button == MouseButtons.Right
    let shiftDown: boolean = dragData.ShiftDown
    let ctrlDown: boolean = dragData.CtrlDown
    if (left) {
      this.RotHandler4D.MouseDragged(
        dragData.XDiff,
        dragData.YDiff * -1,
        !shiftDown && !ctrlDown,
        shiftDown,
        ctrlDown,
      )
    }

    //  Zooming and Projection Distance.
    if (right) {
      if (shiftDown || ctrlDown) {
        this.UpdateProjectionDistance(dragData)
      } else {
        this.m_viewLookFrom4D = MouseMotion.PerformDrag3DRight(
          dragData,
          this.m_viewLookFrom4D,
        )
      }
    }
  }

  Recenter() {
    if (this.Closest == null || !this.Closest.IsSlave) {
      return
    }

    //  Isometry which will move center tile to closest.
    let recenter: Isometry = this.Closest.Isometry.Inverse()
    //  NOTE: This shouldn't be called multiple times before recalculating new center
    //          so we safeguard against that by setting Closest to null after.
    this.m_isometry = this.m_isometry * recenter
    this.Closest = null
  }

  ///  <summary>
  ///  Helper to do a geodesic pan.
  ///  </summary>
  GeodesicPan(p1: Vector3D, p2: Vector3D) {
    let pan: Mobius = new Mobius()
    let inverse: Isometry = this.m_isometry.Inverse()
    p1 = inverse.Apply(p1)
    p2 = inverse.Apply(p2)
    pan.Geodesic(this.m_geometry, p1, p2)
    this.m_isometry.Mobius = this.m_isometry.Mobius * pan
  }
}
