const fs = require('fs')
const pathResolver = require('path')
const prettier = require('prettier')
const glob = require('glob')
const mkdirp = require('mkdirp')

// options is optional
glob('translate/**/*.ts', {}, function (er, files) {
  files.forEach(file => {
    const outputPath = file.replace('translate', 'translate')
    mkdirp.sync(pathResolver.dirname(outputPath))
    fs.writeFileSync(
      outputPath,
      fs
        .readFileSync(file, 'utf-8')
        .replace(/public static /g, 'static ')
        .replace(/public /g, '')
        .replace(/private static /g, 'static #')
        .replace(/private /g, '#')
        .replace(/\s+@\w+.+\n/g, '')
        .replace(/#get (\w)/g, (_, $1) => 'get #' + $1)
        .replace(/import .+\n/g, '')
        .replace(/module .+\{\s*\n/g, '')
        .replace(/\}$/, ''),
    )
  })
})
