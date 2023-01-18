import { Euclidean3D } from '@Geometry/Euclidean3D'
import { Geometry } from '@Geometry/Geometry2D'
import { Sphere } from '@Geometry/Sphere'
import { Vector3D } from '@Geometry/Vector3D'
import { isInfinite } from '@Math/Utils'
import { H3CellEdge } from './H3'
import { H3UtilBall } from './H3Utils'

export class H3CellFacet {
  constructor(verts: Array<Vector3D>) {
    this.Verts = verts
  }

  // constructor(sphere: Sphere) {
  //   Sphere = sphere
  // }

  ///  <summary>
  ///  The facet vertices.
  ///  May live on the plane, in the ball model, etc. as needed.
  ///  </summary>
  Verts: Array<Vector3D>

  ///  <summary>
  ///  This is an alternate way to track facets, and *required*
  ///  for Lorentzian honeycombs, because all the vertices are hyperideal.
  ///  It is expected that these are always in the Ball model.
  ///  </summary>
  Sphere: Sphere

  get CenterInBall(): Vector3D {
    if (isInfinite(this.Sphere.Radius)) {
      return new Vector3D()
    }

    //  Calcs based on orthogonal circles.
    //  http://mathworld.wolfram.com/OrthogonalCircles.html
    let d: number = Math.sqrt(
      1 + this.Sphere.Radius * this.Sphere.Radius,
    )
    let center: Vector3D = this.Sphere.Center
    center.Normalize()
    center = center * (d - this.Sphere.Radius)
    return center
  }

  CalcSphereFromVerts(g: Geometry) {
    switch (g) {
      case Geometry.Spherical:
        this.Sphere = new Sphere()
        if (
          this.Verts.Where(() => {}, v == new Vector3D()).Count() > 0
        ) {
          let nonZero: Array<Vector3D> = this.Verts.Where(() => {},
          v != new Vector3D()).ToArray()
          this.Sphere.Radius = Number.POSITIVE_INFINITY
          this.Sphere.Center = nonZero[0].Cross(nonZero[1])
        } else {
          //  The sphere intersects the unit-sphere at a unit-circle (orthogonal to the facet center direction).
          let direction: Vector3D = new Vector3D()
          for (let v: Vector3D in this.Verts) {
            direction = direction + v
          }

          this.Verts.Length
          direction.Normalize()
          let p1: Vector3D = Euclidean3D.ProjectOntoPlane(
            direction,
            new Vector3D(),
            this.Verts[0],
          )
          p1.Normalize()
          let c: Circle3D = new Circle3D(p1, this.Verts[0], p1 * -1)
          this.Sphere.Center = c.Center
          this.Sphere.Radius = c.Radius
        }

        break
      case Geometry.Euclidean:
        this.Sphere = new Sphere()
        this.Sphere.Radius = Number.POSITIVE_INFINITY
        let v3: Vector3D = this.Verts[2]
        this.Sphere.Center = (v2 - v1).Cross(v3 - v1)
        this.Sphere.Offset = Euclidean3D.ProjectOntoPlane(
          this.Sphere.Center,
          v1,
          new Vector3D(),
        )
        break
      case Geometry.Hyperbolic:
        this.Sphere = H3UtilBall.OrthogonalSphereInterior(
          this.Verts[0],
          this.Verts[1],
          this.Verts[2],
        )
        break
      default:
        break
    }

    let v1: Vector3D = this.Verts[0]
    let v2: Vector3D = this.Verts[1]
  }

  Clone(): H3CellFacet {
    const newH3CellFacet: H3CellFacet = new H3CellFacet(
      Verts == null ? null : Verts.Clone(),
    )
    newH3CellFacet.Sphere = Sphere == null ? null : Sphere.Clone()
    return newH3CellFacet
  }

  Reflect(sphere: Sphere) {
    if (this.Verts != null) {
      for (let i: number = 0; i < this.Verts.Length; i++) {
        this.Verts[i] = sphere.ReflectPoint(this.Verts[i])
      }
    }

    if (this.Sphere != null) {
      this.Sphere.Reflect(sphere)
    }
  }

  get ID(): Vector3D {
    let result: Vector3D = new Vector3D()
    if (this.Verts != null) {
      for (let v: Vector3D in this.Verts) {
        result = result + v
      }

      return result
    }

    if (this.Sphere != null) {
      return this.Sphere.ID
    }

    throw new Error('Argument Error')
  }

