import { isInfinite } from '@Math/Utils'
import { Polytope, PolytopeProjection } from '@Geometry/Polytope'
import { Tiling } from '@Geometry/Tiling'
import { DonHatch } from '@Math/DonHatch'
import { Mobius } from '@Math/Mobius'
import { H3Output } from './H3Output'
import { H3Settings } from './H3Settings'
import { H3Supp } from './H3Supp'
import { H3Models, H3UtilUHS } from './H3Utils'
import { EHoneycomb, Honeycomb } from './Honeycomb'
import { Euclidean } from './R3'
import { Shapeways } from '@Shapeways/Shapeways'
import { Sterographic } from '@Geometry/Sterographic'
import { Vector3D } from '@Geometry/Vector3D'
import { Tile } from '@Geometry/Tile'

export class H3 {
  static m_settings: H3Settings = new H3Settings()

  // static string m_baseDir = @"C:\Users\hrn\Documents\roice\povray\H3\";
  static m_baseDir: string = '.'

  static GenHoneycombs() {
    // GenHoneycomb( EHoneycomb.H434 );
    // GenHoneycomb( EHoneycomb.H435 );
    // GenHoneycomb( EHoneycomb.H534 );
    // GenHoneycomb( EHoneycomb.H535 );
    // GenHoneycomb( EHoneycomb.H353 );
    // GenHoneycomb( EHoneycomb.H336 );
    H3.GenHoneycomb(EHoneycomb.H436)
    // GenHoneycomb( EHoneycomb.H536 );
    // GenHoneycomb( EHoneycomb.H344 );
    // GenHoneycomb( EHoneycomb.H636 );
    // GenHoneycomb( EHoneycomb.H444 );
    // GenHoneycomb( EHoneycomb.H363 );
    // GenHoneycomb( EHoneycomb.H33I );
    // H3Fundamental.Generate( EHoneycomb.H435, m_settings );
  }

  static m_levelsToKeep: Array<number> = [1, 2, 3, 4, 5]

  static m_rangeToKeep: Array<number> = [0.9, 0.96]

  static CheckRange(v: Vector3D): boolean {
    let abs: number = v.Abs()
    return abs > this.m_rangeToKeep[0] && abs < this.m_rangeToKeep[1]
  }

  static SetupShapewaysH3Settings(
    settings: H3Settings,
    honeycomb: EHoneycomb,
  ) {
    switch (honeycomb) {
      case EHoneycomb.H336:
      case EHoneycomb.H344:
        break
      case EHoneycomb.H436:
        // settings.Ball_MinLength = 0.08;
        settings.Ball_MinLength = 0.08
        break
      case EHoneycomb.H536:
        // settings.Ball_MinLength = 0.05;
        settings.Ball_MinLength = 0.03
        break
      default:
        break
    }
  }

  static SetupH3Settings(honeycomb: EHoneycomb) {
    switch (honeycomb) {
      case EHoneycomb.H435:
        this.m_settings.Ball_Cutoff = 0.95
        // this.m_settings.AngularThickness = 0.163;
        //  Sandstone
        this.m_settings.Position = PolytopeProjection.VertexCentered
        this.m_settings.Ball_Cutoff = 0.88
        this.m_settings.AngularThickness = 0.18
        //  Paper
        this.m_settings.Position = PolytopeProjection.CellCentered
        this.m_settings.Ball_Cutoff = 0.96
        this.m_settings.AngularThickness = 0.08
        break
      case EHoneycomb.H534:
        this.m_settings.Ball_Cutoff = this.m_settings.ThinEdges
          ? 0.984
          : 0.95
        // this.m_settings.Ball_MaxLength = 1;
        // this.m_settings.Ball_MinLength = 0.05;
        //  Sandstone
        // this.m_settings.Position = PolytopeProjection.CellCentered;
        // this.m_settings.Ball_Cutoff = 0.88;
        // this.m_settings.AngularThickness = 0.18;
        //  Laser Crystal
        this.m_settings.AngularThickness = 0.1
        this.m_settings.Ball_Cutoff = 0.98
        this.m_settings.H3Output = H3Output.STL
        break
      case EHoneycomb.H535:
        // this.m_settings.Ball_Cutoff = this.m_settings.ThinH3CellEdges ? 0.993 : 0.96;
        // this.m_settings.Postion = Position.VertexCentered;
        this.m_settings.ThinH3CellEdges = true
        this.m_settings.Ball_Cutoff = 0.98
        break
      case EHoneycomb.H353:
        let big: boolean = true
        if (big) {
          this.m_settings.Scale = 65
          this.m_settings.Ball_Cutoff = 0.96
          this.m_settings.AngularThickness = 0.165
        } else {
          //  Defaults
        }

        break
      case EHoneycomb.H336:
        break
      case EHoneycomb.H337:
        this.m_settings.Scale = 75
        // this.m_settings.AngularThickness = 0.202;
        this.m_settings.AngularThickness = 0.1
        break
      case EHoneycomb.H436:
        this.m_settings.AngularThickness = 0.12
        this.m_settings.Position = PolytopeProjection.FaceCentered
        break
      case EHoneycomb.H536:
        this.m_settings.Ball_MinLength = 0.02
        break
      case EHoneycomb.H344:
        this.m_settings.Ball_MinLength = 0.05
        break
      case EHoneycomb.H33I:
        17
        break
      default:
        break
    }

    if (this.m_settings.H3Output == H3Output.POVRay) {
      //  Wiki
      this.m_settings.Ball_MinLength = 0.0018
      //  534
      this.m_settings.Ball_MinLength = 0.005
      //  344
      this.m_settings.Ball_MinLength = 0.003
      //  others
      this.m_settings.Ball_MinLength = 0.001
      //  duals
      // this.m_settings.MaxH3Cells = 300000;
      // this.m_settings.MaxH3Cells = 100000;
      this.m_settings.MaxH3Cells = 750000
      // this.m_settings.Position = PolytopeProjection.EdgeCentered;
      //  Finite
      // this.m_settings.Position = PolytopeProjection.CellCentered;
      // this.m_settings.Ball_Cutoff = 0.997;
      // this.m_settings.Ball_Cutoff = 0.999;    //535
    }

    this.m_settings.H3Output = H3Output.STL
    this.m_settings.Position = PolytopeProjection.FaceCentered
    this.m_settings.AngularThickness = 0.13
  }

