const puppeteer = require('puppeteer')
const fs = require('fs')
const pathResolver = require('path')
const mkdirp = require('mkdirp')

const files = [
  // 'UI/Attributes.cs',
  // 'UI/TrackBarValueEditor.cs',
  // 'Drawing/TextureHelper.cs',
  // 'Drawing/ColorUtil.cs',
  // 'Drawing/Coordinates.cs',
  // 'Drawing/GraphicsUtils.cs',
  'Drawing/ImageGrid.cs',
  'Formats/VRML.cs',
  'Formats/VEF.cs',
  'Formats/STL.cs',
  'Formats/PovRay.cs',
  'Formats/SVG.cs',
  'Algorithm/GraphRelaxation.cs',
  'Math/Graph.cs',
  'Math/Golden.cs',
  'Math/DonHatch.cs',
  'Math/Infinity.cs',
  'Math/Statistics.cs',
  'Math/Isometry.cs',
  'Math/Mobius.cs',
  'Math/Utils.cs',
  'Math/Matrix4D.cs',
  'Honeycombs/Lamp.cs',
  'Honeycombs/H3.cs',
  'Honeycombs/Honeycomb.cs',
  'Honeycombs/H3Utils.cs',
  'Honeycombs/R3.cs',
  'Honeycombs/S3.cs',
  'Honeycombs/H3Supp.cs',
  'Honeycombs/H3Fundamental.cs',
  'Properties/AssemblyInfo.cs',
  'Geometry/Circle.cs',
  'Geometry/Polygon.cs',
  'Geometry/Polytope.cs',
  'Geometry/Mesh.cs',
  'Geometry/Tile.cs',
  'Geometry/VectorND.cs',
  'Geometry/Geometry2D.cs',
  'Geometry/Torus.cs',
  'Geometry/Tiling.cs',
  'Geometry/NearTree.cs',
  'Geometry/Spherical2D.cs',
  'Geometry/Hyperbolic2D.cs',
  'Geometry/Sterographic.cs',
  'Geometry/Vector3D.cs',
  'Geometry/Slicer.cs',
  'Geometry/SphericalModels.cs',
  'Geometry/Surface.cs',
  'Geometry/Sphere.cs',
  'Geometry/Transformable.cs',
  'Geometry/Euclidean2D.cs',
  'Geometry/Euclidean3D.cs',
  'Geometry/HyperbolicModels.cs',
  'Geometry/EuclideanModels.cs',
  'Geometry/UltraInf.cs',
  'Shapeways/ShapewaysSandbox.cs',
  'Shapeways/Shapeways.cs',
  'Shapeways/H3Fundamental.cs',
  'Control/RotationHandler4D.cs',
  'Control/Mouse.cs',
]

const wait = ms => new Promise(res => setTimeout(res, ms))

start()

async function start() {
  let b = await puppeteer.launch({
    browserContext: 'default',
    headless: false,
    args: ['--disable-dev-shm-usage'],
  })
  let p = await b.newPage()
  p.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
  )

  await visit('http://www.carlosag.net/tools/codetranslator/')

  await p.waitForSelector('#_code')

  // await p.setRequestInterception(true)
  // p.on('request', request => {
  //   console.log(request.url())
  //   console.log(request.headers())
  //   if (!request.url().match(/favicon/)) request.continue()
  // })
  // await p.evaluate(
  //   () => (document.querySelector('#_colorize').checked = false),
  // )

  async function visit(url, i = 0) {
    console.log(new Array(i + 1).join('  ') + url)
    try {
      await p.goto(url, { waitUntil: 'networkidle2' })
    } catch (e) {
      console.log(e)
      await b.close()
      b = await puppeteer.launch()
      p = await b.newPage()
      await visit(url, i)
    }
  }

  for (const file of files) {
    const code = fs.readFileSync(
      `../Honeycombs/code/R3/R3.Core/${file}`,
      'utf-8',
    )
    loop: while (true) {
      const output = await translateCode(code)
      if (output === false) {
        await b.close()
        b = await puppeteer.launch({
          headless: false,
        })
        p = await b.newPage()
        await visit('http://www.carlosag.net/tools/codetranslator/')
        await p.waitForSelector('#_code')
        continue
      }
      const dir = pathResolver.dirname(file)
      mkdirp.sync(`input/${dir}`)
      const outputPath = `input/${file.replace(/\.cs$/, '.ts')}`
      console.log('writing', outputPath)
      fs.writeFileSync(`${outputPath}`, output.replace(/ /g, ' '))
      break loop
    }
  }

  // await b.close()

  async function translateCode(code) {
    await p.evaluate(() => {
      document.querySelector('#_src').selectedIndex = 2
    })

    await p.evaluate(() => {
      document.querySelector('#_resultDiv').innerHTML = ''
    })

    await p.evaluate(code => {
      document.querySelector('#_code').value = code
      // var event = new Event('change')
      // document.querySelector('#_code').dispatchEvent(event)
    }, code)

    await wait(200)
    await p.evaluate(() => {
      document
        .querySelector('#_code')
        .dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }))
    })

    await p.evaluate(() => {
      window.scrollTo(0, 1000)
    })

    await wait(200)

    // await wait(100000)

    // await p.evaluate(() => {
    //   // Translate(true)
    // })

    let i = 0
    while (i < 10) {
      console.log('before', i)
      try {
        await p.waitForSelector('#_resultDiv .code')
        await wait(500)
        const output = await p.evaluate(() => {
          return (
            document
              .querySelector('#_resultDiv .code')
              .innerText.trim() ?? ''
          )
        })

        // console.log(
        //   await p.evaluate(() => document.querySelector('#_code').value),
        // )

        console.log('after', i, 'output', output)
        i++

        if (output) {
          return output
        }
      } catch (e) {
        console.log(e)
        return false
      }
    }

    return false

    // const url = `http://www.carlosag.net/tools/codetranslator/translate.ashx`
    // 'Code=' +
    //   Encode(code) +
    //   '&Language=' +
    //   'C#' +
    //   '&DestinationLanguage=' +
    //   'TS'
  }

  function Encode(text) {
    var chars =
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_.!~*'()"
    var hexChars = '0123456789ABCDEF'
    var result = ''
    for (var i = 0; i < text.length; i++) {
      var c = text.charAt(i)
      if (c == ' ') {
        result += '+'
      } else if (chars.indexOf(c) != -1) {
        result += c
      } else {
        var charCode = c.charCodeAt(0)
        result += '%'
        result += hexChars.charAt((charCode >> 4) & 0xf)
        result += hexChars.charAt(charCode & 0xf)
      }
    }
    return result
  }
}
