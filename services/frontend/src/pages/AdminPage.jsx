import { useEffect, useState } from 'react';
import api from '../api/client.js';

const S = {
  container: { maxWidth: 900, margin: '40px auto', padding: '0 24px' },
  header: { background: '#1a202c', color: '#fff', borderRadius: 12, padding: '28px 32px', marginBottom: 28 },
  title: { fontSize: 26, fontWeight: 800, marginBottom: 6 },
  sub: { color: '#a0aec0', fontSize: 14 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  card: { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  cardTitle: { fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { fontSize: 14, color: '#4a5568' },
  toggle: { width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s' },
  slider: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  rangeLabel: { fontSize: 13, color: '#718096', minWidth: 120 },
  range: { flex: 1 },
  value: { fontSize: 14, fontWeight: 600, minWidth: 50, textAlign: 'right' },
  btn: { width: '100%', padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 8 },
  status: { background: '#f7fafc', borderRadius: 8, padding: 16, marginTop: 16, fontFamily: 'monospace', fontSize: 12 },
  badge: { display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 },
  warning: { background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#c53030' },
};

export default function AdminPage() {
  const [config, setConfig] = useState({ errors_enabled: false, latency_enabled: false, latency_ms: 2000, error_rate: 0.5, target_service: 'all', error_type: '500' });
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');

  const loadStatus = () => api.get('/admin/status').then((r) => setStatus(r.data)).catch(() => {});

  useEffect(() => { loadStatus(); }, []);

  const apply = async () => {
    try {
      await api.post('/admin/configure', config);
      setMessage('✓ Chaos configuration applied');
      loadStatus();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`✗ Error: ${err.message}`);
    }
  };

  const reset = async () => {
    try {
      await api.post('/admin/reset');
      setConfig({ errors_enabled: false, latency_enabled: false, latency_ms: 2000, error_rate: 0.5, target_service: 'all', error_type: '500' });
      setMessage('✓ All services restored to healthy state');
      loadStatus();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`✗ Error: ${err.message}`);
    }
  };

  const triggerError = async (service) => {
    try {
      await api.post(`/admin/trigger-error?service=${service}`);
      setMessage(`✓ Error triggered on ${service} — check New Relic`);
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setMessage(`✗ ${err.message}`);
    }
  };

  const isActive = config.errors_enabled || config.latency_enabled;

  return (
    <div style={S.container}>
      <div style={S.header}>
        <div style={S.title}>⚙ Admin — Chaos Control Panel</div>
        <div style={S.sub}>Inject failures and latency to demonstrate New Relic alerting and error tracking</div>
        {isActive && <div style={{ marginTop: 12, color: '#fc8181', fontWeight: 600 }}>⚠ CHAOS MODE ACTIVE — services are degraded</div>}
      </div>

      {message && <div style={{ ...S.warning, background: message.startsWith('✓') ? '#f0fff4' : '#fff5f5', borderColor: message.startsWith('✓') ? '#c6f6d5' : '#fed7d7', color: message.startsWith('✓') ? '#276749' : '#c53030' }}>{message}</div>}

      <div style={S.grid}>
        {/* Error Injection */}
        <div style={S.card}>
          <div style={S.cardTitle}>💥 Error Injection</div>
          <div style={S.toggleRow}>
            <div style={S.label}>Enable error injection</div>
            <button style={{ ...S.toggle, background: config.errors_enabled ? '#e53e3e' : '#e2e8f0' }}
              onClick={() => setConfig((c) => ({ ...c, errors_enabled: !c.errors_enabled }))}>
              <span style={{ position: 'absolute', top: 3, left: config.errors_enabled ? 26 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s' }} />
            </button>
          </div>
          <div style={S.slider}>
            <span style={S.rangeLabel}>Error rate</span>
            <input type="range" min={0.1} max={1} step={0.1} value={config.error_rate} style={S.range}
              onChange={(e) => setConfig((c) => ({ ...c, error_rate: parseFloat(e.target.value) }))} />
            <span style={S.value}>{Math.round(config.error_rate * 100)}%</span>
          </div>
          <div style={S.toggleRow}>
            <span style={S.label}>Error type</span>
            <select value={config.error_type} onChange={(e) => setConfig((c) => ({ ...c, error_type: e.target.value }))}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
              <option value="500">500 Internal Error</option>
              <option value="503">503 Service Unavailable</option>
              <option value="null_pointer">NullPointerException</option>
              <option value="timeout">Timeout</option>
            </select>
          </div>
        </div>

        {/* Latency Injection */}
        <div style={S.card}>
          <div style={S.cardTitle}>🐢 Latency Injection</div>
          <div style={S.toggleRow}>
            <div style={S.label}>Enable latency injection</div>
            <button style={{ ...S.toggle, background: config.latency_enabled ? '#d69e2e' : '#e2e8f0' }}
              onClick={() => setConfig((c) => ({ ...c, latency_enabled: !c.latency_enabled }))}>
              <span style={{ position: 'absolute', top: 3, left: config.latency_enabled ? 26 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s' }} />
            </button>
          </div>
          <div style={S.slider}>
            <span style={S.rangeLabel}>Latency (ms)</span>
            <input type="range" min={500} max={10000} step={500} value={config.latency_ms} style={S.range}
              onChange={(e) => setConfig((c) => ({ ...c, latency_ms: parseInt(e.target.value) }))} />
            <span style={S.value}>{config.latency_ms}ms</span>
          </div>
          <div style={S.toggleRow}>
            <span style={S.label}>Target service</span>
            <select value={config.target_service} onChange={(e) => setConfig((c) => ({ ...c, target_service: e.target.value }))}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
              <option value="all">All Services</option>
              <option value="product-service">product-service (Java)</option>
              <option value="order-service">order-service (Java)</option>
              <option value="user-service">user-service (Python)</option>
            </select>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={S.card}>
          <div style={S.cardTitle}>⚡ Quick Actions</div>
          <button style={{ ...S.btn, background: '#1a202c', color: '#fff' }} onClick={apply}>Apply Chaos Config</button>
          <button style={{ ...S.btn, background: '#e53e3e', color: '#fff' }} onClick={() => triggerError('product-service')}>Trigger NPE → Product Service</button>
          <button style={{ ...S.btn, background: '#dd6b20', color: '#fff' }} onClick={() => triggerError('order-service')}>Trigger Error → Order Service</button>
          <button style={{ ...S.btn, background: '#38a169', color: '#fff' }} onClick={reset}>Reset All — Restore Health</button>
        </div>

        {/* Current Status */}
        <div style={S.card}>
          <div style={S.cardTitle}>📊 Current Chaos State</div>
          {status ? (
            <div style={S.status}>
              {Object.entries(status).map(([k, v]) => (
                <div key={k} style={{ marginBottom: 4 }}>
                  <span style={{ color: '#718096' }}>{k}:</span>{' '}
                  <span style={{ color: typeof v === 'boolean' ? (v ? '#e53e3e' : '#38a169') : '#3182ce', fontWeight: 600 }}>{String(v)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#a0aec0', fontSize: 14 }}>Loading...</div>
          )}
          <div style={{ marginTop: 12, fontSize: 12, color: '#a0aec0' }}>
            💡 Enable errors then browse products or checkout to generate NR error traces
          </div>
        </div>
      </div>
    </div>
  );
}
