import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useCartStore } from '../store/index.js';

const S = {
  container: { maxWidth: 800, margin: '40px auto', padding: '0 24px' },
  title: { fontSize: 28, fontWeight: 800, marginBottom: 24 },
  row: { display: 'flex', alignItems: 'center', gap: 16, background: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  img: { width: 80, height: 80, objectFit: 'cover', borderRadius: 8 },
  name: { flex: 1, fontWeight: 600 },
  price: { fontWeight: 700, fontSize: 18, minWidth: 90, textAlign: 'right' },
  qtyBtn: { padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: 4, cursor: 'pointer', background: '#f7fafc', fontSize: 16 },
  qty: { minWidth: 30, textAlign: 'center', fontWeight: 600 },
  del: { color: '#e53e3e', cursor: 'pointer', fontSize: 20, padding: '0 8px' },
  summary: { background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginTop: 16 },
  total: { fontSize: 22, fontWeight: 800, marginBottom: 16 },
  checkoutBtn: { width: '100%', padding: 14, background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer' },
};

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setCart } = useCartStore();
  const navigate = useNavigate();

  const load = () => api.get('/cart').then((r) => { setItems(r.data.items || []); setCart(r.data.items || []); setLoading(false); });

  useEffect(() => { load(); }, []);

  const update = async (productId, delta) => {
    const item = items.find((i) => i.productId === productId);
    const newQty = (item?.quantity || 0) + delta;
    if (newQty <= 0) {
      await api.delete(`/cart/remove/${productId}`);
    } else {
      await api.put('/cart/update', { productId, quantity: newQty });
    }
    load();
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#a0aec0' }}>Loading cart...</div>;

  return (
    <div style={S.container}>
      <div style={S.title}>Your Cart</div>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#a0aec0' }}>
          <div style={{ fontSize: 48 }}>🛒</div>
          <div style={{ marginTop: 16, fontSize: 18 }}>Your cart is empty</div>
          <button style={{ marginTop: 20, padding: '10px 24px', background: '#1a202c', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }} onClick={() => navigate('/')}>Shop Now</button>
        </div>
      ) : (
        <>
          {items.map((item) => (
            <div key={item.productId} style={S.row}>
              {item.imageUrl && <img src={item.imageUrl} alt={item.name} style={S.img} />}
              <span style={S.name}>{item.name}</span>
              <button style={S.qtyBtn} onClick={() => update(item.productId, -1)}>−</button>
              <span style={S.qty}>{item.quantity}</span>
              <button style={S.qtyBtn} onClick={() => update(item.productId, 1)}>+</button>
              <span style={S.price}>${(item.price * item.quantity).toFixed(2)}</span>
              <span style={S.del} onClick={() => update(item.productId, -item.quantity)}>×</span>
            </div>
          ))}
          <div style={S.summary}>
            <div style={S.total}>Total: ${total.toFixed(2)}</div>
            <button style={S.checkoutBtn} onClick={() => navigate('/checkout')}>Proceed to Checkout →</button>
          </div>
        </>
      )}
    </div>
  );
}
