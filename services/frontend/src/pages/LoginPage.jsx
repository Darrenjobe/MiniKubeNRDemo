import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client.js';
import { useAuthStore } from '../store/index.js';

const S = {
  page: { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  card: { background: '#fff', borderRadius: 12, padding: 40, width: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  title: { fontSize: 26, fontWeight: 800, marginBottom: 6, textAlign: 'center' },
  sub: { color: '#718096', fontSize: 14, textAlign: 'center', marginBottom: 28 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 6 },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, marginBottom: 16, outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', padding: 12, background: '#1a202c', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 4 },
  error: { color: '#e53e3e', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: '#fff5f5', borderRadius: 6, border: '1px solid #fed7d7' },
  switch: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#718096' },
  demo: { marginTop: 16, padding: 12, background: '#f7fafc', borderRadius: 8, fontSize: 12, color: '#4a5568', border: '1px dashed #e2e8f0' },
};

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('demo@nrdemo.com');
  const [password, setPassword] = useState('admin123');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/users/login' : '/users/register';
      const payload = mode === 'login' ? { email, password } : { email, password, name };
      const resp = await api.post(endpoint, payload);
      setAuth(resp.data.token, resp.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</div>
        <div style={S.sub}>Sign in to TechMart</div>
        {error && <div style={S.error}>{error}</div>}
        <form onSubmit={submit}>
          {mode === 'register' && (
            <>
              <label style={S.label}>Full Name</label>
              <input style={S.input} placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} required />
            </>
          )}
          <label style={S.label}>Email</label>
          <input style={S.input} type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label style={S.label}>Password</label>
          <input style={S.input} type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button style={S.btn} type="submit" disabled={loading}>{loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}</button>
        </form>
        <div style={S.switch}>
          {mode === 'login' ? (
            <>Don't have an account? <span style={{ color: '#3182ce', cursor: 'pointer' }} onClick={() => setMode('register')}>Sign up</span></>
          ) : (
            <>Already have an account? <span style={{ color: '#3182ce', cursor: 'pointer' }} onClick={() => setMode('login')}>Sign in</span></>
          )}
        </div>
        <div style={S.demo}>
          <strong>Demo credentials:</strong><br />
          Email: demo@nrdemo.com | Password: admin123
        </div>
      </div>
    </div>
  );
}
