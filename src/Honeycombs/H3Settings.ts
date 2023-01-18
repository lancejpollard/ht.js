///  <summary>
///  A class to play around with H3 honecombs
///  Except for the H3Cell class, this is mostly old, but it is what I used to generate STL models for Shapeways.

import { Polytope } from '@Geometry/Polytope'
import { Mobius } from '@Math/Mobius'

///  </summary>
export class H3Settings {
  Scale: number = 50

  //  10cm ball by default.
  Halfspace: boolean = false

  MaxH3Cells: number = 150000

  //  Ball Model
  Ball_MaxLength: number = 3

  // double Ball_MinLength = 0.075;
  Ball_MinLength: number = 0.15

  // double Ball_MinLength = 0.05;
  // static #double Ball_MinLength = 0.45;    // lamp
  Ball_Cutoff: number = 0.95

  //  UHS
  // double UHS_MinH3CellEdgeLength = .09;
  // double UHS_MaxBounds = 6.5;
  UHS_MinH3CellEdgeLength: number = 0.03

  UHS_MaxBounds: number = 2

  UHS_Horocycle: number = 0.25

  //  Bananas
  ThinH3CellEdges: boolean = false

  AngularThickness: number = 0.06

  //  an angle (the slope of the banana)
  // double AngularThickness = 0.04;
  // double AngularThickness = 0.25;
  //  Position and associated Mobius to apply
  Position: Polytope.Projection = Polytope.Projection.H3CellCentered

  Mobius: Mobius = Mobius.Identity()

  H3Output: H3Output = H3Output.POVRay
}
