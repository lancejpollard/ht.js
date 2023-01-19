import * as PIXI from 'pixi.js'

const app = new PIXI.Application({
  width: 800,
  height: 600,
})

const sprites = {}

document.body.appendChild(app.view as HTMLCanvasElement)

//create a texture

tesselation.addEventListener('tile:attach', attachSprite)
tesselation.addEventListener('tile:detach', detachSprite)

tessellation.tiles.forEach(attachSprite)

function detachSprite(tile) {
  const sprite = sprites[tile.hash()]
  if (sprite) {
    app.stage.removeChild(sprite)
  }
}

function attachSprite(tile) {
  const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
  sprite.tint = 0xff0000

  sprites[tile.hash()] = sprite

  const polygon = new PIXI.Polygon(tile.Boundary.Segments)
  const mask = new PIXI.Graphics()
  mask.hitArea = polygon
  mask.interactive = true
  mask.beginFill(0xff0000)
  mask.drawPolygon(polygon)
  sprite.mask = mask

  sprite.onmouseover = () => {
    sprite.alpha = 0.5
  }

  sprite.onmouseout = () => {
    sprite.alpha = 1
  }

  app.stage.addChild(sprite)
}

app.ticker.add(delta => {
  // Add the time to our total elapsed time
  // elapsed += delta
  // // Update the sprite's X position based on the cosine of our elapsed time.  We divide
  // // by 50 to slow the animation down a bit...
  // sprite.x = 100.0 + Math.cos(elapsed / 50.0) * 100.0
})