  ///  <summary>
  ///  Naming is from Coxeter's table.
  ///  Side lengths of fundamental right angled triangle.
  ///  We'll use these to calc isometries to change the canonical position.
  ///  2 * phi = edge length
  ///  chi = circumradius
  ///  psi = inradius
  ///  </summary>
  static HoneycombData(
    honeycomb: EHoneycomb,
    /* out */ phi: number,
    /* out */ chi: number,
    /* out */ psi: number,
  ) {
    psi = -1
    chi = -1
    phi = -1
    chi = Honeycomb.CircumRadius(honeycomb)
    psi = Honeycomb.InRadius(honeycomb)
    phi = Honeycomb.H3CellEdgeLength(honeycomb) / 2
  }

  static SetupCentering(
    honeycomb: EHoneycomb,
    settings: H3Settings,
    phi: number,
    chi: number,
    psi: number,
    /* ref */ projection: PolytopeProjection,
  ) {
    settings.Mobius = Mobius.Identity()
    switch (settings.Position) {
      case PolytopeProjection.CellCentered:
        // m_settings.Mobius = Mobius.Scale( 5 );    // {6,3,3}, {4,3,3} cell-centered (sort of)
        break
      case PolytopeProjection.FaceCentered:
        if (psi != -1) {
          settings.Mobius = Mobius.Scale(H3UtilUHS.ToE(psi))
        }

        break
      case PolytopeProjection.EdgeCentered:
        if (psi != -1) {
          settings.Mobius = Mobius.Scale(
            H3UtilUHS.ToE(Honeycomb.MidRadius(honeycomb)),
          )
          projection = PolytopeProjection.EdgeCentered
        } else {
          //  This only works for the finite cells.
          //  We can get the scaling distance we need from the analogue of the
          //  pythagorean theorm for a hyperbolic right triangle.
          //  The hypotenuse is the circumradius (chi), and the other side is the 1/2 edge length (phi).
          //  http://en.wikipedia.org/wiki/Pythagorean_theorem#Hyperbolic_geometry
          let tempScale: number = DonHatch.acosh(
            Math.cosh(chi) / Math.cosh(phi),
          )
          settings.Mobius = Mobius.Scale(H3UtilUHS.ToE(tempScale))
          projection = PolytopeProjection.VertexCentered
        }

        break
      case PolytopeProjection.VertexCentered:
        if (chi != -1) {
          settings.Mobius = Mobius.Scale(H3UtilUHS.ToE(chi))
          projection = PolytopeProjection.VertexCentered
        }

        break
      default:
        break
    }
  }

  static GenHoneycomb(honeycomb: EHoneycomb) {
    if (honeycomb == EHoneycomb.H434) {
      Euclidean.GenEuclidean()
      return
    }

    if (H3Supp.IsExotic(honeycomb)) {
      H3Supp.GenerateExotic(honeycomb, this.m_settings)
      return
    }

    H3.SetupH3Settings(honeycomb)
    // SetupShapewaysH3Settings( this.m_settings, honeycomb );
    let tiling: Tiling = H3.H3CellTilingForHoneycomb(honeycomb)
    let cellScale: number = Honeycomb.CircumRadius(honeycomb)
    if (isInfinite(cellScale)) {
      cellScale = 1
    } else {
      cellScale = DonHatch.h2eNorm(cellScale)
    }

    let mesh: Shapeways = new Shapeways()
    let finite: boolean = cellScale != 1
    if (finite) {
      H3.GenHoneycombInternal(mesh, tiling, honeycomb, cellScale)
    } else {
      H3.GenHoneycombInternal(mesh, tiling, honeycomb, cellScale)
      mesh = new Shapeways()
      // GenDualHoneycombInternal( mesh, tiling, honeycomb );
    }
  }

