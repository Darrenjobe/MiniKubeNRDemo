'use strict';
require('newrelic'); // MUST be first

const express = require('express');
const Redis = require('ioredis');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4001;
const JWT_SECRET = process.env.JWT_SECRET || 'demo_secret_change_me';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times) => Math.min(times * 100, 3000),
});

redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err.message));

app.use(express.json());
app.use(morgan('combined'));

// Extract user ID from JWT (gateway already verified it, but we decode for the user ID)
function getUserId(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.sub || decoded.user_id || decoded.id;
  } catch {
    return null;
  }
}

const cartKey = (userId) => `cart:${userId}`;

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'cart-service' }));

// GET /api/cart - get current user's cart
app.get('/api/cart', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const items = await redis.hgetall(cartKey(userId));
  const cart = Object.entries(items || {}).map(([productId, data]) => ({
    productId: parseInt(productId),
    ...JSON.parse(data),
  }));
  res.json({ items: cart, count: cart.length });
});

// POST /api/cart/add - add item to cart
app.post('/api/cart/add', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { productId, name, price, quantity = 1, imageUrl } = req.body;
  if (!productId || !name || price == null) {
    return res.status(400).json({ error: 'productId, name, and price are required' });
  }

  const key = cartKey(userId);
  const existing = await redis.hget(key, String(productId));
  let item = existing ? JSON.parse(existing) : { name, price, quantity: 0, imageUrl };
  item.quantity += quantity;

  await redis.hset(key, String(productId), JSON.stringify(item));
  await redis.expire(key, 86400 * 7); // 7 day TTL

  res.json({ message: 'Item added', productId, quantity: item.quantity });
});

// PUT /api/cart/update - update item quantity
app.put('/api/cart/update', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { productId, quantity } = req.body;
  const key = cartKey(userId);

  if (quantity <= 0) {
    await redis.hdel(key, String(productId));
    return res.json({ message: 'Item removed' });
  }

  const existing = await redis.hget(key, String(productId));
  if (!existing) return res.status(404).json({ error: 'Item not in cart' });

  const item = JSON.parse(existing);
  item.quantity = quantity;
  await redis.hset(key, String(productId), JSON.stringify(item));

  res.json({ message: 'Cart updated', productId, quantity });
});

// DELETE /api/cart/remove/:productId
app.delete('/api/cart/remove/:productId', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  await redis.hdel(cartKey(userId), req.params.productId);
  res.json({ message: 'Item removed' });
});

// DELETE /api/cart/clear
app.delete('/api/cart/clear', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  await redis.del(cartKey(userId));
  res.json({ message: 'Cart cleared' });
});

app.listen(PORT, () => console.log(`Cart Service listening on port ${PORT}`));
