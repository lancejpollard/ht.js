export class DrawUtils {
  static DrawCircle(c: Circle, g: Graphics, i: ImageSpace) {
    let pen: Pen = new Pen(Color.Black, 1)
    DrawUtils.DrawCircle(c, g, i, pen)
  }

  static #Rect(c: Circle, i: ImageSpace): Rectangle | null {
    if (number.IsInfinity(c.Radius)) {
      return null
    }

    let upperLeft: Vector3D = i.Pixel(
      new Vector3D(c.Center.X - c.Radius, c.Center.Y + c.Radius, 0),
    )
    let width: number = i.Width(c.Radius * 2)
    let height: number = i.Height(c.Radius * 2)
    let rect: Rectangle = new Rectangle(
      <number>upperLeft.X,
      <number>upperLeft.Y,
      <number>width,
      <number>height,
    )
    return rect
  }

  static DrawCircle(c: Circle, g: Graphics, i: ImageSpace, p: Pen) {
    let rect: Rectangle? = DrawUtils.Rect(c, i)
    if (rect == null) {
      return
    }

    g.DrawEllipse(p, rect.Value)
  }

  static DrawFilledCircle(
    c: Circle,
    g: Graphics,
    i: ImageSpace,
    b: Brush,
  ) {
    let rect: Rectangle? = DrawUtils.Rect(c, i)
    if (rect == null) {
      return
    }

    g.FillEllipse(b, rect.Value)
  }

  static DrawLine(
    p1: Vector3D,
    p2: Vector3D,
    g: Graphics,
    i: ImageSpace,
    p: Pen,
  ) {
    g.DrawLine(
      p,
      DrawUtils.VecToPoint(p1, i),
      DrawUtils.VecToPoint(p2, i),
    )
  }

  static DrawTriangle(
    triangle: Mesh.Triangle,
    g: Graphics,
    i: ImageSpace,
  ) {
    let pen: Pen = new Pen(Color.Black, 1)
    g.DrawLine(
      pen,
      DrawUtils.VecToPoint(triangle.a, i),
      DrawUtils.VecToPoint(triangle.b, i),
    )
    g.DrawLine(
      pen,
      DrawUtils.VecToPoint(triangle.b, i),
      DrawUtils.VecToPoint(triangle.c, i),
    )
    g.DrawLine(
      pen,
      DrawUtils.VecToPoint(triangle.c, i),
      DrawUtils.VecToPoint(triangle.a, i),
    )
  }

  static #VecToPoint(vec: Vector3D, i: ImageSpace): Point {
    let temp: Vector3D = i.Pixel(vec)
    return new Point(<number>temp.X, <number>temp.Y)
  }
}