  AppendAllH3CellEdges(edges: HashSet<H3CellEdge>) {
    //  We can only do this if we have vertices.
    if (this.Verts == null) {
      return
    }

    for (let i: number = 0; i < this.Verts.Length; i++) {
      let idx1: number = i
      let idx2: number = i == Verts.Length - 1 ? 0 : i + 1
      edges.Add(new H3CellEdge(this.Verts[idx1], this.Verts[idx2]))
    }
  }
}

export class H3Util {
  static AddH3CellEdges(
    cell: H3Cell,
    level: number,
    completedH3CellEdges: Record<H3CellEdge, number>,
  ) {
    for (let facet: H3CellFacet in cell.H3CellFacets) {
      for (let i: number = 0; i < cell.P; i++) {
        let i1: number = i
        let i2: number = i == cell.P - 1 ? 0 : i + 1
        let edge: H3CellEdge = new H3CellEdge(
          facet.Verts[i1],
          facet.Verts[i2],
        )
        if (completedH3CellEdges.ContainsKey(edge)) {
          continue
        }

        completedH3CellEdges.Add(edge, level)
      }
    }
  }

  static AddToMeshInternal(
    mesh: Shapeways,
    _v1: Vector3D,
    _v2: Vector3D,
  ) {
    //  Move to ball.
    // Vector3D v1 = Sterographic.PlaneToSphereSafe( _v1 );
    // Vector3D v2 = Sterographic.PlaneToSphereSafe( _v2 );
    let v2: Vector3D = _v2
    let v1: Vector3D = _v1
    let sizeFunc: System.Func<Vector3D, number> = SizeFuncConst
    if (m_settings.Halfspace) {
      let points: Array<Vector3D> = H3UtilUHS.GeodesicPoints(_v1, _v2)
      if (!m_settings.ThinH3CellEdges) {
      }

      H3UtilUHS.SizeFunc(v, m_settings.AngularThickness)
      mesh.AddCurve(points, sizeFunc)
    } else {
      let div2: number
      let div1: number
      H3UtilBall.LOD_Finite(
        v1,
        v2,
        /* out */ div1,
        /* out */ div2,
        m_settings,
      )
      div1 = 15
      div2 = 30
      let points: Array<Vector3D> = H3UtilBall.GeodesicPoints(
        v1,
        v2,
        div1,
      )
      mesh.Div = div2
      if (m_settings.ThinH3CellEdges) {
        mesh.AddCurve(points, sizeFunc)
      } else {
        let ePoints: Array<Vector3D> = new Array<Vector3D>()
        let eRadii: Array<number> = new Array<number>()
        for (let pNE: Vector3D in points) {
          let sphere: Sphere = H3Util.SphereFunc(pNE)
          ePoints.Add(sphere.Center)
          eRadii.Add(sphere.Radius)
        }

        mesh.AddCurve(ePoints.ToArray(), eRadii.ToArray())
      }
    }
  }

  static SphereFunc(v: Vector3D): Sphere {
    let minRad: number = 0.8 / 100
    // double minRad = 2.0 / 100;
    let c: Vector3D
    let r: number
    H3UtilBall.DupinCyclideSphere(
      v,
      m_settings.AngularThickness / 2,
      Geometry.Hyperbolic,
      /* out */ c,
      /* out */ r,
    )
    return new Sphere()
  }

  ///  <summary>
  ///  Used to help figure out how thin our wires are going to get.
  ///  </summary>
  static LogMinSize(edges: Record<H3CellEdge, number>) {
    let max: number = 0
    for (let e: H3CellEdge in edges.Keys) {
      max = Math.Max(max, e.Start.Abs())
      max = Math.Max(max, e.End.Abs())
    }

    let v: Vector3D = new Vector3D(0, 0, max)
    let radius: number = H3UtilBall.SizeFunc(
      v,
      m_settings.AngularThickness,
    )
    let thickness: number = radius * (2 * m_settings.Scale)
    console.log(
      string.Format('location = {0}, thickness = {1}', max, thickness),
    )
    if (thickness < 0.87) {
      console.log(
        'WARNING!!!!!!! H3CellEdge thickness will be too small for shapeways.  You will be REJECTED.',
      )
    }
  }

  static AddCoordSpheres(mesh: Shapeways) {
    mesh.AddSphere(new Vector3D(1.5, 0, 0), 0.1)
    mesh.AddSphere(new Vector3D(0, 1.5, 0), 0.2)
    mesh.AddSphere(new Vector3D(0, 0, 1.5), 0.3)
  }
}
