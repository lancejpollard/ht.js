import { DonHatch } from '@Math/DonHatch'
import { Mobius } from '@Math/Mobius'
import assert from 'assert'
import { Geometry } from './Geometry'
import { Metric } from './Metric'
import { Spherical2D } from './Spherical2D'
import { Vector3D } from './Vector3D'

type FindNearestNeighborRecursivePassthroughType = {
  closest?: NearTreeObject
  searchRadius: number
}

export class NearTree {
  // this.Reset(Metric.Euclidean)

  constructor(m: Metric) {
    this.Metric = m

    this.m_maxLeft = Number.MIN_SAFE_INTEGER
    this.m_maxRight = Number.MIN_SAFE_INTEGER

    this.Reset(m)
  }

  static GtoM(g: Geometry): Metric {
    switch (g) {
      case Geometry.Spherical:
        return Metric.Spherical
      case Geometry.Euclidean:
        return Metric.Euclidean
      case Geometry.Hyperbolic:
        return Metric.Hyperbolic
      default:
        break
    }

    return Metric.Euclidean
  }

  Reset(m: Metric) {
    this.Metric = m
    this.m_pRightBranch = undefined
    this.m_pLeftBranch = undefined
    this.m_pRight = undefined
    this.m_pLeft = undefined
    this.m_maxLeft = Number.MIN_SAFE_INTEGER
    this.m_maxRight = Number.MIN_SAFE_INTEGER
  }

  // The distance metric to use.

  Metric: Metric

  //  Left/right objects stored in this node.
  m_pLeft?: NearTreeObject

  m_pRight?: NearTreeObject

  //  Longest distance from the left/right
  //  objects to anything below it in the tree.
  m_maxLeft: number

  m_maxRight: number

  //  Tree descending from the left/right.
  m_pLeftBranch?: NearTree

  m_pRightBranch?: NearTree

  // Inserts an object into the neartree.

  InsertObject(nearTreeObject: NearTreeObject) {
    let tempRight: number = 0
    let tempLeft: number = 0

    if (this.m_pRight != null) {
      tempRight = this.Dist(
        nearTreeObject.Location,
        this.m_pRight.Location,
      )
      tempLeft = this.Dist(
        nearTreeObject.Location,
        this.m_pLeft?.Location,
      )
    }

    if (this.m_pLeft == null) {
      this.m_pLeft = nearTreeObject
    } else if (this.m_pRight == null) {
      this.m_pRight = nearTreeObject
    } else if (tempLeft > tempRight) {
      if (this.m_pRightBranch == null) {
        this.m_pRightBranch = new NearTree(this.Metric)
      }

      //  Note: that the next line assumes that m_maxRight
      //  is negative for a new node.
      if (this.m_maxRight < tempRight) {
        this.m_maxRight = tempRight
      }

      this.m_pRightBranch.InsertObject(nearTreeObject)
    } else {
      if (this.m_pLeftBranch == null) {
        this.m_pLeftBranch = new NearTree(this.Metric)
      }

      //  Note: that the next line assumes that m_maxLeft
      //  is negative for a new node.
      if (this.m_maxLeft < tempLeft) {
        this.m_maxLeft = tempLeft
      }

      this.m_pLeftBranch.InsertObject(nearTreeObject)
    }
  }

  // Finds the nearest neighbor to a location, and
  // withing a specified search radius (returns false if none found).

  FindNearestNeighbor(location: Vector3D): boolean {
    return this.FindNearestNeighborRecursive(location)
  }

  // Finds all the objects withing a certain radius of some location (returns false if none found).

  FindCloseObjects(
    closeObjects: Array<NearTreeObject>,
    location: Vector3D,
    searchRadius: number,
  ): boolean {
    let found: boolean =
      0 !=
      this.FindCloseObjectsRecursive(
        closeObjects,
        location,
        searchRadius,
      )
    return found
  }

