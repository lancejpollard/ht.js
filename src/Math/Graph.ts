export class GraphEdge {
  constructor(v1: number, v2: number) {
    //  Keep it ordered
    if (v1 < v2) {
      this.V1 = v1
      this.V2 = v2
    } else {
      this.V1 = v2
      this.V2 = v1
    }
  }

  V1: number

  V2: number

  // Given a vertex index, find the vertex at the other end of the edge.

  Opposite(idx: number): number {
    return idx == this.V1 ? this.V2 : this.V1
  }
}
