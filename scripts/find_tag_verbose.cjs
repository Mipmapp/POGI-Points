const fs = require('fs')
const path = require('path')
const file = path.join(__dirname, '..', 'src', 'views', 'Dashboard.vue')
const txt = fs.readFileSync(file, 'utf8')
const lines = txt.split(/\r?\n/)
const tagRe = /<(!--[\s\S]*?--|\/?[a-zA-Z0-9-]+(?:\s[^<>]*)?)>/g
const stack = []
for (let i = 0; i < Math.min(lines.length, 120); i++) {
  const line = lines[i]
  tagRe.lastIndex = 0
  let m
  while ((m = tagRe.exec(line)) !== null) {
    const match = m[1]
    if (!match) continue
    if (match.startsWith('!--')) { console.log(`${i+1}: <!--comment-->`); continue }
    if (match.startsWith('/')) {
      const tagName = match.slice(1).split(/\s+/)[0]
      const last = stack[stack.length-1]
      console.log(`${i+1}: closing </${tagName}> ; stackTop=${last}`)
      if (stack.length === 0) { console.log('Unmatched closing'); process.exit(0) }
      const popped = stack.pop()
      if (popped !== tagName) { console.log(`Mismatch pop ${popped} vs ${tagName}`); process.exit(0) }
    } else {
      const text = match
      const selfClosing = /\/$/.test(text) || /^(img|br|hr|input|meta|link|area|base|col|embed|param|source|track|wbr)\b/i.test(text)
      const tagName = text.split(/\s+/)[0]
      console.log(`${i+1}: opening <${tagName}> ${selfClosing ? '(self-closing)' : ''}`)
      if (!selfClosing) stack.push(tagName)
    }
  }
}
console.log('Done scanning first 120 lines. stack:', stack)