  static H3CellTilingForHoneycomb(honeycomb: EHoneycomb): Tiling {
    let r: number
    let p: number
    let q: number
    Honeycomb.PQR(honeycomb, /* out */ p, /* out */ q, /* out */ r)
    //  Get data we need to generate the honeycomb.
    let projection: PolytopeProjection = PolytopeProjection.FaceCentered
    let psi: number
    let phi: number
    let chi: number
    H3.HoneycombData(
      honeycomb,
      /* out */ phi,
      /* out */ chi,
      /* out */ psi,
    )
    H3.SetupCentering(
      honeycomb,
      m_settings,
      phi,
      chi,
      psi,
      /* ref */ projection,
    )
    let tiling: Tiling = new Tiling()
    let config: TilingConfig = new TilingConfig(p, q)
    tiling.GenerateInternal(config, projection)
    return tiling
  }

  static GenH3CellFacets(tiling: Tiling): Array<H3CellFacet> {
    let facets: Array<H3CellFacet> = new Array<H3CellFacet>()
    for (let tile: Tile in tiling.Tiles) {
      let points: Array<Vector3D> = new Array<Vector3D>()
      for (let seg: Segment in tile.Boundary.Segments) {
        points.Add(seg.P1)
      }

      facets.Add(new H3CellFacet(points.ToArray()))
    }

    return facets.ToArray()
  }

  static GenH3CellFacetSpheres(
    tiling: Tiling,
    inRadius: number,
  ): Array<H3CellFacet> {
    let facets: Array<H3CellFacet> = new Array<H3CellFacet>()
    for (let tile: Tile in tiling.Tiles) {
      let facetClosestToOrigin: Vector3D = tile.Boundary.Center
      facetClosestToOrigin = Sterographic.PlaneToSphereSafe(
        facetClosestToOrigin,
      )
      facetClosestToOrigin.Normalize()
      facetClosestToOrigin =
        facetClosestToOrigin * DonHatch.h2eNorm(inRadius)
      let facetSphere: Sphere = H3UtilBall.OrthogonalSphereInterior(
        facetClosestToOrigin,
      )
      facets.Add(new H3CellFacet(facetSphere))
    }

    return facets.ToArray()
  }

  ///  <summary>
  ///  Generates H3 honeycombs with cells having a finite number of facets.
  ///  </summary>
  static GenHoneycombInternal(
    mesh: Shapeways,
    tiling: Tiling,
    honeycomb: EHoneycomb,
    cellScale: number,
  ) {
    let honeycombString: string = Honeycomb.String(honeycomb, false)
    let r: number
    let p: number
    let q: number
    Honeycomb.PQR(honeycomb, /* out */ p, /* out */ q, /* out */ r)
    let inRadius: number = Honeycomb.InRadius(honeycomb)
    let facets: Array<H3CellFacet> = H3.GenH3CellFacetSpheres(
      tiling,
      inRadius,
    )
    // H3Cell first = new H3Cell( p, facets );  // Uncomment to do facets only.
    let first: H3Cell = new H3Cell(p, H3.GenH3CellFacets(tiling))
    first.ToSphere()
    //  Work in ball model.
    first.ScaleToCircumSphere(cellScale)
    first.ApplyMobius(this.m_settings.Mobius)
    //  This is for getting endpoints of cylinders for hollowing.
    let printVerts: boolean = false
    if (printVerts) {
      for (let facet in first.H3CellFacets) {
        let v: Vector3D = facet.Verts.First()
        v = v * this.m_settings.Scale
        console.log(string.Format('Vert: {0}', v))
      }
    }

    //  Recurse.
    let level: number = 1
    let completedH3CellCenters: HashSet<Vector3D> =
      new HashSet<Vector3D>()
    completedH3CellCenters.Add(first.ID)
    let completedH3CellEdges: Record<H3CellEdge, number> = new Record<
      H3CellEdge,
      number
    >(new H3CellEdgeEqualityComparer())
    //  Values are recursion level, so we can save this out.
    let completedH3CellFacets: HashSet<Sphere> = new HashSet<Sphere>(
      first.H3CellFacets.Select(() => {}, f.Sphere),
    )
    if (H3.H3CellOk(first)) {
      H3Util.AddH3CellEdges(first, level, completedH3CellEdges)
    }

    let starting: Array<H3Cell> = new Array<H3Cell>()
    starting.Add(first)
    let completedH3Cells: Array<H3Cell> = new Array<H3Cell>()
    completedH3Cells.Add(first)
    H3.ReflectRecursive(
      level,
      starting,
      completedH3CellCenters,
      completedH3CellEdges,
      completedH3Cells,
      completedH3CellFacets,
    )
    let finite: boolean = cellScale != 1
    let thresh: number
    1
    let looking: Vector3D = new Vector3D(0, 0, -1)
    let culled = completedH3CellEdges.Keys.Where(() => {},
    e.Start.Dot(looking) > thresh && e.End.Dot(looking) > thresh).ToArray()
    completedH3CellEdges = new Record<H3CellEdge, number>()
    for (let c in culled) {
      completedH3CellEdges[c] = 1
    }

    H3.RemoveDanglingH3CellEdgesRecursive(completedH3CellEdges)
    H3.SaveToFile(honeycombString, completedH3CellEdges, finite)
    // PovRay.AppendH3CellFacets( completedH3Cells.ToArray(), m_baseDir + honeycombString + ".pov" );
  }

