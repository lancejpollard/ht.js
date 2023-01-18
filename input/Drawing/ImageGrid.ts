import System.Drawing;
import System.Drawing.Imaging;
import System.IO;

module R3.Drawing {
    
    ///  <summary>
    ///  This will take a list of images and resize/combine them into a single image grid.
    ///  </summary>
    export class ImageGrid {
        
        export class Settings {
            
            public constructor () {
                Columns = 4;
                Rows = 2;
                Width = ((4 * 1000) + (3 * hGap));
                Height = ((2 * 1000) + (1 * vGap));
                FileName = "output.png";
            }
            
            public vGap: number = 500;
            
            public hGap: number = 250;
            
            public get Columns(): number {
            }
            public set Columns(value: number)  {
            }
            
            public get Rows(): number {
            }
            public set Rows(value: number)  {
            }
            
            public get Width(): number {
            }
            public set Width(value: number)  {
            }
            
            public get Height(): number {
            }
            public set Height(value: number)  {
            }
            
            public get Directory(): string {
            }
            public set Directory(value: string)  {
            }
            
            ///  <summary>
            ///  The filenames of the input images (just leaf names).
            ///  We will fill out result by rows.
            ///  </summary>
            public get InputImages(): string[] {
            }
            public set InputImages(value: string[])  {
            }
            
            ///  <summary>
            ///  The output file.
            ///  </summary>
            public get FileName(): string {
            }
            public set FileName(value: string)  {
            }
        }
        
        public Generate(s: Settings) {
            let image: Bitmap = new Bitmap(s.Width, s.Height);
            let g: Graphics = Graphics.FromImage(image);
            g.Clear(Color.Black);
            let tileWidth: number = 300;
            // s.Width / s.Columns;
            let tileHeight: number = 300;
            //  s.Height / s.Rows;
            let hGap: number = s.hGap;
            let vGap: number = s.vGap;
            let tileSize: Size = new Size(tileWidth, tileHeight);
            let currentCol: number = 0;
            let currentRow: number = 0;
            for (let imageName: string in s.InputImages) {
                let fullFileName: string = Path.Combine(s.Directory, imageName);
                let original: Bitmap = new Bitmap(fullFileName);
                //  Resize
                let tile: Bitmap = new Bitmap(original, tileSize);
                //  Copy to location.
                for (let i: number = 0; (i < tile.Width); i++) {
                    for (let j: number = 0; (j < tile.Height); j++) {
                        let c: Color = tile.GetPixel(i, j);
                        image.SetPixel((hGap 
                                        + ((currentCol 
                                        * (tileWidth + hGap)) 
                                        + i)), (vGap 
                                        + ((currentRow 
                                        * (tileHeight + vGap)) 
                                        + j)), c);
                    }
                    
                }
                
                original.Dispose();
                tile.Dispose();
                currentCol++;
                if ((currentCol >= s.Columns)) {
                    currentCol = 0;
                    currentRow++;
                }
                
                if ((currentRow >= s.Rows)) {
                    break;
                }
                
            }
            
            image.Save(s.FileName, ImageFormat.Png);
        }
    }
}