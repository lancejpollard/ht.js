import R3.Geometry;

module R3.Drawing {
    
    ///  <summary>
    ///  Class to help converting from Image/Canvas coords <-> absolute coords.
    ///  </summary>
    export class ImageSpace {
        
        ///  <summary>
        ///  Takes in width/height of an Image/Canvas.
        ///  For a bitmap, this is number of pixels.
        ///  </summary>
        public constructor (width: number, height: number) {
            m_width = width;
            m_height = height;
        }
        
        private m_width: number;
        
        private m_height: number;
        
        //  The bounds in model space.
        public get XMin(): number {
        }
        public set XMin(value: number)  {
        }
        
        public get XMax(): number {
        }
        public set XMax(value: number)  {
        }
        
        public get YMin(): number {
        }
        public set YMin(value: number)  {
        }
        
        public get YMax(): number {
        }
        public set YMax(value: number)  {
        }
        
        ///  <summary>
        ///  Returns a screen width from an absolute width.
        ///  </summary>
        public Width(width: number): number {
            let percent: number = (width 
                        / (this.XMax - this.XMin));
            return (percent * this.m_width);
        }
        
        ///  <summary>
        ///  Returns a screen height from an absolute height.
        ///  </summary>
        public Height(height: number): number {
            let percent: number = (height 
                        / (this.YMax - this.YMin));
            return (percent * this.m_height);
        }
        
        ///  <summary>
        ///  Returns a screen pixel from an absolute location.
        ///  NOTE: We don't return a 'Point' because it is different in Forms/Silverlight.
        ///  </summary>
        public Pixel(point: Vector3D): Vector3D {
            let xPercent: number = ((point.X - this.XMin) 
                        / (this.XMax - this.XMin));
            let yPercent: number = ((point.Y - this.YMin) 
                        / (this.YMax - this.YMin));
            let x: number = (xPercent * this.m_width);
            let y: number = (this.m_height 
                        - (yPercent * this.m_height));
            return new Vector3D(x, y, 0);
        }
        
        ///  <summary>
        ///  Returns an absolute location from a screen pixel.
        ///  NOTE: We don't take in a 'Point' because it is different in Forms/Silverlight.
        ///  </summary>
        public Point(Pixel: Vector3D): Vector3D {
            return new Vector3D((this.XMin 
                            + ((Pixel.X / this.m_width) 
                            * (this.XMax - this.XMin))), (this.YMax 
                            - ((Pixel.Y / this.m_height) 
                            * (this.YMax - this.YMin))), 0);
        }
        
        ///  <summary>
        ///  VectorNDs are assumed to be 4D.
        ///  </summary>
        public Pixel(point: VectorND): VectorND {
            let result: Vector3D = this.Pixel(new Vector3D(point.X[0], point.X[1], point.X[2]));
            return new VectorND([
                        result.X,
                        result.Y,
                        result.Z,
                        0]);
        }
    }
}