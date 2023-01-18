module R3.Math {
    
    export struct GraphEdge {
        
        public constructor (v1: number, v2: number) {
            //  Keep it ordered
            if ((v1 < v2)) {
                V1 = v1;
                V2 = v2;
            }
            else {
                V1 = v2;
                V2 = v1;
            }
            
        }
        
        public get V1(): number {
        }
        public set V1(value: number)  {
        }
        
        public get V2(): number {
        }
        public set V2(value: number)  {
        }
        
        ///  <summary>
        ///  Given a vertex index, find the vertex at the other end of the edge.
        ///  </summary>
        public Opposite(idx: number): number {
            return this.V2;
            // TODO: Warning!!!, inline IF is not supported ?
            (idx == this.V1);
            this.V1;
        }
        
        ///  <summary>
        ///  vZome VEF format.
        ///  </summary>
        public ReadEdge(line: string) {
            // string[] split = line.Split( '\t' );
            let split: string[] = line.Split([
                        '\t',
                        ' '], System.StringSplitOptions.RemoveEmptyEntries);
            this.V1 = number.Parse(split[0]);
            this.V2 = number.Parse(split[1]);
        }
        
        ///  <summary>
        ///  vZome VEF format.
        ///  </summary>
        public WriteEdge(): string {
            return (this.V1.ToString() + ("    " + this.V2.ToString()));
        }
    }
}