import { useState, useRef, useEffect } from 'react';
import api from '../api/client.js';

const S = {
  fab: { position: 'fixed', bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 24, boxShadow: '0 4px 20px rgba(102,126,234,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' },
  window: { position: 'fixed', bottom: 90, right: 24, width: 360, height: 520, background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', zIndex: 999, overflow: 'hidden' },
  header: { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontWeight: 700, fontSize: 15 },
  headerSub: { fontSize: 11, opacity: 0.8 },
  providerBtns: { display: 'flex', gap: 4 },
  provBtn: { padding: '3px 8px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600 },
  messages: { flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, background: '#f8fafc' },
  msgUser: { alignSelf: 'flex-end', background: '#667eea', color: '#fff', borderRadius: '12px 12px 2px 12px', padding: '8px 12px', maxWidth: '80%', fontSize: 14, lineHeight: 1.5 },
  msgBot: { alignSelf: 'flex-start', background: '#fff', borderRadius: '12px 12px 12px 2px', padding: '8px 12px', maxWidth: '85%', fontSize: 14, lineHeight: 1.5, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', color: '#2d3748' },
  inputRow: { display: 'flex', gap: 8, padding: '12px 14px', borderTop: '1px solid #e2e8f0', background: '#fff' },
  input: { flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', resize: 'none' },
  sendBtn: { padding: '8px 14px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  typing: { display: 'flex', gap: 4, padding: '8px 12px', alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: '50%', background: '#a0aec0', animation: 'bounce 1s infinite' },
};

const WELCOME = "Hi! I'm ShopBot 🛒 I can help you find the perfect tech products, compare specs, and answer questions. What are you looking for today?";

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('claude');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const history = messages.slice(-10); // last 10 messages for context
      const resp = await api.post('/chat/', { message: userMsg, provider, history });
      setMessages((m) => [...m, { role: 'assistant', content: resp.data.response }]);
    } catch (err) {
      const errMsg = err.response?.status === 500
        ? 'AI service error — check that API keys are configured in your .env file'
        : `Error: ${err.message}`;
      setMessages((m) => [...m, { role: 'assistant', content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <>
      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} } .dot1{animation-delay:0s} .dot2{animation-delay:0.2s} .dot3{animation-delay:0.4s}`}</style>
      <button style={S.fab} onClick={() => setOpen((o) => !o)} title="Chat with ShopBot">{open ? '×' : '💬'}</button>
      {open && (
        <div style={S.window}>
          <div style={S.header}>
            <div>
              <div style={S.headerTitle}>ShopBot AI Assistant</div>
              <div style={S.headerSub}>Powered by {provider === 'claude' ? 'Claude (Anthropic)' : 'Gemini (Google)'} · NR AI Monitoring</div>
            </div>
            <div style={S.providerBtns}>
              <button style={{ ...S.provBtn, background: provider === 'claude' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', color: '#fff' }} onClick={() => setProvider('claude')}>Claude</button>
              <button style={{ ...S.provBtn, background: provider === 'gemini' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', color: '#fff' }} onClick={() => setProvider('gemini')}>Gemini</button>
            </div>
          </div>
          <div style={S.messages}>
            {messages.map((m, i) => (
              <div key={i} style={m.role === 'user' ? S.msgUser : S.msgBot}>{m.content}</div>
            ))}
            {loading && (
              <div style={{ ...S.msgBot, ...S.typing }}>
                {[1, 2, 3].map((n) => <span key={n} style={S.dot} className={`dot${n}`} />)}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div style={S.inputRow}>
            <textarea style={S.input} rows={1} placeholder="Ask about products..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} />
            <button style={S.sendBtn} onClick={send} disabled={loading}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