  FindNearestNeighborRecursive(
    location: Vector3D,
    passthrough: FindNearestNeighborRecursivePassthroughType = {
      closest: undefined,
      searchRadius: 0,
    },
  ): boolean {
    let tempRadius: number = 0
    let bRet: boolean = false

    //  First test each of the left and right positions to see
    //  if one holds a point nearer than the nearest so far.
    if (this.m_pLeft != null) {
      tempRadius = this.Dist(location, this.m_pLeft.Location)
      if (
        !passthrough.searchRadius ||
        tempRadius <= passthrough.searchRadius
      ) {
        passthrough.searchRadius = tempRadius
        passthrough.closest = this.m_pLeft
        bRet = true
      }
    }

    if (this.m_pRight != null) {
      tempRadius = this.Dist(location, this.m_pRight.Location)
      if (
        !passthrough.searchRadius ||
        tempRadius <= passthrough.searchRadius
      ) {
        passthrough.searchRadius = tempRadius
        passthrough.closest = this.m_pRight
        bRet = true
      }
    }

    //  Now we test to see if the branches below might hold an
    //  object nearer than the best so far found. The triangle
    //  rule is used to test whether it's even necessary to descend.
    if (this.m_pLeftBranch != null) {
      if (
        passthrough.searchRadius + this.m_maxLeft >=
        this.Dist(location, this.m_pLeft?.Location)
      ) {
        bRet ||= this.m_pLeftBranch.FindNearestNeighborRecursive(
          location,
          passthrough,
        )
      }
    }

    if (this.m_pRightBranch != null) {
      if (
        passthrough.searchRadius + this.m_maxRight >=
        this.Dist(location, this.m_pRight?.Location)
      ) {
        bRet ||= this.m_pRightBranch.FindNearestNeighborRecursive(
          location,
          passthrough,
        )
      }
    }

    return bRet
  }

  FindCloseObjectsRecursive(
    closeObjects: Array<NearTreeObject>,
    location: Vector3D,
    searchRadius: number,
  ): number {
    let lReturn: number = 0
    //  First test each of the left and right positions to see
    //  if one holds a point nearer than the search radius.
    if (
      this.m_pLeft != null &&
      this.Dist(location, this.m_pLeft.Location) <= searchRadius
    ) {
      closeObjects.push(this.m_pLeft)
      lReturn++
    }

    if (
      this.m_pRight != null &&
      this.Dist(location, this.m_pRight.Location) <= searchRadius
    ) {
      closeObjects.push(this.m_pRight)
      lReturn++
    }

    //
    //  Now we test to see if the branches below might hold an
    //  object nearer than the search radius. The triangle rule
    //  is used to test whether it's even necessary to descend.
    //
    if (
      this.m_pLeftBranch != null &&
      searchRadius + this.m_maxLeft >=
        this.Dist(location, this.m_pLeft?.Location)
    ) {
      lReturn += this.m_pLeftBranch.FindCloseObjectsRecursive(
        closeObjects,
        location,
        searchRadius,
      )
    }

    if (
      this.m_pRightBranch != null &&
      searchRadius + this.m_maxRight >=
        this.Dist(location, this.m_pRight?.Location)
    ) {
      lReturn += this.m_pRightBranch.FindCloseObjectsRecursive(
        closeObjects,
        location,
        searchRadius,
      )
    }

    return lReturn
  }

  //  Gets the distance between two points.
  Dist(p1: Vector3D, p2: Vector3D = Vector3D.construct()): number {
    switch (this.Metric) {
      case Metric.Spherical: {
        //  ZZZ - Is it too expensive to build up a mobius every time?
        //          I wonder if there is a better way.
        let m: Mobius = Mobius.construct()
        m.Isometry(Geometry.Spherical, 0, p1.Negate().ToComplex())
        let temp: Vector3D = m.ApplyVector3D(p2)
        return Spherical2D.e2sNorm(temp.Abs())
      }
      case Metric.Euclidean: {
        return p2.Subtract(p1).Abs()
      }
      case Metric.Hyperbolic: {
        //  ZZZ - Is it too expensive to build up a mobius every time?
        //          I wonder if there is a better way.
        let m: Mobius = Mobius.construct()
        m.Isometry(Geometry.Hyperbolic, 0, p1.Negate().ToComplex())
        let temp: Vector3D = m.ApplyVector3D(p2)
        return DonHatch.e2hNorm(temp.Abs())
      }
      default:
        throw new Error('Not implemented')
    }
  }
}

export class NearTreeObject {
  get ID(): Object {}

  set ID(value: Object) {}

  get Location(): Vector3D {}

  set Location(value: Vector3D) {}
}
