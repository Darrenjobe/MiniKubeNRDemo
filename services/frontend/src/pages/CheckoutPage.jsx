import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuthStore, useCartStore } from '../store/index.js';

const S = {
  container: { maxWidth: 700, margin: '40px auto', padding: '0 24px' },
  title: { fontSize: 28, fontWeight: 800, marginBottom: 24 },
  form: { background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', marginBottom: 16 },
  summary: { background: '#f7fafc', borderRadius: 10, padding: 20 },
  itemRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: '#4a5568' },
  total: { fontSize: 20, fontWeight: 800, borderTop: '2px solid #e2e8f0', paddingTop: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between' },
  btn: { width: '100%', padding: 16, background: '#2b6cb0', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 20 },
  success: { textAlign: 'center', padding: 60 },
};

export default function CheckoutPage() {
  const [items, setItems] = useState([]);
  const [address, setAddress] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const { user } = useAuthStore();
  const { clearLocal } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/cart').then((r) => setItems(r.data.items || []));
  }, []);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const placeOrder = async () => {
    if (!address.trim()) { alert('Please enter a shipping address'); return; }
    setPlacing(true);
    try {
      const resp = await api.post('/orders', {
        userId: parseInt(user.id),
        items: items.map((i) => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity })),
        shippingAddress: address,
      });
      await api.delete('/cart/clear');
      clearLocal();
      setOrderId(resp.data.id);
    } catch (err) {
      alert(`Order failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setPlacing(false);
    }
  };

  if (orderId) {
    return (
      <div style={S.success}>
        <div style={{ fontSize: 64 }}>✅</div>
        <div style={{ fontSize: 28, fontWeight: 800, marginTop: 20, marginBottom: 8 }}>Order Confirmed!</div>
        <div style={{ color: '#718096', marginBottom: 24 }}>Order #{orderId} has been placed successfully</div>
        <button style={{ padding: '10px 24px', background: '#1a202c', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', marginRight: 12 }} onClick={() => navigate('/orders')}>View Orders</button>
        <button style={{ padding: '10px 24px', background: '#fff', color: '#1a202c', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }} onClick={() => navigate('/')}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div style={S.container}>
      <div style={S.title}>Checkout</div>
      <div style={S.form}>
        <label style={S.label}>Shipping Address</label>
        <input style={S.input} placeholder="123 Main St, San Francisco, CA 94102" value={address} onChange={(e) => setAddress(e.target.value)} />
        <label style={S.label}>Payment (Demo — no real payment)</label>
        <input style={S.input} value="4242 4242 4242 4242" readOnly />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <input style={S.input} value="12/28" readOnly />
          <input style={S.input} value="123" readOnly />
        </div>
      </div>
      <div style={S.summary}>
        <div style={{ fontWeight: 700, marginBottom: 12 }}>Order Summary</div>
        {items.map((i) => (
          <div key={i.productId} style={S.itemRow}>
            <span>{i.name} × {i.quantity}</span>
            <span>${(i.price * i.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div style={S.total}><span>Total</span><span>${total.toFixed(2)}</span></div>
      </div>
      <button style={S.btn} onClick={placeOrder} disabled={placing}>
        {placing ? 'Placing Order...' : `Place Order — $${total.toFixed(2)}`}
      </button>
    </div>
  );
}
