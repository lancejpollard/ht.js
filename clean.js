const fs = require('fs')
const pathResolver = require('path')
const prettier = require('prettier')
const glob = require('glob')
const mkdirp = require('mkdirp')

// options is optional
glob('translate/**/*.ts', {}, function (er, files) {
  files.forEach(file => {
    const outputPath = file.replace('translate', 'pretty')
    mkdirp.sync(pathResolver.dirname(outputPath))
    try {
      fs.writeFileSync(
        outputPath,
        prettier.format(
          fs.readFileSync(file, 'utf-8').replace(/ /g, ' '),
          {
            semi: false,
            parser: 'typescript',
            trailingComma: 'all',
            singleQuote: true,
            printWidth: 72,
            tabWidth: 2,
            useTabs: false,
            arrowParens: 'avoid',
            quoteProps: 'as-needed',
            bracketSpacing: true,
            proseWrap: 'always',
            endOfLine: 'lf',
            singleAttributePerLine: true,
            prettierPath: './node_modules/prettier',
            importOrder: [
              '^react$',
              '^styled',
              '^\\w(.*)$',
              '^@(.*)$',
              '~(.*)$',
              '\\..(.*)$',
              '\\.(.*)$',
            ],
            importOrderSeparation: true,
            importOrderSortSpecifiers: true,
          },
        ),
      )
    } catch (e) {
      console.log(e)
      console.log(file)
      throw e
    }
  })
})