  static SaveToFile(
    honeycombString: string,
    edges: Array<H3CellEdge>,
    finite: boolean,
    append: boolean = false,
  ) {
    H3.SaveToFile(
      honeycombString,
      edges.ToRecord(
        () => {},
        e,
        () => {},
        1,
      ),
      finite,
      append,
    )
  }

  static SaveToFile(
    honeycombString: string,
    edges: Record<H3CellEdge, number>,
    finite: boolean,
    append: boolean = false,
  ) {
    // H3.H3Util.LogMinSize( edges );
    if (m_settings.H3Output == H3Output.STL) {
      H3.MeshH3CellEdges(honeycombString, edges, finite)
    } else {
      PovRay.WriteH3CellEdges(
        new PovRay.Parameters(),
        edges.Keys.ToArray(),
        m_baseDir + (honeycombString + '.pov'),
        append,
      )
    }
  }

  static AppendH3CellFacets(
    honeycombString: string,
    cells: Array<H3.H3Cell>,
  ) {
    PovRay.AppendH3CellFacets(
      cells,
      m_baseDir + (honeycombString + '.pov'),
    )
  }

  static MeshH3CellEdges(
    honeycombString: string,
    edges: Record<H3CellEdge, number>,
    finite: boolean,
  ) {
    let mesh: Shapeways = new Shapeways()
    for (let kvp: KeyValuePair<H3CellEdge, number> in edges) {
      H3Util.AddToMeshInternal(mesh, kvp.Key.Start, kvp.Key.End)
    }

    H3.AddSpheres(mesh, edges)
    mesh.Mesh.Scale(m_settings.Scale)
    // SaveOutH3CellEdges( edges, m_baseDir + honeycombString + ".txt" );
    STL.SaveMeshToSTL(mesh.Mesh, m_baseDir + (honeycombString + '.stl'))
  }

