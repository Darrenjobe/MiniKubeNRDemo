// Express server that serves the built React app and injects the NR Browser agent snippet
'use strict';
const express = require('express');
const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, '..', 'dist');
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://api-gateway:4000';

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

// Proxy /api/* to the API gateway — must come before static and SPA fallback
app.use('/api', createProxyMiddleware({
  target: API_GATEWAY_URL,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.status(502).json({ error: 'API gateway unavailable' });
    },
  },
}));

// Serve all static assets normally
app.use(express.static(DIST, { index: false }));

// All unmatched routes return index.html (SPA fallback).
// Uses app.use() rather than app.get('*') to avoid breaking under Express 5
// which no longer accepts a bare * wildcard in path-to-regexp v8.
app.use((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(indexHtml);
});

app.listen(PORT, () => console.log(`Frontend serving on port ${PORT} → API gateway: ${API_GATEWAY_URL}`));
