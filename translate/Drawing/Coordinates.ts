
    ///  <summary>
    ///  Class to help converting from Image/Canvas coords <-> absolute coords.
    ///  </summary>
    export class ImageSpace {
        
        ///  <summary>
        ///  Takes in width/height of an Image/Canvas.
        ///  For a bitmap, this is number of pixels.
        ///  </summary>
        constructor (width: number, height: number) {
            m_width = width;
            m_height = height;
        }
        
        #m_width: number;
        
        #m_height: number;
        
        //  The bounds in model space.
        get XMin(): number {
        }
        set XMin(value: number)  {
        }
        
        get XMax(): number {
        }
        set XMax(value: number)  {
        }
        
        get YMin(): number {
        }
        set YMin(value: number)  {
        }
        
        get YMax(): number {
        }
        set YMax(value: number)  {
        }
        
        ///  <summary>
        ///  Returns a screen width from an absolute width.
        ///  </summary>
        Width(width: number): number {
            let percent: number = (width 
                        / (this.XMax - this.XMin));
            return (percent * this.m_width);
        }
        
        ///  <summary>
        ///  Returns a screen height from an absolute height.
        ///  </summary>
        Height(height: number): number {
            let percent: number = (height 
                        / (this.YMax - this.YMin));
            return (percent * this.m_height);
        }
        
        ///  <summary>
        ///  Returns a screen pixel from an absolute location.
        ///  NOTE: We don't return a 'Point' because it is different in Forms/Silverlight.
        ///  </summary>
        Pixel(point: Vector3D): Vector3D {
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
        Point(Pixel: Vector3D): Vector3D {
            return new Vector3D((this.XMin 
                            + ((Pixel.X / this.m_width) 
                            * (this.XMax - this.XMin))), (this.YMax 
                            - ((Pixel.Y / this.m_height) 
                            * (this.YMax - this.YMin))), 0);
        }
        
        ///  <summary>
        ///  VectorNDs are assumed to be 4D.
        ///  </summary>
        Pixel(point: VectorND): VectorND {
            let result: Vector3D = this.Pixel(new Vector3D(point.X[0], point.X[1], point.X[2]));
            return new VectorND([
                        result.X,
                        result.Y,
                        result.Z,
                        0]);
        }
    }
