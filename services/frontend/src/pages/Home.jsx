import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';

const S = {
  hero: { background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', color: '#fff', padding: '60px 24px', textAlign: 'center' },
  heroTitle: { fontSize: 42, fontWeight: 800, marginBottom: 12 },
  heroSub: { fontSize: 18, color: '#a0aec0', marginBottom: 24 },
  container: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 },
  card: { background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' },
  img: { width: '100%', height: 200, objectFit: 'cover' },
  cardBody: { padding: 16 },
  tag: { fontSize: 11, color: '#3182ce', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 },
  name: { fontSize: 15, fontWeight: 700, marginBottom: 4, color: '#1a202c' },
  desc: { fontSize: 13, color: '#718096', marginBottom: 12, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  price: { fontSize: 20, fontWeight: 800, color: '#2d3748' },
  searchBar: { display: 'flex', gap: 10, marginBottom: 28, maxWidth: 500 },
  input: { flex: 1, padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' },
  filters: { display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  filterBtn: { padding: '6px 14px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13, transition: 'all 0.2s' },
};

const CATEGORIES = ['All', 'Laptops', 'Phones', 'Audio', 'Tablets', 'Monitors', 'Keyboards', 'Mice', 'Accessories', 'Dev Boards', 'Storage', 'Memory', 'Smart Home', 'Streaming'];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/products').then((r) => { setProducts(r.data); setFiltered(r.data); setLoading(false); });
  }, []);

  useEffect(() => {
    let list = products;
    if (category !== 'All') list = list.filter((p) => p.category === category);
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    setFiltered(list);
  }, [search, category, products]);

  return (
    <>
      <div style={S.hero}>
        <div style={S.heroTitle}>Welcome to TechMart</div>
        <div style={S.heroSub}>Premium tech, monitored end-to-end with New Relic</div>
      </div>
      <div style={S.container}>
        <div style={S.searchBar}>
          <input style={S.input} placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={S.filters}>
          {CATEGORIES.map((c) => (
            <button key={c} style={{ ...S.filterBtn, background: category === c ? '#1a202c' : '#fff', color: category === c ? '#fff' : '#4a5568', borderColor: category === c ? '#1a202c' : '#e2e8f0' }}
              onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: 60, color: '#a0aec0' }}>Loading products...</div> : (
          <div style={S.grid}>
            {filtered.map((p) => (
              <div key={p.id} style={S.card} onClick={() => navigate(`/products/${p.id}`)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.1)'; }}>
                <img src={p.imageUrl || p.image_url} alt={p.name} style={S.img} />
                <div style={S.cardBody}>
                  <div style={S.tag}>{p.category}</div>
                  <div style={S.name}>{p.name}</div>
                  <div style={S.desc}>{p.description}</div>
                  <div style={S.price}>${Number(p.price).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
