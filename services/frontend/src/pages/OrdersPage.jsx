import { useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuthStore } from '../store/index.js';

const S = {
  container: { maxWidth: 800, margin: '40px auto', padding: '0 24px' },
  title: { fontSize: 28, fontWeight: 800, marginBottom: 24 },
  card: { background: '#fff', borderRadius: 10, padding: 20, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontWeight: 700, fontSize: 16 },
  status: { padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 },
  item: { display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#4a5568', padding: '4px 0', borderBottom: '1px solid #f7fafc' },
  total: { display: 'flex', justifyContent: 'space-between', marginTop: 10, fontWeight: 700, fontSize: 16 },
};

const statusColor = { confirmed: { bg: '#c6f6d5', color: '#276749' }, pending: { bg: '#fefcbf', color: '#744210' }, processing: { bg: '#bee3f8', color: '#1a365d' } };

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      api.get(`/orders/user/${user.id}`).then((r) => { setOrders(r.data); setLoading(false); });
    }
  }, [user]);

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#a0aec0' }}>Loading orders...</div>;

  return (
    <div style={S.container}>
      <div style={S.title}>Your Orders</div>
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#a0aec0', fontSize: 18 }}>No orders yet</div>
      ) : (
        orders.map((o) => {
          const sc = statusColor[o.status] || { bg: '#e2e8f0', color: '#4a5568' };
          return (
            <div key={o.id} style={S.card}>
              <div style={S.header}>
                <div style={S.orderId}>Order #{o.id}</div>
                <span style={{ ...S.status, background: sc.bg, color: sc.color }}>{o.status}</span>
              </div>
              <div style={{ fontSize: 12, color: '#a0aec0', marginBottom: 12 }}>{new Date(o.createdAt).toLocaleDateString()}</div>
              {(o.items || []).map((item) => (
                <div key={item.id} style={S.item}>
                  <span>{item.productName} × {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div style={S.total}><span>Total</span><span>${Number(o.total).toFixed(2)}</span></div>
            </div>
          );
        })
      )}
    </div>
  );
}