  ///  <summary>
  ///  This method is for honeycombs having Euclidean tilings as cells.
  ///  Since we can't generate the full cells, these are easier to generate as duals to the other honeycombs.
  ///  </summary>
  static #GenDualHoneycombInternal(
    mesh: Shapeways,
    tiling: Tiling,
    honeycomb: EHoneycomb,
  ) {
    let honeycombString: string = Honeycomb.String(honeycomb, true)
    let r: number
    let p: number
    let q: number
    Honeycomb.PQR(honeycomb, /* out */ p, /* out */ q, /* out */ r)
    let inRadius: number = Honeycomb.InRadius(honeycomb)
    let facets: Array<H3CellFacet> = H3.GenH3CellFacetSpheres(
      tiling,
      inRadius,
    )
    let first: H3Cell = new H3Cell(p, facets)
    //  We are already working in the ball model.
    // first = new H3Cell( p, GenH3CellFacets( tiling ) );
    // first.ToSphere();
    // first.ApplyMobius( m_settings.Mobius ); Done in recursive code below.
    //  Recurse.
    let completedH3CellCenters: HashSet<Vector3D> =
      new HashSet<Vector3D>()
    let completedH3CellEdges: Record<H3CellEdge, number> = new Record<
      H3CellEdge,
      number
    >(new H3CellEdgeEqualityComparer())
    //  Values are recursion level, so we can save this out.
    let completedH3CellFacets: HashSet<Sphere> = new HashSet<Sphere>(
      facets.Select(() => {}, f.Sphere),
    )
    let completedH3Cells: Array<H3Cell> = new Array<H3Cell>()
    let starting: Array<H3Cell> = new Array<H3Cell>()
    starting.Add(first)
    completedH3CellCenters.Add(first.Center)
    completedH3Cells.Add(first)
    let level: number = 0
    H3.ReflectRecursiveDual(
      level,
      starting,
      completedH3CellCenters,
      completedH3Cells,
      completedH3CellEdges,
      completedH3CellFacets,
    )
    //  Can't do this on i33!
    // RemoveDanglingH3CellEdgesRecursive( completedH3CellEdges );
    // SaveToFile( honeycombString, completedH3CellEdges, finite: true );
    PovRay.AppendH3CellFacets(
      completedH3CellFacets.ToArray(),
      m_baseDir + (honeycombString + '.pov'),
    )
    // PovRay.AppendH3CellFacets( completedH3Cells.ToArray(), m_baseDir + honeycombString + ".pov" );
  }

  static RemoveDanglingH3CellEdgesRecursive(
    edges: Record<H3CellEdge, number>,
  ) {
    const requiredVertexValence: number = 3
    let needRemoval: Array<H3CellEdge> = new Array<H3CellEdge>()
    //  Info we'll need to remove dangling edges.
    let vertexCounts: Record<Vector3D, number> = new Record<
      Vector3D,
      number
    >()
    for (let edge: H3CellEdge in edges.Keys) {
      H3.CheckAndAdd(vertexCounts, edge.Start)
      H3.CheckAndAdd(vertexCounts, edge.End)
    }

    for (let kvp: KeyValuePair<H3CellEdge, number> in edges) {
      let e: H3CellEdge = kvp.Key
      if (
        vertexCounts[e.Start] < requiredVertexValence ||
        vertexCounts[e.End] < requiredVertexValence
      ) {
        needRemoval.Add(e)
      }
    }

    if (needRemoval.Count > 0) {
      for (let edge: H3CellEdge in needRemoval) {
        edges.Remove(edge)
      }

      H3.RemoveDanglingH3CellEdgesRecursive(edges)
    }
  }

  ///  <summary>
  ///  This will add spheres at incomplete edges.
  ///  </summary>
  static #AddSpheres(
    mesh: Shapeways,
    edges: Record<H3CellEdge, number>,
  ) {
    let vertexCounts: Record<Vector3D, number> = new Record<
      Vector3D,
      number
    >()
    for (let kvp: KeyValuePair<H3CellEdge, number> in edges) {
      // if( !m_levelsToKeep.Contains( kvp.Value ) )
      //     continue;
      let e: H3CellEdge = kvp.Key
      H3.CheckAndAdd(vertexCounts, e.Start)
      H3.CheckAndAdd(vertexCounts, e.End)
    }

    for (let kvp: KeyValuePair<Vector3D, number> in vertexCounts) {
      // if( kvp.Value < 4 ) // XXX - not always this.
      if (m_settings.ThinH3CellEdges) {
        mesh.AddSphere(kvp.Key, H3.SizeFuncConst(new Vector3D()))
      } else {
        let div2: number
        let div1: number
        H3UtilBall.LOD_Finite(
          kvp.Key,
          kvp.Key,
          /* out */ div1,
          /* out */ div2,
          m_settings,
        )
        let sphere: Sphere = H3Util.SphereFunc(kvp.Key)
        H3Sphere.AddSphere(mesh, sphere, div2)
      }
    }
  }

  ///  <summary>
  ///  This will add in all our bananas.
  ///  </summary>
  static #AddBananas(
    mesh: Shapeways,
    edges: Record<H3CellEdge, number>,
  ) {
    for (let kvp: KeyValuePair<H3CellEdge, number> in edges) {
      // if( !m_levelsToKeep.Contains( kvp.Value ) )
      //     continue;
      let e: H3CellEdge = kvp.Key
      // if( CheckRange( e.Start ) &&
      //     CheckRange( e.End ) )
      //     continue;
      if (m_settings.ThinH3CellEdges) {
        let normal: Vector3D
        let center: Vector3D
        let angleTot: number
        let radius: number
        let div: number = 10
        if (m_settings.Halfspace) {
          H3UtilUHS.Geodesic(
            e.Start,
            e.End,
            /* out */ center,
            /* out */ radius,
            /* out */ normal,
            /* out */ angleTot,
          )
        } else {
          H3UtilBall.Geodesic(
            e.Start,
            e.End,
            /* out */ center,
            /* out */ radius,
            /* out */ normal,
            /* out */ angleTot,
          )
          H3UtilBall.LODThin(e.Start, e.End, /* out */ div)
        }

        // mesh.AddArc( center, radius, e.Start, normal, angleTot, div, SizeFuncConst );
        H3.H3Util.AddToMeshInternal(mesh, e.Start, e.End)
      } else {
        Banana.AddBanana(mesh, e.Start, e.End, m_settings)
      }
    }
  }

  static #CheckAndAdd(
    vertexCounts: Record<Vector3D, number>,
    v: Vector3D,
  ) {
    let count: number
    if (vertexCounts.TryGetValue(v, /* out */ count)) {
      count++
    } else {
      count = 1
    }

    vertexCounts[v] = count
  }

  static #SaveOutH3CellEdges(
    edges: Record<H3CellEdge, number>,
    fileName: string,
  ) {
    let sw: StreamWriter = File.CreateText(fileName)
    for (let kvp: KeyValuePair<H3CellEdge, number> in edges) {
      kvp.Key.Write(sw, kvp.Value)
    }
  }

  ///  <summary>
  ///  This method works for honeycombs having cells with a finite number of facets.
  ///  The cell vertices may be ideal or finite.
  ///  Calculations are carried out in the ball model.
  ///  </summary>
  static #ReflectRecursive(
    level: number,
    cells: Array<H3Cell>,
    completedH3CellCenters: HashSet<Vector3D>,
    completedH3CellEdges: Record<H3CellEdge, number>,
    completedH3Cells: Array<H3Cell>,
    facets: HashSet<Sphere>,
  ) {
    //  Breadth first recursion.
    if (0 == cells.Count) {
      return
    }

    if (level > 4) {
      return
    }

    level++
    let reflected: Array<H3Cell> = new Array<H3Cell>()
    for (let cell: H3Cell in cells) {
      let idealVerts: boolean = cell.IdealVerts
      let facetSpheres: Array<Sphere> = new Array<Sphere>()
      for (let facet: H3CellFacet in cell.H3CellFacets) {
        if (facet.Sphere != null) {
          facetSpheres.Add(facet.Sphere)
        } else if (idealVerts) {
          facetSpheres.Add(
            H3UtilBall.OrthogonalSphere(
              facet.Verts[0],
              facet.Verts[1],
              facet.Verts[2],
            ),
          )
        } else {
          facetSpheres.Add(
            H3UtilBall.OrthogonalSphereInterior(
              facet.Verts[0],
              facet.Verts[1],
              facet.Verts[2],
            ),
          )
        }
      }

      for (let facetSphere: Sphere in facetSpheres) {
        if (completedH3CellCenters.Count > m_settings.MaxH3Cells) {
          return
        }

        let newH3Cell: H3Cell = cell.Clone()
        newH3Cell.Reflect(facetSphere)
        if (
          completedH3CellCenters.Contains(newH3Cell.ID) ||
          !H3.H3CellOk(newH3Cell)
        ) {
          continue
        }

        H3Util.AddH3CellEdges(newH3Cell, level, completedH3CellEdges)
        reflected.Add(newH3Cell)
        completedH3CellCenters.Add(newH3Cell.ID)
        completedH3Cells.Add(newH3Cell)
        for (let facet: H3CellFacet in newH3CellFacets) {
          facets.Add(facet.Sphere)
        }
      }
    }

    H3.ReflectRecursive(
      level,
      reflected,
      completedH3CellCenters,
      completedH3CellEdges,
      completedH3Cells,
      facets,
    )
  }

  static #H3CellOk(cell: H3Cell): boolean {
    return true
    let idealVerts: boolean = cell.IdealVerts
    //  ZZZ - maybe criterion should be total perimeter?
    for (let facet: H3CellFacet in cell.H3CellFacets) {
      for (let i: number = 0; i < cell.P; i++) {
        let i1: number = i
        let i2: number = i == cell.P - 1 ? 0 : i + 1
        let v1: Vector3D = facet.Verts[i1]
        let v2: Vector3D = facet.Verts[i2]
        //  Handle the cutoff differently when we are in the ball model,
        //  and the cell vertices are finite.
        if (!m_settings.Halfspace && !idealVerts) {
          let cutoff: number = m_settings.Ball_Cutoff
          if (v1.Abs() > cutoff || v2.Abs() > cutoff) {
            return false
          }
        } else if (m_settings.Halfspace) {
          v1 = H3UtilBallToUHS(v1)
          v2 = H3UtilBallToUHS(v2)
          if (
            ((v1.Z > m_settings.UHS_Horocycle &&
              v2.Z < m_settings.UHS_Horocycle) ||
              (v2.Z > m_settings.UHS_Horocycle &&
                v1.Z < m_settings.UHS_Horocycle)) &&
            v1.Abs() < m_settings.UHS_MaxBounds &&
            v2.Abs() < m_settings.UHS_MaxBounds
          ) {
            return true
          }
        } else {
          let dist: number = v1.Dist(v2)
          if (
            dist < m_settings.Ball_MinLength ||
            dist > m_settings.Ball_MaxLength
          ) {
            return false
          }
        }
      }
    }

    return true
    // return false;    // for some UHS stuff, we reverse this.
  }

  ///  <summary>
  ///  This is to generate tilings with infinite faceted cells (dual to the input cells).
  ///  It works natively in the Ball model.
  ///  </summary>c
  static #ReflectRecursiveDual(
    level: number,
    cells: Array<H3Cell>,
    completedH3CellCenters: HashSet<Vector3D>,
    completedH3Cells: Array<H3Cell>,
    completedH3CellEdges: Record<H3CellEdge, number>,
    facets: HashSet<Sphere>,
  ) {
    //  Breadth first recursion.
    if (0 == cells.Count) {
      return
    }

    level++
    let reflected: Array<H3Cell> = new Array<H3Cell>()
    for (let cell: H3Cell in cells) {
      let facetSpheres: Array<Sphere> = new Array<Sphere>()
      for (let facet: H3CellFacet in cell.H3CellFacets) {
        facetSpheres.Add(facet.Sphere)
        // facetSpheres.Add( H3UtilBall.OrthogonalSphere( facet.Verts[0], facet.Verts[1], facet.Verts[2] ) );
      }

      for (let facetSphere: Sphere in facetSpheres) {
        if (completedH3CellCenters.Count > m_settings.MaxH3Cells) {
          return
        }

        let newH3Cell: H3Cell = cell.Clone()
        newH3Cell.Reflect(facetSphere)
        let start: Vector3D = H3UtilBall.ApplyMobius(
          m_settings.Mobius,
          cell.Center,
        )
        let end: Vector3D = H3UtilBall.ApplyMobius(
          m_settings.Mobius,
          newH3Cell.Center,
        )
        let edge: H3CellEdge = new H3CellEdge(start, end)
        if (completedH3CellEdges.ContainsKey(edge)) {
          continue
        }

        //  This check was making things not work.
        // if( completedH3CellCenters.Contains( newH3Cell.Center ) )
        //     continue;
        if (!H3.H3CellEdgeOk(edge)) {
          continue
        }

        reflected.Add(newH3Cell)
        completedH3Cells.Add(newH3Cell)
        completedH3CellCenters.Add(newH3Cell.Center)
        completedH3CellEdges.Add(edge, level)
        for (let facet: H3CellFacet in newH3CellFacets) {
          facets.Add(facet.Sphere)
        }
      }
    }

    H3.ReflectRecursiveDual(
      level,
      reflected,
      completedH3CellCenters,
      completedH3Cells,
      completedH3CellEdges,
      facets,
    )
  }

  static #H3CellEdgeOk(edge: H3CellEdge): boolean {
    let minH3CellEdgeLength: number = m_settings.UHS_MinH3CellEdgeLength
    let maxBounds: number = m_settings.UHS_MaxBounds
    if (m_settings.Halfspace) {
      let start: Vector3D = H3UtilBallToUHS(edge.Start)
      let end: Vector3D = H3UtilBallToUHS(edge.End)
      if (start.Dist(end) < minH3CellEdgeLength) {
        return false
      }

      if (start.Abs() > maxBounds || end.Abs() > maxBounds) {
        return false
      }

      return true
    } else {
      // return edge.Start.Dist( edge.End ) > minH3CellEdgeLength*.5;
      //  Calculated by size testing.  This is the point where the thickness will be .025 inches, assuming we'll scale the ball by a factor of 2.
      //  This pushes the limits of Shapeways.
      // double thresh = 0.93;    // {6,3,3}
      // double thresh = 0.972;    // {7,3,3}
      // double thresh = 0.94;
      // double thresh = 0.984;
      // thresh = 0.9975;    // XXX - put in settings.
      let thresh: number = 0.999
      return edge.Start.Abs() < thresh && edge.End.Abs() < thresh
    }
  }

  static SizeFuncConst(v: Vector3D): number {
    return H3Models.SizeFuncConst(v, m_settings.Scale)
  }
}

