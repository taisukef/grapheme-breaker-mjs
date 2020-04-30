import fs from 'fs'
import fetch from 'node-fetch'
import UnicodeTrieBuilder from './unicode-trie/builder.js'

const main = async function () {
  const UNICODE_VERSION = '10.0.0'
  const url = `https://www.unicode.org/Public/${UNICODE_VERSION}/ucd/auxiliary/GraphemeBreakProperty.txt`
  console.log(url)

  const data = await (await fetch(url)).text()

  const re = /^([0-9A-F]+)(?:\.\.([0-9A-F]+))?\s*;\s*([A-Za-z_]+)/gm
  let nextClass = 1
  const classes = {
    Other: 0
  }
  const trie = new UnicodeTrieBuilder(classes.Other)
  // collect entries in the table into ranges to keep things smaller.
  for (;;) {
    const match = re.exec(data)
    if (!match) {
      break
    }
    const start = match[1]
    const ref = match[2]
    const end = ref || start
    const type = match[3]
    if (classes[type] == null) {
      classes[type] = nextClass++
    }
    trie.setRange(parseInt(start, 16), parseInt(end, 16), classes[type])
  }
  const output = {
    trie: trie.toBuffer().toString('base64'),
    classes
  }
  // write the trie and classes to a file
  fs.writeFileSync(`./classes-v${UNICODE_VERSION}.mjs`, 'export default ' + JSON.stringify(output))

  const key = []
  for (const n in classes) {
    key.push(n)
  }
  console.log('const { ' + key.join(', ') + '} = classesmjs.classes')
}
main()
