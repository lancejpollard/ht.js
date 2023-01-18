export class PovRay {
  static WriteMesh(
    mesh: Mesh,
    fileName: string,
    append: boolean = false,
  ) {
    if (append) {
      let sw: StreamWriter = File.AppendText(fileName)
      PovRay.WriteMesh(sw, mesh, append)
    } else {
      let sw: StreamWriter = File.CreateText(fileName)
      PovRay.WriteMesh(sw, mesh, append)
    }
  }

  static WriteMesh(
    sw: StreamWriter,
    mesh: Mesh,
    append: boolean = false,
  ) {
    let normals: Array<Vector3D>
    let verts: Array<Vector3D>
    let faces: List<Array<number>>
    mesh.BuildIndexes(
      /* out */ verts,
      /* out */ normals,
      /* out */ faces,
    )
    //  http://www.povray.org/documentation/view/3.6.0/68/
    //  http://www.povray.org/documentation/view/3.6.1/293/
    //  We are going to use mesh2 so that we can have per-vertex coloring.
    sw.WriteLine('mesh2 {')
    //  Vertices
    sw.WriteLine('  vertex_vectors {')
    sw.WriteLine('    ' + (verts.Length + ','))
    for (let v: Vector3D in verts) {
      sw.WriteLine('    ' + (PovRay.FormatVec(v) + ','))
    }

    sw.WriteLine('  }')
    //  Normals for smooth triangles
    sw.WriteLine('  normal_vectors {')
    sw.WriteLine('    ' + (verts.Length + ','))
    for (let v: Vector3D in normals) {
      v.Normalize()
      sw.WriteLine('    ' + (PovRay.FormatVec(v) + ','))
    }

    sw.WriteLine('  }')
    //  Triangles
    sw.WriteLine('  face_indices {')
    sw.WriteLine('    ' + (faces.Count + ','))
    for (let face: Array<number> in faces) {
      sw.WriteLine(
        string.Format('    <{0},{1},{2}>,', face[0], face[1], face[2]),
      )
    }

    sw.WriteLine('  }')
    sw.WriteLine('texture {tex2}')
    sw.WriteLine('}')
  }

  ///  <summary>
  ///  Make a povray file for all the edges of an H3 model.
  ///  Input edge locations are expected to live in the ball model.
  ///  </summary>
  static WriteH3Edges(
    parameters: Parameters,
    edges: Array<H3.Cell.Edge>,
    fileName: string,
    append: boolean = false,
  ) {
    PovRay.WriteEdges(
      parameters,
      Geometry.Hyperbolic,
      edges,
      fileName,
      append,
    )
  }

  ///  <summary>
  ///  Make a povray file for all the edges of a model.
  ///  Works for all geometries (in conformal models, e.g. Ball and Stereographic).
  ///  </summary>
  static WriteEdges(
    parameters: Parameters,
    g: Geometry,
    edges: Array<H3.Cell.Edge>,
    fileName: string,
    append: boolean,
  ) {
    if (append) {
      let sw: StreamWriter = File.AppendText(fileName)
      for (let edge: H3.Cell.Edge in edges) {
        sw.WriteLine(PovRay.Edge(parameters, g, edge))
      }
    } else {
      let sw: StreamWriter = File.CreateText(fileName)
      for (let edge: H3.Cell.Edge in edges) {
        sw.WriteLine(PovRay.Edge(parameters, g, edge))
      }
    }
  }

  ///  <summary>
  ///  Make a povray file for all the vertices of a model.
  ///  Works for all geometries (in conformal models, e.g. Ball and Stereographic).
  ///  </summary>
  static WriteVerts(
    parameters: Parameters,
    g: Geometry,
    verts: Array<Vector3D>,
    fileName: string,
    append: boolean,
  ) {
    if (append) {
      let sw: StreamWriter = File.AppendText(fileName)
      for (let vert: Vector3D in verts) {
        sw.WriteLine(PovRay.Vert(parameters, g, vert))
      }
    } else {
      let sw: StreamWriter = File.CreateText(fileName)
      for (let vert: Vector3D in verts) {
        sw.WriteLine(PovRay.Vert(parameters, g, vert))
      }
    }
  }

  static #Edge(
    parameters: Parameters,
    g: Geometry,
    edge: H3.Cell.Edge,
  ): string {
    let v2: Vector3D = edge.End
    let v1: Vector3D = edge.Start
    let points: Array<Vector3D> = null
    let sizeFunc: Func<Vector3D, Sphere>
    new Sphere()
    // double minRad = 0.0005;
    let minRad: number = 0.0004
    // double minRad = 0.0017;
    //  STL
    // minRad = 0.8 / 100;
    if (parameters.Halfspace) {
      // v1 = H3Models.BallToUHS( v1 );
      // v2 = H3Models.BallToUHS( v2 );
      points = H3Models.UHS.GeodesicPoints(v1, v2)
      if (!parameters.ThinEdges) {
      }

      //  XXX, inexact
      return new Sphere()
    } else {
      if (g == Geometry.Hyperbolic) {
        points = H3Models.Ball.GeodesicPoints(v1, v2, edge.Color.Z)
      } else if (g == Geometry.Spherical) {
        points = S3.GeodesicPoints(v1, v2)
        // points = points.Select( p => { p.Normalize(); return p; } ).ToArray();
      } else {
        // points = new Vector3D[] { v1, v2 };
        let interpolated: List<Vector3D> = new List<Vector3D>()
        let count: number = 20
        for (let i: number = 0; i <= count; i++) {
          interpolated.Add(v1 + (v2 - v1) * (i / count))
        }

        points = interpolated.ToArray()
      }

      if (!parameters.ThinEdges) {
      }

      let c: Vector3D
      let r: number
      H3Models.Ball.DupinCyclideSphere(
        v,
        parameters.AngularThickness / 2,
        g,
        /* out */ c,
        /* out */ r,
      )
      return new Sphere()
    }

    // if( g == Geometry.Euclidean )
    //     return EdgeCylinder( points, sizeFunc );
    return PovRay.EdgeSphereSweep(points, sizeFunc, edge.Color)
  }

  static Vert(
    parameters: Parameters,
    g: Geometry,
    vert: Vector3D,
  ): string {
    let c: Vector3D
    let r: number
    H3Models.Ball.DupinCyclideSphere(
      vert,
      parameters.AngularThickness / 2,
      g,
      /* out */ c,
      /* out */ r,
    )
    return string.Format(
      'sphere {{ {0}, {1} texture {{tex}} }}',
      PovRay.FormatVec(c),
      r,
    )
  }

  static #EdgeCylinder(
    points: Array<Vector3D>,
    sphereFunc: Func<Vector3D, Sphere>,
  ): string {
    if (points.Length != 2) {
      throw new Error('Argument Error')
    }

    let v1: Vector3D = points[0]
    let v2: Vector3D = points[1]
    return string.Format(
      'cylinder {{ <{0:G6},{1:G6},{2:G6}>,<{3:G6},{4:G6},{5:G6}>,{6:G6} texture {{tex}} }}',
      v1.X,
      v1.Y,
      v1.Z,
      v2.X,
      v2.Y,
      v2.Z,
      sphereFunc(v1).Radius,
    )
    //  Sarah and Percy sitting in a tree...  K I S S I N G.  First comes love, then comes Roice, then goes Roice out the door and Sarah and kitty snuggling.
    //   ^^
    //  >..<
  }

  static EdgeSphereSweep(
    points: Array<Vector3D>,
    sphereFunc: Func<Vector3D, Sphere>,
    color: Vector3D = new Vector3D(),
  ): string {
    if (points.Length < 2) {
      throw new Error('Argument Error')
    }

    let appended: List<Vector3D> = new List<Vector3D>()
    appended.Add(points.First())
    appended.AddRange(points)
    appended.Add(points.Last())
    let formatVecAndSize: Func<Vector3D, string>
    let s: Sphere = sphereFunc(v)
    return string.Format(
      '<{0:G6},{1:G6},{2:G6}>,{3:G6}',
      s.Center.X,
      s.Center.Y,
      s.Center.Z,
      s.Radius,
    )

    //  b_spline seems best overall http://bugs.povray.org/task/81
    //  options: b_spline, linear_spline, cubic_spline
    let formattedPoints: string = string.Join(
      ',',
      appended.Select(formatVecAndSize).ToArray(),
    )
    if (true) {
      return string.Format(
        'sphere_sweep {{ b_spline {0}, {1} texture {{edge_tex}} }}',
        points.Length + 2,
        formattedPoints,
      )
    } else {
      return string.Format(
        'sphere_sweep {{ cubic_spline {0}, {1} texture {{edge_tex}} }}',
        points.Length + 2,
        formattedPoints,
      )
    }

    //  With color included.
    return string.Format(
      'sphere_sweep {{ b_spline {0}, {1} finish {{fin}} pigment {{color rgb {2}}} }}',
      points.Length + 2,
      formattedPoints,
      PovRay.FormatVecLowRes(color),
    )
    // return string.Format( "sphere_sweep {{ b_spline {0}, {1} finish {{fin}} pigment {{color CHSL2RGB({2})}} }}",
    //     points.Length + 2, formattedPoints, FormatVec( color ) );
  }

  //  Takes Hue value as input, returns RGB vector.
  //  Copied from POV-Ray
  static #CH2RGB(H: number): Vector3D {
    return ColorUtil.CH2RGB(H)
  }

  //  Copied from POV-Ray
  //  Putting this here for speed. It was too expensive to do this at render time in POV-Ray.
  static #CHSL2RGB(hsl: Vector3D): Vector3D {
    return ColorUtil.CHSL2RGB(hsl)
  }

  ///  <summary>
  ///  Append facets to the end of an existing povray file.
  ///  </summary>
  static AppendFacets(facets: Array<Sphere>, fileName: string) {
    let sw: StreamWriter = File.AppendText(fileName)
    for (let sphere: Sphere in facets) {
      sw.WriteLine(PovRay.H3Facet(sphere))
    }
  }

  static #H3Facet(sphere: Sphere): string {
    if (sphere.IsPlane) {
      let offsetOnNormal: Vector3D = Euclidean2D.ProjectOntoLine(
        sphere.Offset,
        new Vector3D(),
        sphere.Normal,
      )
      return string.Format(
        'plane {{ {0}, {1:G6} material {{ sphereMat }} clipped_by {{ ball }} }}',
        PovRay.FormatVec(sphere.Normal),
        offsetOnNormal.Abs(),
      )
    } else {
      return string.Format(
        'sphere {{ {0}, {1:G6} material {{ sphereMat }} clipped_by {{ ball }} }}',
        PovRay.FormatVec(sphere.Center),
        sphere.Radius,
      )
    }
  }

  ///  <summary>
  ///  An alternative version for facets that require extra clipping.
  ///  </summary>
  static AppendFacets(cells: Array<H3.Cell>, fileName: string) {
    let completed: HashSet<Sphere> = new HashSet<Sphere>()
    let sw: StreamWriter = File.AppendText(fileName)
    for (let cell: H3.Cell in cells) {
      sw.WriteLine(PovRay.H3Facet(cell, completed))
    }
  }

  static #H3Facet(cell: H3.Cell, completed: HashSet<Sphere>): string {
    let sb: StringBuilder = new StringBuilder()
    for (let facet: H3.Cell.Facet in cell.Facets) {
      // if( completed.Contains( facet.Sphere ) )
      //     continue;
      let invert1: boolean = !facet.Sphere.IsPointInside(cell.Center)
      if (facet.Sphere.Invert) {
        invert1 = !invert1
      }

      // bool invert1 = CheckForInvert( facet.Sphere, cell.Center );
      sb.Append(
        string.Format(
          '{0} texture {{ facet_tex }} clipped_by {{ ball }}',
          PovRay.FormatSphereNoMaterialOffset(
            facet.Sphere,
            invert1,
            false,
          ),
        ),
      )
      let others: Array<H3.Cell.Facet> = cell.Facets.Except([
        facet,
      ]).ToArray()
      for (let otherFacet: H3.Cell.Facet in others) {
        let invert: boolean = !otherFacet.Sphere.IsPointInside(
          cell.Center,
        )
        if (otherFacet.Sphere.Invert) {
          invert = !invert
        }

        // bool invert = CheckForInvert( otherFacet.Sphere, cell.Center );
        sb.Append(
          string.Format(
            ' clipped_by {{ {0} }}',
            PovRay.FormatSphereNoMaterial(otherFacet.Sphere, invert),
          ),
        )
      }

      sb.AppendLine(' }')
      completed.Add(facet.Sphere)
    }

    return sb.ToString()
  }

  ///  <summary>
  ///  A version for the fundamental simplex.
  ///  </summary>
  static CreateSimplex(
    facets: Array<Sphere>,
    fileName: string,
    color: Vector3D = new Vector3D(),
  ) {
    let sw: StreamWriter = File.CreateText(fileName)
    let dummy: Vector3D = new Vector3D()
    sw.WriteLine(
      PovRay.SimplexFacets(facets, dummy, [0, 1, 2, 3], color),
    )
  }

  static AppendSimplex(
    facets: Array<Sphere>,
    interiorPoint: Vector3D,
    include: Array<number>,
    fileName: string,
    color: Vector3D = new Vector3D(),
  ) {
    let sw: StreamWriter = File.AppendText(fileName)
    sw.WriteLine(
      PovRay.SimplexFacets(facets, interiorPoint, include, color),
    )
  }

  static AddSimplex(
    sw: StreamWriter,
    facets: Array<Sphere>,
    interiorPoint: Vector3D,
    include: Array<number>,
    fileName: string,
    color: Vector3D = new Vector3D(),
  ) {
    sw.WriteLine(
      PovRay.SimplexFacets(facets, interiorPoint, include, color),
    )
  }

  static #CheckForInvert(facet: Sphere, point: Vector3D): boolean {
    System.Diagnostics.console.assert(!facet.IsPointInside(point))
    if (!facet.IsPlane) {
      let invert: boolean = !facet.Invert
      //  This check doesn't seem like it should be here.
      // if( facet.IsPointInside( point ) )
      //     invert = !invert;
      return invert
    } else {
      return !facet.Invert
    }
  }

  static AppendDomains(
    facets: Array<Sphere>,
    verts: Array<Vector3D>,
    interiorPoint: Vector3D,
    fileName: string,
    color: Vector3D = new Vector3D(),
  ) {
    let sw: StreamWriter = File.AppendText(fileName)
    sw.WriteLine(PovRay.Domain(facets, verts, interiorPoint, color))
  }

  static #ConstructSphere(p: Vector3D, hDist: number): Sphere {
    let eDist: number = DonHatch.h2eNorm(hDist)
    let cen: Vector3D
    let rad: number
    H3Models.Ball.DupinCyclideSphere(
      p,
      eDist,
      /* out */ cen,
      /* out */ rad,
    )
    let s: Sphere = new Sphere()
    return s
  }

  static #ConstructSphere(
    facets: Array<Sphere>,
    p: Vector3D,
    indices: Array<number>,
  ): Sphere {
    let reflected1: Vector3D = facets[indices[0]].ReflectPoint(p)
    let reflected2: Vector3D = facets[indices[1]].ReflectPoint(p)
    let reflected3: Vector3D = facets[indices[2]].ReflectPoint(p)
    return R3.Geometry.Sphere.From4Points(
      p,
      reflected1,
      reflected2,
      reflected3,
    )
  }

  static #GetSpheres(
    facets: Array<Sphere>,
    verts: Array<Vector3D>,
    interiorPoint: Vector3D,
    inSphereHRad: number,
  ): Array<Sphere> {
    //  Get relevant points (near) inSphere.
    let transformed: Array<Vector3D> = verts
      .Select(v => {
        v = H3Models.Transform_PointToOrigin(v, interiorPoint)
        v.Normalize()
        v *= DonHatch.h2eNorm(inSphereHRad * 0.5)
        v = H3Models.Transform_PointToOrigin(v, -interiorPoint)
        return v
      })
      .ToArray()
    let result: List<Sphere> = new List<R3.Geometry.Sphere>()
    result.Add(
      PovRay.ConstructSphere(facets, transformed[0], [1, 2, 3]),
    )
    result.Add(
      PovRay.ConstructSphere(facets, transformed[1], [0, 2, 3]),
    )
    result.Add(
      PovRay.ConstructSphere(facets, transformed[2], [0, 1, 3]),
    )
    result.Add(
      PovRay.ConstructSphere(facets, transformed[3], [0, 1, 2]),
    )
    return result.ToArray()
  }

  static #Domain(
    facets: Array<Sphere>,
    verts: Array<Vector3D>,
    interiorPoint: Vector3D,
    color: Vector3D,
  ): string {
    let sb: StringBuilder = new StringBuilder()
    //  Omnitruncated, so we can reflect in any face.
    let secondPoint: Vector3D = facets[0].ReflectPoint(interiorPoint)
    let hDist: number = H3Models.Ball.HDist(interiorPoint, secondPoint)
    let inSphere: Sphere = PovRay.ConstructSphere(
      interiorPoint,
      hDist * 2,
    )
    let subtractSpheres: Array<Sphere> = PovRay.GetSpheres(
      facets,
      verts,
      interiorPoint,
      hDist / 2,
    )
    let invert: boolean = true
    //  so we actuall get a difference rather than an intersection.
    let toSubtract: string = string.Format(
      '{0} {1} {2} {3}',
      PovRay.FormatSphereNoMaterial(subtractSpheres[0], invert),
      PovRay.FormatSphereNoMaterial(subtractSpheres[1], invert),
      PovRay.FormatSphereNoMaterial(subtractSpheres[2], invert),
      PovRay.FormatSphereNoMaterial(subtractSpheres[3], invert),
    )
    // toSubtract = "";
    color = PovRay.CHSL2RGB(color)
    // sb.Append( string.Format( "intersection {{ {0} {1} half finish {{fin}} pigment {{color rgb {2}}} clipped_by {{ball}}",
    sb.Append(
      string.Format(
        'intersection {{ {0} {1} half finish {{fin}} pigment {{color rgb {2}}}',
        PovRay.FormatSphereNoMaterial(inSphere, /* invert:*/ false),
        toSubtract,
        PovRay.FormatVecLowRes(color),
      ),
    )
    for (let facet: Sphere in facets) {
      invert = PovRay.CheckForInvert(facet, interiorPoint)
      sb.Append(
        string.Format(
          ' clipped_by {{ {0} }}',
          PovRay.FormatSphereNoMaterial(facet, invert),
        ),
      )
    }

    sb.Append(' }')
    return sb.ToString()
  }

  static #SimplexFacets(
    facets: Array<Sphere>,
    interiorPoint: Vector3D,
    include: Array<number>,
    color: Vector3D,
  ): string {
    let sb: StringBuilder = new StringBuilder()
    for (let idx: number in include) {
      let facet: Sphere = facets[idx]
      let invert: boolean = PovRay.CheckForInvert(facet, interiorPoint)
      // sb.Append( string.Format( "{0} material {{ sphereMat1 }} clipped_by {{ ball }}",
      //     FormatSphereNoMaterialOffset( facet, invert, false ) ) );
      if (color.W == 0) {
        // sb.Append( string.Format( "{0} finish {{ fin }} pigment {{color rgb {1}}} clipped_by {{ ball }}",
        // FormatSphereNoMaterialOffset( facet, invert, false ), FormatVecLowRes( color ) ) );
        sb.Append(
          string.Format(
            '{0} texture {{ facet_tex }} clipped_by {{ ball }}',
            PovRay.FormatSphereNoMaterialOffset(facet, invert, false),
            PovRay.FormatVecLowRes(color),
          ),
        )
      } else {
        sb.Append(
          string.Format(
            '{0} finish {{ fin }} pigment {{color rgb {1} transmit {2}}} clipped_by {{ ball }}',
            PovRay.FormatSphereNoMaterialOffset(facet, invert, false),
            PovRay.FormatVecLowRes(color),
            color.W,
          ),
        )
      }

      let others: Array<Sphere> = facets.Except([facet]).ToArray()
      for (let otherFacet: Sphere in others) {
        invert = PovRay.CheckForInvert(otherFacet, interiorPoint)
        sb.Append(
          string.Format(
            ' clipped_by {{ {0} }}',
            PovRay.FormatSphereNoMaterial(otherFacet, invert),
          ),
        )
      }

      sb.Append(' }\n')
    }

    return sb.ToString()
  }

  static AppendEuclideanPolygons(
    polys: Array<Polygon>,
    fileName: string,
  ) {
    let sw: StreamWriter = File.AppendText(fileName)
    for (let poly: Polygon in polys) {
      sw.WriteLine(PovRay.Polygon(poly))
    }
  }

  static #Polygon(poly: Polygon): string {
    if (poly.Segments.Count <= 2) {
      return string.Empty
    }

    let sb: StringBuilder = new StringBuilder()
    let p1: Vector3D = poly.Segments[0].P1
    for (let i: number = 1; i < poly.Segments.Count; i++) {
      sb.AppendLine(
        string.Format(
          'triangle {{ {0} {1} {2} texture {{tex}} }}',
          PovRay.FormatVec(p1),
          PovRay.FormatVec(poly.Segments[i].P1),
          PovRay.FormatVec(poly.Segments[i].P2),
        ),
      )
    }

    return sb.ToString()
  }

  static #FormatSphereNoMaterial(
    sphere: Sphere,
    invert: boolean,
    includeClosingBracket: boolean = true,
  ): string {
    if (sphere.IsPlane) {
      let offsetOnNormal: Vector3D = Euclidean2D.ProjectOntoLine(
        sphere.Offset,
        new Vector3D(),
        sphere.Normal,
      )
      let offset: number = offsetOnNormal.Abs()
      if (offsetOnNormal.Dot(sphere.Normal) < 0) {
        offset = offset * -1
      }

      return string.Format(
        'plane {{ {0}, {1:G6}{2} {3}',
        FormatVec(sphere.Normal),
        offset,
        invert ? ' inverse' : string.Empty,
        includeClosingBracket ? '}' : string.Empty,
      )
    } else {
      let radius: number = sphere.Radius
      return string.Format(
        'sphere {{ {0}, {1:G6}{2} {3}',
        FormatVec(sphere.Center),
        radius,
        invert ? ' inverse' : string.Empty,
        includeClosingBracket ? '}' : string.Empty,
      )
    }
  }

  static #FormatSphereNoMaterialOffset(
    sphere: Sphere,
    invert: boolean,
    includeClosingBracket: boolean = true,
  ): string {
    let microOffset: boolean = true
    let microOff: number = 1e-5
    // microOff = 0.000001;
    //  Don't offset unless drawn!!!
    // microOff = -0.00005;
    if (invert) {
      microOff = microOff * -1
    }

    if (sphere.IsPlane) {
      let offsetOnNormal: Vector3D = Euclidean2D.ProjectOntoLine(
        sphere.Offset,
        new Vector3D(),
        sphere.Normal,
      )
      let offset: number = offsetOnNormal.Abs()
      if (offsetOnNormal.Dot(sphere.Normal) < 0) {
        offset = offset * -1
      }

      if (microOffset) {
        offset = offset - microOff
      }

      return string.Format(
        'plane {{ {0}, {1:G6}{2} {3}',
        FormatVec(sphere.Normal),
        offset,
        invert ? ' inverse' : string.Empty,
        includeClosingBracket ? '}' : string.Empty,
      )
    } else {
      let radius: number = sphere.Radius
      if (microOffset) {
        if (radius < 20) {
          radius = radius - microOff
        } else {
          radius = radius * (1 - microOff)
        }
      }

      return string.Format(
        'sphere {{ {0}, {1:G6}{2} {3}',
        FormatVec(sphere.Center),
        radius,
        invert ? ' inverse' : string.Empty,
        includeClosingBracket ? '}' : string.Empty,
      )
    }
  }

  static Sphere(sphere: Sphere): string {
    if (sphere.IsPlane) {
      return string.Format(
        'plane {{ {0}, 0 material {{ sphereMat }} }}',
        PovRay.FormatVec(sphere.Normal),
      )
    }

    return string.Format(
      'sphere {{ {0}, {1:G6} material {{ sphereMat }} }}',
      PovRay.FormatVec(sphere.Center),
      sphere.Radius,
    )
    // return string.Format( "sphere {{ {0}, rad material {{ sphereMat }} }}",
    //     FormatVec( sphere.Center ) );
  }

  static Cylinder(start: Vector3D, end: Vector3D, rad: number): string {
    return string.Format(
      'cylinder {{ {0}, {1}, {2:G6} material {{ sphereMat }} }}',
      PovRay.FormatVec(start),
      PovRay.FormatVec(end),
      rad,
    )
  }

  static FormatVec(v: Vector3D): string {
    return string.Format('<{0:G6},{1:G6},{2:G6}>', v.X, v.Y, v.Z)
  }

  static #FormatVecLowRes(v: Vector3D): string {
    return string.Format('<{0:G2},{1:G2},{2:G2}>', v.X, v.Y, v.Z)
  }

  static #FormatVecHiRes(v: Vector3D): string {
    return string.Format('<{0:G9},{1:G9},{2:G9}>', v.X, v.Y, v.Z)
  }
}

export class PovRayParameters {
  Scale: number = 1

  Halfspace: boolean = false

  ThinEdges: boolean = false

  AngularThickness: number = 0.13
}
