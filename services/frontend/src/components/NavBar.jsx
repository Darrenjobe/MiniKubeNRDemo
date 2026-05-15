import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useCartStore } from '../store/index.js';

const styles = {
  nav: { background: '#1a202c', color: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' },
  brand: { color: '#63b3ed', fontWeight: 700, fontSize: 22, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 },
  links: { display: 'flex', gap: 20, alignItems: 'center' },
  link: { color: '#e2e8f0', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'color 0.2s' },
  badge: { background: '#e53e3e', color: '#fff', borderRadius: '50%', padding: '1px 6px', fontSize: 11, fontWeight: 700, marginLeft: 4 },
  btn: { background: '#3182ce', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  btnLogout: { background: 'transparent', color: '#a0aec0', border: '1px solid #4a5568', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 14 },
};

export default function NavBar() {
  const { user, logout } = useAuthStore();
  const count = useCartStore((s) => s.count);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>
        🛒 TechMart
        <span style={{ fontSize: 11, color: '#68d391', background: '#2d3748', padding: '2px 6px', borderRadius: 4, fontWeight: 400 }}>
          NR Demo
        </span>
      </Link>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Products</Link>
        {user && (
          <>
            <Link to="/cart" style={styles.link}>
              Cart {count > 0 && <span style={styles.badge}>{count}</span>}
            </Link>
            <Link to="/orders" style={styles.link}>Orders</Link>
          </>
        )}
        <Link to="/admin" style={{ ...styles.link, color: '#fbd38d' }}>⚙ Admin</Link>
        {user ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ color: '#a0aec0', fontSize: 13 }}>Hi, {user.name?.split(' ')[0]}</span>
            <button style={styles.btnLogout} onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <button style={styles.btn} onClick={() => navigate('/login')}>Login</button>
        )}
      </div>
    </nav>
  );
}
