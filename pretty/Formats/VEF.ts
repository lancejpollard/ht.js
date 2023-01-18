export class VEF {
  ///  <summary>
  ///  The vertices.
  ///  </summary>
  get Vertices(): GoldenVector4D[] {}
  set Vertices(value: GoldenVector4D[]) {}

  ///  <summary>
  ///  The edges.
  ///  </summary>
  get Edges(): GraphEdge[] {}
  set Edges(value: GraphEdge[]) {}

  ///  <summary>
  ///  Load from a VEF file.
  ///  </summary>
  ///  <param name="fileName"></param>
  Load(fileName: string) {
    let lines: IEnumerator<string> =
      File.ReadLines(fileName).GetEnumerator()
    lines.MoveNext()
    let numVertices: number = number.Parse(lines.Current)
    let vertices: List<GoldenVector4D> = new List<GoldenVector4D>()
    for (let i: number = 0; i < numVertices; i++) {
      lines.MoveNext()
      let v: GoldenVector4D = new GoldenVector4D()
      v.ReadVector(lines.Current)
      vertices.Add(v)
    }

    lines.MoveNext()
    let numEdges: number = number.Parse(lines.Current)
    let edges: List<GraphEdge> = new List<GraphEdge>()
    for (let i: number = 0; i < numEdges; i++) {
      lines.MoveNext()
      let e: GraphEdge = new GraphEdge()
      e.ReadEdge(lines.Current)
      edges.Add(e)
    }

    this.Vertices = vertices.ToArray()
    this.Edges = edges.ToArray()
  }
}
