const fs = require('fs')
const path = require('path')
const file = path.join(__dirname, '..', 'src', 'views', 'Dashboard.vue')
const txt = fs.readFileSync(file, 'utf8')
const lines = txt.split(/\r?\n/)

const tagRe = /<(!--[\s\S]*?--|\/?[a-zA-Z0-9-]+(?:\s[^<>]*)?)>/g
// matches <!--...--> or <tag ...> or </tag>

const stack = []

for (let i = 0; i < lines.length; i++) {
  const line = lines[i]
  let m
  tagRe.lastIndex = 0
  while ((m = tagRe.exec(line)) !== null) {
    const match = m[1]
    if (!match) continue
    if (match.startsWith('!--')) {
      // comment, ignore
      continue
    }
    if (match.startsWith('/')) {
      const tagName = match.slice(1).split(/\s+/)[0]
      // pop until matching tagName is found
      if (stack.length === 0) {
        console.log(`Unmatched closing </${tagName}> at line ${i+1}`)
        process.exit(0)
      }
      const last = stack.pop()
      if (last !== tagName) {
        console.log(`Tag mismatch at line ${i+1}: expected </${last}> but found </${tagName}>`) 
        process.exit(0)
      }
    } else {
      const text = match
      const selfClosing = /\/$/.test(text) || /<\/?(img|br|hr|input|meta|link|area|base|col|embed|param|source|track|wbr)\b/i.test(text)
      const tagName = text.split(/\s+/)[0]
      // ignore xml prolog or doctype
      if (tagName.startsWith('?') || tagName.toLowerCase().startsWith('!doctype')) continue
      if (!selfClosing) {
        stack.push(tagName)
      }
    }
  }
}

if (stack.length === 0) {
  console.log('No mismatched tags found')
} else {
  console.log('Unclosed tags at EOF:', stack.slice(-10))
}
