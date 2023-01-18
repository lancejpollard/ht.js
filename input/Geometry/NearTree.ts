import R3.Math;
import System.Collections.Generic;

module R3.Geometry {

    export enum Metric {

        Spherical,

        Euclidean,

        Hyperbolic,
    }

    export class NearTreeObject {

        public get ID(): Object {
        }
        public set ID(value: Object)  {
        }

        public get Location(): Vector3D {
        }
        public set Location(value: Vector3D)  {
        }
    }

    export class NearTree {

        public constructor () {
            this.Reset(Metric.Euclidean);
        }

        public constructor (m: Metric) {
            this.Reset(m);
        }

        public static GtoM(g: Geometry): Metric {
            switch (g) {
                case Geometry.Spherical:
                    return Metric.Spherical;
                    break;
                case Geometry.Euclidean:
                    return Metric.Euclidean;
                    break;
                case Geometry.Hyperbolic:
                    return Metric.Hyperbolic;
                    break;
            }

            return Metric.Euclidean;
        }

        public Reset(m: Metric) {
            this.Metric = m;
            m_pRightBranch = null;
            m_pLeftBranch = null;
            m_pRight = null;
            m_pLeft = null;
            m_maxLeft = double.MinValue;
            m_maxRight = double.MinValue;
        }

        ///  <summary>
        ///  The distance metric to use.
        ///  </summary>
        public get Metric(): Metric {
        }
        public set Metric(value: Metric)  {
        }

        //  Left/right objects stored in this node.
        private m_pLeft: NearTreeObject;

        private m_pRight: NearTreeObject;

        //  Longest distance from the left/right
        //  objects to anything below it in the tree.
        private m_maxLeft: number;

        private m_maxRight: number;

        //  Tree descending from the left/right.
        private m_pLeftBranch: NearTree;

        private m_pRightBranch: NearTree;

        ///  <summary>
        ///  Inserts an object into the neartree.
        ///  </summary>
        public InsertObject(nearTreeObject: NearTreeObject) {
            let tempRight: number = 0;
            let tempLeft: number = 0;
            if ((this.m_pRight != null)) {
                tempRight = this.Dist(nearTreeObject.Location, this.m_pRight.Location);
                tempLeft = this.Dist(nearTreeObject.Location, this.m_pLeft.Location);
            }

            if ((this.m_pLeft == null)) {
                this.m_pLeft = nearTreeObject;
            }
            else if ((this.m_pRight == null)) {
                this.m_pRight = nearTreeObject;
            }
            else if ((tempLeft > tempRight)) {
                if ((this.m_pRightBranch == null)) {
                    this.m_pRightBranch = new NearTree(this.Metric);
                }

                //  Note: that the next line assumes that m_maxRight
                //  is negative for a new node.
                if ((this.m_maxRight < tempRight)) {
                    this.m_maxRight = tempRight;
                }

                this.m_pRightBranch.InsertObject(nearTreeObject);
            }
            else {
                if ((this.m_pLeftBranch == null)) {
                    this.m_pLeftBranch = new NearTree(this.Metric);
                }

                //  Note: that the next line assumes that m_maxLeft
                //  is negative for a new node.
                if ((this.m_maxLeft < tempLeft)) {
                    this.m_maxLeft = tempLeft;
                }

                this.m_pLeftBranch.InsertObject(nearTreeObject);
            }

        }

        ///  <summary>
        ///  Finds the nearest neighbor to a location, and
        ///  withing a specified search radius (returns false if none found).
        ///  </summary>
        public FindNearestNeighbor(/* out */closest: NearTreeObject, location: Vector3D, searchRadius: number): boolean {
            closest = null;
            return this.FindNearestNeighborRecursive(/* ref */closest, location, /* ref */searchRadius);
        }

        ///  <summary>
        ///  Finds all the objects withing a certain radius of some location (returns false if none found).
        ///  </summary>
        public FindCloseObjects(/* out */closeObjects: NearTreeObject[], location: Vector3D, searchRadius: number): boolean {
            let result: List<NearTreeObject> = new List<NearTreeObject>();
            let found: boolean = (0 != this.FindCloseObjectsRecursive(/* ref */result, location, searchRadius));
            closeObjects = result.ToArray();
            return found;
        }

