const fs = require('fs');
const p = 'c:/Users/Jullan/OneDrive/Documents/Code Projects/POGI-Points/src/views/Dashboard.vue';
const s = fs.readFileSync(p, 'utf8');
const tags = ['div','teleport','transition','transition-group','template','svg','button','section','main','header','footer','form'];
let out = '';
tags.forEach(t=>{
  const open = (s.match(new RegExp('<\\s*'+t+'(\\s|>)','gi'))||[]).length;
  const close = (s.match(new RegExp('</\\s*'+t+'\\s*>','gi'))||[]).length;
  out += `${t} open ${open} close ${close} diff ${open-close}\n`;
});
fs.writeFileSync('scripts/tag_check_out.txt', out);
console.log('wrote scripts/tag_check_out.txt');
