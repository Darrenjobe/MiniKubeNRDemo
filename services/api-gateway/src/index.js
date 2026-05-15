'use strict';
require('newrelic'); // MUST be first

const express = require('express');
const proxy = require('express-http-proxy');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4000;

const USER_SERVICE    = process.env.USER_SERVICE_URL    || 'http://user-service:8001';
const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL || 'http://product-service:8080';
const CART_SERVICE    = process.env.CART_SERVICE_URL    || 'http://cart-service:4001';
const ORDER_SERVICE   = process.env.ORDER_SERVICE_URL   || 'http://order-service:8081';
const CHAT_SERVICE    = process.env.CHAT_SERVICE_URL    || 'http://ai-chat-service:8002';
const ADMIN_SERVICE   = process.env.ADMIN_SERVICE_URL   || 'http://admin-service:8003';

app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

// Proxy options: forward all headers so NR distributed tracing headers pass through
const proxyOptions = {
  proxyReqOptDecorator(proxyReqOpts, srcReq) {
    // Copy all incoming headers (includes NR trace headers)
    Object.keys(srcReq.headers).forEach((key) => {
      proxyReqOpts.headers[key] = srcReq.headers[key];
    });
    return proxyReqOpts;
  },
};

app.use('/api/users',    proxy(USER_SERVICE,    { ...proxyOptions, proxyReqPathResolver: (req) => `/api/users${req.url}` }));
app.use('/api/products', proxy(PRODUCT_SERVICE, { ...proxyOptions, proxyReqPathResolver: (req) => `/api/products${req.url}` }));
app.use('/api/cart',     proxy(CART_SERVICE,    { ...proxyOptions, proxyReqPathResolver: (req) => `/api/cart${req.url}` }));
app.use('/api/orders',   proxy(ORDER_SERVICE,   { ...proxyOptions, proxyReqPathResolver: (req) => `/api/orders${req.url}` }));
app.use('/api/chat',     proxy(CHAT_SERVICE,    { ...proxyOptions, proxyReqPathResolver: (req) => `/api/chat${req.url}` }));
app.use('/api/admin',    proxy(ADMIN_SERVICE,   { ...proxyOptions, proxyReqPathResolver: (req) => `/api/admin${req.url}` }));

// Fallback error handler
app.use((err, req, res, _next) => {
  console.error('Gateway error:', err.message);
  res.status(502).json({ error: 'Bad Gateway', message: err.message });
});

app.listen(PORT, () => console.log(`API Gateway listening on port ${PORT}`));