///  <summary>
///  We can track a cell by its ideal vertices.
///  We'll work with these in the plane.
///  </summary>
export class H3Cell {
  // constructor (facets: H3CellFacet[]) :
  //         this(-1, facets) {

  // }

  constructor(p: number, facets: Array<H3CellFacet>) {
    P = p
    H3CellFacets = facets
    Depths = new Array(4)
  }

  P: number

  //  Number of edges in polygon
  H3CellFacets: Array<H3CellFacet>

  Center: Vector3D

  //  Not necessary.
  Mesh: Mesh

  ///  <summary>
  ///  Used to track recursing depth of reflections across various mirrors.
  ///  </summary>
  Depths: Array<number>

  LastReflection: number = -1

  get IdealVerts(): boolean {
    if (this.Verts.Count() == 0) {
      return false
    }

    return Tolerance.Equal(this.Verts.First().MagSquared(), 1)
  }

  AppendAllH3CellEdges(edges: HashSet<H3CellEdge>) {
    for (let f: H3CellFacet in this.H3CellFacets) {
      f.AppendAllH3CellEdges(edges)
    }
  }

  ///  <summary>
  ///  In Ball model.
  ///  </summary>
  CalcCenterFromH3CellFacets() {
    let center: Vector3D = new Vector3D()
    for (let s: Sphere in this.H3CellFacets.Select(() => {},
    f.Sphere)) {
      if (s.IsPlane) {
        continue
      }

      let sCenter: Vector3D = s.Center
      let abs: number = s.Center.Abs()
      sCenter.Normalize()
      sCenter = sCenter * (abs - s.Radius)
      center = center + sCenter
    }

    this.H3CellFacets.Length
    this.Center = center
  }