        private FindNearestNeighborRecursive(/* ref */closest: NearTreeObject, location: Vector3D, /* ref */searchRadius: number): boolean {
            let tempRadius: number = 0;
            let bRet: boolean = false;
            //  First test each of the left and right positions to see
            //  if one holds a point nearer than the nearest so far.
            if ((this.m_pLeft != null)) {
                tempRadius = this.Dist(location, this.m_pLeft.Location);
                if ((tempRadius <= searchRadius)) {
                    searchRadius = tempRadius;
                    closest = this.m_pLeft;
                    bRet = true;
                }

            }

            if ((this.m_pRight != null)) {
                tempRadius = this.Dist(location, this.m_pRight.Location);
                if ((tempRadius <= searchRadius)) {
                    searchRadius = tempRadius;
                    closest = this.m_pRight;
                    bRet = true;
                }

            }

            //  Now we test to see if the branches below might hold an
            //  object nearer than the best so far found. The triangle
            //  rule is used to test whether it's even necessary to descend.
            if ((this.m_pLeftBranch != null)) {
                if (((searchRadius + this.m_maxLeft)
                            >= this.Dist(location, this.m_pLeft.Location))) {
                    bRet = (bRet | this.m_pLeftBranch.FindNearestNeighborRecursive(/* ref */closest, location, /* ref */searchRadius));
                }

            }

            if ((this.m_pRightBranch != null)) {
                if (((searchRadius + this.m_maxRight)
                            >= this.Dist(location, this.m_pRight.Location))) {
                    bRet = (bRet | this.m_pRightBranch.FindNearestNeighborRecursive(/* ref */closest, location, /* ref */searchRadius));
                }

            }

            return bRet;
        }

        private FindCloseObjectsRecursive(/* ref */closeObjects: List<NearTreeObject>, location: Vector3D, searchRadius: number): number {
            let lReturn: number = 0;
            //  First test each of the left and right positions to see
            //  if one holds a point nearer than the search radius.
            if (((this.m_pLeft != null)
                        && (this.Dist(location, this.m_pLeft.Location) <= searchRadius))) {
                closeObjects.Add(this.m_pLeft);
                lReturn++;
            }

            if (((this.m_pRight != null)
                        && (this.Dist(location, this.m_pRight.Location) <= searchRadius))) {
                closeObjects.Add(this.m_pRight);
                lReturn++;
            }

            //
            //  Now we test to see if the branches below might hold an
            //  object nearer than the search radius. The triangle rule
            //  is used to test whether it's even necessary to descend.
            //
            if (((this.m_pLeftBranch != null)
                        && ((searchRadius + this.m_maxLeft)
                        >= this.Dist(location, this.m_pLeft.Location)))) {
                lReturn = (lReturn + this.m_pLeftBranch.FindCloseObjectsRecursive(/* ref */closeObjects, location, searchRadius));
            }

            if (((this.m_pRightBranch != null)
                        && ((searchRadius + this.m_maxRight)
                        >= this.Dist(location, this.m_pRight.Location)))) {
                lReturn = (lReturn + this.m_pRightBranch.FindCloseObjectsRecursive(/* ref */closeObjects, location, searchRadius));
            }

            return lReturn;
        }

        //  Gets the distance between two points.
        private Dist(p1: Vector3D, p2: Vector3D): number {
            switch (this.Metric) {
                case this.Metric.Spherical:
                    //  ZZZ - Is it too expensive to build up a mobius every time?
                    //          I wonder if there is a better way.
                    let m: Mobius = new Mobius();
                    m.Isometry(Geometry.Spherical, 0, (p1 * -1));
                    let temp: Vector3D = m.Apply(p2);
                    return Spherical2D.e2sNorm(temp.Abs());
                    break;
                case this.Metric.Euclidean:
                    return ((p2 - p1)).Abs();
                    break;
                case this.Metric.Hyperbolic:
                    //  ZZZ - Is it too expensive to build up a mobius every time?
                    //          I wonder if there is a better way.
                    let m: Mobius = new Mobius();
                    m.Isometry(Geometry.Hyperbolic, 0, (p1 * -1));
                    let temp: Vector3D = m.Apply(p2);
                    return DonHatch.e2hNorm(temp.Abs());
                    break;
            }

            throw new Error('Not implemented');
        }
    }
}
