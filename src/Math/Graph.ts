export class GraphEdge {
  constructor(v1: number, v2: number) {
    //  Keep it ordered
    if (v1 < v2) {
      V1 = v1
      V2 = v2
    } else {
      V1 = v2
      V2 = v1
    }
  }

  get V1(): number {}

  set V1(value: number) {}

  get V2(): number {}

  set V2(value: number) {}

  // Given a vertex index, find the vertex at the other end of the edge.

  Opposite(idx: number): number {
    return idx == V1 ? V2 : V1
  }

  // vZome VEF format.

  ReadEdge(line: string) {
    // string[] split = line.Split( '\t' );
    let split: Array<string> = line.Split(
      ['\t', ' '],
      System.StringSplitOptions.RemoveEmptyEntries,
    )
    this.V1 = number.Parse(split[0])
    this.V2 = number.Parse(split[1])
  }

  // vZome VEF format.

  WriteEdge(): string {
    return this.V1.ToString() + ('    ' + this.V2.ToString())
  }
}