  get HasVerts(): boolean {
    for (let f: H3CellFacet in this.H3CellFacets) {
      if (f.Verts == null) {
        return false
      }
    }

    return true
  }

  get Verts(): IEnumerable<Vector3D> {
    for (let facet: H3CellFacet in this.H3CellFacets) {
      if (facet.Verts != null) {
        for (let v: Vector3D in facet.Verts) {
          yield
        }
      }

      return v
    }
  }

  ///  <summary>
  ///  Additional points (could be whatever) that we want reflected around with this cell.
  ///  </summary>
  get AuxPoints(): Array<Vector3D> {}

  set AuxPoints(value: Array<Vector3D>) {}

  get ID(): Vector3D {
    let result: Vector3D = new Vector3D()
    // foreach( Vector3D v in Verts )
    // result += Sterographic.PlaneToSphereSafe( v );    // XXX - what about when not working in plane.
    if (this.HasVerts) {
      for (let v: Vector3D in this.Verts) {
        result = result + v
      }
    } else {
      //  Intentionally just use the center.
    }

    result = result + this.Center
    return result
  }

  Clone(): H3Cell {
    let newH3CellFacets: Array<H3CellFacet> = new Array<H3CellFacet>()
    for (let facet: H3CellFacet in this.H3CellFacets) {
      newH3CellFacets.Add(facet.Clone())
    }

    let clone: H3Cell = new H3Cell(this.P, newH3CellFacets.ToArray())
    clone.Center = this.Center
    clone.Depths = this.Depths.Clone()
    clone.LastReflection = this.LastReflection
    if (this.AuxPoints != null) {
      clone.AuxPoints = this.AuxPoints.Clone() as Array<Vector3D>
    }

    if (this.Mesh != null) {
      clone.Mesh = this.Mesh.Clone()
    }

    return clone
  }

