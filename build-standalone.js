// Builds the-failure-files-standalone.html from index.html by inlining the module scripts.
// Run: node build-standalone.js   (keeps the single-file build from drifting out of sync)
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => '<script>\n' + fs.readFileSync(src, 'utf8').trim() + '\n</script>');
fs.writeFileSync('the-failure-files-standalone.html', html);
console.log('standalone rebuilt:', html.length, 'bytes');
