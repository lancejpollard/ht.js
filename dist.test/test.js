var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
define(["require", "exports", "pixi.js"], function (require, exports, PIXI) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    PIXI = __importStar(PIXI);
    var app = new PIXI.Application({
        width: 800,
        height: 600,
    });
    var sprites = {};
});
// document.body.appendChild(app.view as HTMLCanvasElement)
// //create a texture
// tesselation.addEventListener('tile:attach', attachSprite)
// tesselation.addEventListener('tile:detach', detachSprite)
// tessellation.tiles.forEach(attachSprite)
// function detachSprite(tile) {
//   const sprite = sprites[tile.hash()]
//   if (sprite) {
//     app.stage.removeChild(sprite)
//   }
// }
// function attachSprite(tile) {
//   const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
//   sprite.tint = 0xff0000
//   sprites[tile.hash()] = sprite
//   const polygon = new PIXI.Polygon(tile.Boundary.Segments)
//   const mask = new PIXI.Graphics()
//   mask.hitArea = polygon
//   mask.interactive = true
//   mask.beginFill(0xff0000)
//   mask.drawPolygon(polygon)
//   sprite.mask = mask
//   sprite.onmouseover = () => {
//     sprite.alpha = 0.5
//   }
//   sprite.onmouseout = () => {
//     sprite.alpha = 1
//   }
//   app.stage.addChild(sprite)
// }
// app.ticker.add(delta => {
//   // Add the time to our total elapsed time
//   // elapsed += delta
//   // // Update the sprite's X position based on the cosine of our elapsed time.  We divide
//   // // by 50 to slow the animation down a bit...
//   // sprite.x = 100.0 + Math.cos(elapsed / 50.0) * 100.0
// })
// // Geodesic(tile.Geometry, currentPosition, tile.VertexCircle.Center)
