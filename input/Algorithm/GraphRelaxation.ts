import Math = System.Math;
import System.Collections.Generic;
import System.Diagnostics;
import System.Linq;
import R3.Core;
import R3.Geometry;
import R3.Math;

module R3.Algorithm {

    export class GraphNode {

        public constructor (pos: VectorND, vel: VectorND) {
            Position = pos;
            Velocity = vel;
            Lock = new VectorND(pos.Dimension);
            //  No locking.
        }

        public get Position(): VectorND {
        }
        public set Position(value: VectorND)  {
        }

        public get Velocity(): VectorND {
        }
        public set Velocity(value: VectorND)  {
        }

        ///  <summary>
        ///  Used to control how the node will move during relaxation.
        ///  To lock a coordinate, set that coordinate to a positive number.
        ///  </summary>
        public get Lock(): VectorND {
        }
        public set Lock(value: VectorND)  {
        }

        public FullLock() {
            for (let i: number = 0; (i < this.Lock.Dimension); i++) {
                this.Lock.X[i] = 1;
            }

        }
    }

    export class Graph {

        public constructor () {
            Nodes = new List<GraphNode>();
            Edges = new List<GraphEdge>();
            m_connections = new Record<number, List<number>>();
        }

        public get Nodes(): List<GraphNode> {
        }
        public set Nodes(value: List<GraphNode>)  {
        }

        public get Edges(): List<GraphEdge> {
        }
        public set Edges(value: List<GraphEdge>)  {
        }

        public static FromMesh(mesh: Mesh): Graph {
            throw new Error('Not implemented');
        }

        public ToMesh(): Mesh {
            throw new Error('Not implemented');
        }

        ///  <summary>
        ///  Setup a complete graph with n nodes.
        ///  Positions are randomly distributed.
        ///  </summary>
        public SetupCompleteGraph(n: number) {
            this.Nodes.Clear();
            this.Edges.Clear();
            let southPole: GraphNode = new GraphNode(new VectorND([
                            0,
                            0,
                            0,
                            -1]), new VectorND(4));
            southPole.FullLock();
            this.Nodes.Add(southPole);
            let rand: System.Random = new System.Random(0);
            for (let i: number = 1; (i < n); i++) {
                let randPosition: VectorND = new VectorND([
                            (rand.NextDouble() - 0.5),
                            (rand.NextDouble() - 0.5),
                            (rand.NextDouble() - 0.5),
                            (rand.NextDouble() - 0.5)]);
                randPosition.Normalize();
                this.Nodes.Add(new GraphNode(randPosition, new VectorND(4)));
            }

            for (let i: number = 0; (i < n); i++) {
                for (let j: number = (i + 1); (j < n); j++) {
                    this.AddEdge(new GraphEdge(i, j));
                }

            }

        }

        public AddEdge(e: GraphEdge) {
            let vals: List<number>;
            if (m_connections.TryGetValue(e.V1, /* out */vals)) {
                if (!vals.Contains(e.V2)) {
                    vals.Add(e.V2);
                }

            }
            else {
                m_connections[e.V1] = new List<number>([
                            e.V2]);
            }

            this.Edges.Add(e);
        }

        public m_connections: Record<number, List<number>>;

        ///  <summary>
        ///  ZZZ - slow impl.  Should calc this once and cache.
        ///  </summary>>
        public Connected(n1: number, n2: number): boolean {
            // return Edges.Any( e => ( e.V1 == n1 && e.V2 == n2 ) || ( e.V2 == n1 && e.V1 == n2 ) );
            let vals: List<number>;
            if ((this.m_connections.TryGetValue(n1, /* out */vals) && vals.Contains(n2))) {
                return true;
            }

            if ((this.m_connections.TryGetValue(n2, /* out */vals) && vals.Contains(n1))) {
                return true;
            }

            return false;
        }

        public Normalize() {
            let ordered = this.Nodes.OrderByDescending(() => {  }, n.Position.Abs);
            let largest: GraphNode = ordered.First();
            let mag: number = largest.Position.Abs;
            for (let node: GraphNode in this.Nodes) {
                mag;
                node.Position = (node.Position * (2 + (1 * Golden.tau)));
            }

        }
    }

    export class GraphRelaxation {

        ///  <summary>
        ///  The graph we're operating on.
        ///  </summary>
        public get Graph(): Graph {
        }
        public set Graph(value: Graph)  {
        }

        ///  <summary>
        ///  An attractive force between nodes connected by an edge.
        ///  This is like a rubber band along the axis of the edge.
        ///  </summary>
        public get EdgeAttraction(): number {
        }
        public set EdgeAttraction(value: number)  {
        }

        ///  <summary>
        ///  A repulsion force between all nodes.
        ///  Nodes act like similarly charged ions.
        ///  </summary>
        public get NodeRepulsion(): number {
        }
        public set NodeRepulsion(value: number)  {
        }

        ///  <summary>
        ///  A repulsion force between all edges.
        ///  </summary>
        public get EdgeRepulsion(): number {
        }
        public set EdgeRepulsion(value: number)  {
        }

