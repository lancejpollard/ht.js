///  <summary>
///  This will take a list of images and resize/combine them into a single image grid.
///  </summary>
export class ImageGrid {
  Generate(s: Settings) {
    let image: Bitmap = new Bitmap(s.Width, s.Height)
    let g: Graphics = Graphics.FromImage(image)
    g.Clear(Color.Black)
    let tileWidth: number = 300
    // s.Width / s.Columns;
    let tileHeight: number = 300
    //  s.Height / s.Rows;
    let hGap: number = s.hGap
    let vGap: number = s.vGap
    let tileSize: Size = new Size(tileWidth, tileHeight)
    let currentCol: number = 0
    let currentRow: number = 0
    for (let imageName: string in s.InputImages) {
      let fullFileName: string = Path.Combine(s.Directory, imageName)
      let original: Bitmap = new Bitmap(fullFileName)
      //  Resize
      let tile: Bitmap = new Bitmap(original, tileSize)
      //  Copy to location.
      for (let i: number = 0; i < tile.Width; i++) {
        for (let j: number = 0; j < tile.Height; j++) {
          let c: Color = tile.GetPixel(i, j)
          image.SetPixel(
            hGap + (currentCol * (tileWidth + hGap) + i),
            vGap + (currentRow * (tileHeight + vGap) + j),
            c,
          )
        }
      }

      original.Dispose()
      tile.Dispose()
      currentCol++
      if (currentCol >= s.Columns) {
        currentCol = 0
        currentRow++
      }

      if (currentRow >= s.Rows) {
        break
      }
    }

    image.Save(s.FileName, ImageFormat.Png)
  }
}

export class ImageGridSettings {
  constructor() {
    this.Columns = 4
    this.Rows = 2
    this.Width = 4 * 1000 + 3 * hGap
    this.Height = 2 * 1000 + 1 * vGap
    this.FileName = 'output.png'
  }

  vGap: number = 500

  hGap: number = 250

  Columns: number

  Rows: number

  Width: number

  Height: number

  Directory: string

  ///  <summary>
  ///  The filenames of the input images (just leaf names).
  ///  We will fill out result by rows.
  ///  </summary>
  InputImages: Array<string>

  ///  <summary>
  ///  The output file.
  ///  </summary>
  FileName: string
}
