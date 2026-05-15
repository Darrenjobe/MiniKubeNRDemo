import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuthStore, useCartStore } from '../store/index.js';

const S = {
  container: { maxWidth: 900, margin: '40px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 },
  img: { width: '100%', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' },
  tag: { fontSize: 12, color: '#3182ce', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 },
  name: { fontSize: 28, fontWeight: 800, marginBottom: 12, color: '#1a202c' },
  price: { fontSize: 36, fontWeight: 800, color: '#2d3748', marginBottom: 16 },
  desc: { color: '#4a5568', lineHeight: 1.7, marginBottom: 24 },
  stock: { fontSize: 14, color: '#38a169', marginBottom: 24, fontWeight: 600 },
  qtyRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  qtyBtn: { width: 36, height: 36, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 600 },
  qtyVal: { fontSize: 18, fontWeight: 700, minWidth: 32, textAlign: 'center' },
  addBtn: { width: '100%', padding: '14px', background: '#1a202c', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 12 },
  back: { color: '#3182ce', textDecoration: 'none', fontSize: 14, cursor: 'pointer', display: 'inline-block', marginBottom: 32, marginTop: 24, marginLeft: 24 },
};

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { token } = useAuthStore();
  const { addLocalItem } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/products/${id}`).then((r) => setProduct(r.data));
  }, [id]);

  const addToCart = async () => {
    if (!token) { navigate('/login'); return; }
    try {
      await api.post('/cart/add', { productId: product.id, name: product.name, price: product.price, quantity: qty, imageUrl: product.imageUrl || product.image_url });
      addLocalItem({ productId: product.id, name: product.name, price: product.price, quantity: qty });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      alert('Failed to add to cart');
    }
  };

  if (!product) return <div style={{ textAlign: 'center', padding: 80, color: '#a0aec0' }}>Loading...</div>;

  return (
    <>
      <span style={S.back} onClick={() => navigate(-1)}>← Back</span>
      <div style={S.container}>
        <img src={product.imageUrl || product.image_url} alt={product.name} style={S.img} />
        <div>
          <div style={S.tag}>{product.category}</div>
          <div style={S.name}>{product.name}</div>
          <div style={S.price}>${Number(product.price).toFixed(2)}</div>
          <div style={S.desc}>{product.description}</div>
          <div style={S.stock}>✓ In Stock ({product.stock} available)</div>
          <div style={S.qtyRow}>
            <button style={S.qtyBtn} onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <span style={S.qtyVal}>{qty}</span>
            <button style={S.qtyBtn} onClick={() => setQty(qty + 1)}>+</button>
          </div>
          <button style={{ ...S.addBtn, background: added ? '#38a169' : '#1a202c' }} onClick={addToCart}>
            {added ? '✓ Added to Cart!' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </>
  );
}