        public Relax(steps: number) {
            //  ZZZ - add convergence criterion, rather than hard coded number of steps.
            console.log("Relaxing");
            for (let i: number = 0; (i < steps); i++) {
                if (((i % 20)
                            == 0)) {
                    console.log(i);
                }

                let accelerations: VectorND[] = this.CalcAccelerations();
                for (let j: number = 0; (j < this.Graph.Nodes.Count); j++) {
                    this.UpdatePositionAndVelocity(this.Graph.Nodes[j], accelerations[j]);
                }

            }

        }

        private m_dim: number = 4;

        private CalcAccelerations(): VectorND[] {
            let count: number = this.Graph.Nodes.Count;
            let accelerations: VectorND[] = new Array(count);
            for (let i: number = 0; (i < count); i++) {
                accelerations[i] = new VectorND(this.m_dim);
            }

            let nodeRepulse: boolean = !Tolerance.Zero(this.NodeRepulsion);
            let edgeRepulse: boolean = !Tolerance.Zero(this.EdgeRepulsion);
            for (let kvp in this.Graph.m_connections) {
                let i: number = kvp.Key;
                for (let j: number in kvp.Value) {
                    let edgeForce: VectorND = this.CalculateForce(this.Graph.Nodes[i], this.Graph.Nodes[j], this.EdgeAttraction, /* square:*/ false);
                    accelerations[i] = (accelerations[i] + edgeForce);
                    //  Attractive.
                    accelerations[j] = (accelerations[j] - edgeForce);
                }

            }

            if (edgeRepulse) {
                count = this.Graph.Edges.Count;
                for (let i: number = 0; (i < count); i++) {
                    for (let j: number = (i + 1); (j < count); j++) {
                        //  Rather than mess with torques and doing this "right" (like it was two charged rod segments),
                        //  We'll calculate the effect on the two COMs, and give half the force to each node.
                        let n1: number = this.Graph.Edges[i].V1;
                        let n2: number = this.Graph.Edges[i].V2;
                        let n3: number = this.Graph.Edges[j].V1;
                        let n4: number = this.Graph.Edges[j].V2;
                        let center1: GraphNode = new GraphNode(((this.Graph.Nodes[n1].Position + this.Graph.Nodes[n2].Position)
                                        / 2), new VectorND(this.m_dim));
                        let center2: GraphNode = new GraphNode(((this.Graph.Nodes[n3].Position + this.Graph.Nodes[n4].Position)
                                        / 2), new VectorND(this.m_dim));
                        let force: VectorND = (this.CalculateForce(center1, center2, this.EdgeRepulsion, /* square:*/ true) / 2);
                        accelerations[n1] = (accelerations[n1] - force);
                        accelerations[n2] = (accelerations[n2] - force);
                        accelerations[n3] = (accelerations[n3] + force);
                        accelerations[n3] = (accelerations[n3] + force);
                    }

                }

            }

            return accelerations;
        }

        private CalculateForce(node1: GraphNode, node2: GraphNode, strength: number, square: boolean): VectorND {
            let distance: number = node1.Position.Dist(node2.Position);
            //  Here is the direction vector of the force.
            let force: VectorND = (node2.Position - node1.Position);
            if (!force.Normalize()) {
                console.assert(false);
                return new VectorND(node1.Position.Dimension);
            }

            //  Calculate the magnitude.
            let mag: number = 0;
            if (square) {
                mag = (strength / Math.Pow(distance, 2));
            }
            else {
                mag = (strength * distance);
                //  http://en.wikipedia.org/wiki/Hooke's_law
                //  Try to make all edges a specific length.
                // if( diff < 0 )
                // mag = -strength / Math.Pow( diff, 2 );
                // else
                // mag = strength / Math.Pow( diff, 2 );
            }

            if ((mag > 100)) {
                mag = 100;
            }

            return (force * mag);
        }

        private UpdatePositionAndVelocity(node: GraphNode, acceleration: VectorND) {
            // if( allLocked )
            //     return;
            let position: VectorND = node.Position;
            let velocity: VectorND = node.Velocity;
            // if( position.IsOrigin )
            //     return;
            //  Leapfrog method.
            let timeStep: number = 1;
            velocity = (velocity
                        + (acceleration * timeStep));
            5;
            //  Damping.
            this.ZeroComponents(node.Lock, /* ref */velocity);
            position = (position
                        + (velocity * timeStep));
            // position.Normalize(); position *= 5;
            // if( position.MagSquared > 1 )
            // {
            //     position.Normalize();
            //     velocity = new VectorND( 3 );
            // }
            position.Normalize();
            node.Position = position;
            node.Velocity = velocity;
            // node.Acceleration = acceleration;  Any reason to store this?
        }

        private ZeroComponents(components: VectorND, /* ref */input: VectorND) {
            for (let i: number = 0; (i < 4); i++) {
                if ((components.X[i] > 0)) {
                    input.X[i] = 0;
                }

            }

        }
    }
}
