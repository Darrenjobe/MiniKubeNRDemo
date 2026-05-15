// Express server that serves the built React app and injects the NR Browser agent snippet
'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, '..', 'dist');

// New Relic Browser agent snippet — set via NR_BROWSER_AGENT env var
const nrSnippet = process.env.NR_BROWSER_AGENT || '';

// Read and cache index.html with the NR snippet injected
let indexHtml;
try {
  const raw = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  indexHtml = raw.replace('<!--NR_BROWSER_AGENT-->', nrSnippet);
} catch (e) {
  console.warn('dist/index.html not found — run "npm run build" first');
  indexHtml = '<html><body><h1>Build not found. Run npm run build.</h1></body></html>';
}

// Serve all static assets normally
app.use(express.static(DIST, { index: false }));

// All routes return the patched index.html (SPA)
app.get('*', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(indexHtml);
});

app.listen(PORT, () => console.log(`Frontend serving on port ${PORT}`));