  ///  <summary>
  ///  Moves our vertices from the plane to the sphere.
  ///  </summary>
  ToSphere() {
    for (let facet: H3CellFacet in this.H3CellFacets) {
      for (let i: number = 0; i < this.P; i++) {
        facet.Verts[i] = Sterographic.PlaneToSphereSafe(facet.Verts[i])
      }
    }
  }

  ///  <summary>
  ///  Scales cell to circumsphere.
  ///  NOTE: We should already be on a sphere, not the plane.
  ///  </summary>
  ScaleToCircumSphere(r: number) {
    for (let facet: H3CellFacet in this.H3CellFacets) {
      for (let i: number = 0; i < this.P; i++) {
        let axis: Vector3D = facet.Verts[i]
        axis.Normalize()
        facet.Verts[i] = axis * r
      }
    }
  }

  ///  <summary>
  ///  Apply a Mobius transformation to us (meaning of Mobius transform is on boundary of UHS model).
  ///  </summary>
  ApplyMobius(m: Mobius) {
    for (let facet: H3CellFacet in this.H3CellFacets) {
      for (let i: number = 0; i < this.P; i++) {
        facet.Verts[i] = H3UtilBall.ApplyMobius(m, facet.Verts[i])
      }
    }

    this.Center = H3UtilBall.ApplyMobius(m, this.Center)
  }

  Reflect(sphere: Sphere) {
    for (let facet: H3CellFacet in this.H3CellFacets) {
      facet.Reflect(sphere)
    }

    this.Center = sphere.ReflectPoint(this.Center)
    if (this.AuxPoints != null) {
      for (let i: number = 0; i < this.AuxPoints.Length; i++) {
        this.AuxPoints[i] = sphere.ReflectPoint(this.AuxPoints[i])
      }
    }

    if (this.Mesh != null) {
      let reflectedInPlace: boolean = false
      for (let i: number = 0; i < this.Mesh.Triangles.Count; i++) {
        let tri: Mesh.Triangle = this.Mesh.Triangles[i]
        let c: Vector3D = tri.c
        let a: Vector3D = tri.a
        let b: Vector3D = tri.b
        tri.a = sphere.ReflectPoint(tri.a)
        tri.b = sphere.ReflectPoint(tri.b)
        tri.c = sphere.ReflectPoint(tri.c)
        //  Keep orientations consistent.
        // if( !( a == tri.a && b == tri.b && c == tri.c ) )
        tri.ChangeOrientation()
        if (a == tri.a && b == tri.b && c == tri.c) {
          reflectedInPlace = true
        }

        this.Mesh.Triangles[i] = tri
      }

      // if( reflectedInPlace )
      //     Depths[0]--;
    }
  }
}

export class H3CellEdge {
  constructor(v1: Vector3D, v2: Vector3D, order: boolean = true) {
    //  Keep things "ordered", so we can easily compare edges.
    if (order) {
      let orderedVerts: Array<Vector3D> = [v1, v2]
      orderedVerts = orderedVerts
        .OrderBy(() => {}, v, new Vector3DComparer())
        .ToArray()
      Start = orderedVerts[0]
      End = orderedVerts[1]
    } else {
      Start = v1
      End = v2
    }

    Depths = new Array(4)
  }

  Start: Vector3D

  End: Vector3D

  //  The reason we use a vector here is so the components
  //  can be interpreted in different color schemes (HLS, RGB, etc.)
  Color: Vector3D = new Vector3D(1, 1, 1)

  ///  <summary>
  ///  Used to track recursing depth of reflections across various mirrors.
  ///  </summary>
  Depths: Array<number>

  Clone(): H3CellEdge {
    return MemberwiseClone()
  }

  get ID(): Vector3D {
    return this.Start + this.End
  }

  Opp(v: Vector3D): Vector3D {
    return v == Start ? End : Start
  }

  Write(sw: StreamWriter, level: number) {
    sw.WriteLine(
      string.Format(
        '{0},{1},{2}',
        level,
        this.Start.ToStringXYZOnly(),
        this.End.ToStringXYZOnly(),
      ),
    )
  }

  CopyDepthsFrom(e: H3CellEdge) {
    this.Depths = e.Depths.Clone()
  }
}

export class H3CellEdgeEqualityComparer extends IEqualityComparer<H3CellEdge> {
  Equals(e1: H3CellEdge, e2: H3CellEdge): boolean {
    return (
      e1.Start.Compare(e2.Start, m_tolerance) &&
      e1.End.Compare(e2.End, m_tolerance)
    )
  }

  GetHashCode(e: H3CellEdge): number {
    return e.Start.GetHashCode() | e.End.GetHashCode()
    // The operator should be an XOR ^ instead of an OR, but not available in CodeDOM
  }

  #m_tolerance: number = 0.0001
}
