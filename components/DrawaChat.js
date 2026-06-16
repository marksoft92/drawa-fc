'use client';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const MODELS = [
  { id: 'google/gemma-4-31b-it:free', label: 'Gemma 4 31B' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: 'Nemotron Ultra 550B' },
  { id: 'nex-agi/nex-n2-pro:free', label: 'Nex N2 Pro' },
  { id: 'openrouter/owl-alpha', label: 'Owl Alpha (wolny)' },
];

const IconChat = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

export default function DrawaChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState(MODELS[0].id);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Cześć! Pytaj o MKS Drawa — wyniki, zawodników, statystyki. Jestem na bieżąco z sezonem 2025/26 👋' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const history = [...messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0), userMsg];
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Błąd połączenia');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  content: next[next.length - 1].content + delta,
                };
                return next;
              });
            }
          } catch {}
        }
      }
    } catch (e) {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: e.message || 'Błąd połączenia' };
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      <style>{`
        .drawa-chat-panel {
          position: fixed;
          bottom: 80px;
          left: 20px;
          width: 340px;
          max-height: 520px;
          z-index: 200;
          display: flex;
          flex-direction: column;
          background: #0f172a;
          border: 1px solid rgba(59,130,246,0.25);
          border-radius: 16px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.08);
          overflow: hidden;
          animation: chat-slide-up 0.25s ease;
        }
        @keyframes chat-slide-up {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (max-width: 400px) {
          .drawa-chat-panel { left: 10px; right: 10px; width: auto; }
        }
        .drawa-chat-messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; min-height: 0; }
        .drawa-chat-messages::-webkit-scrollbar { width: 4px; }
        .drawa-chat-messages::-webkit-scrollbar-track { background: transparent; }
        .drawa-chat-messages::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 2px; }
        .msg-user { align-self: flex-end; background: #1d4ed8; color: #fff; border-radius: 12px 12px 3px 12px; padding: 8px 12px; font-size: 13px; max-width: 85%; line-height: 1.45; }
        .msg-assistant { align-self: flex-start; background: #1e293b; color: #e2e8f0; border-radius: 12px 12px 12px 3px; padding: 8px 12px; font-size: 13px; max-width: 90%; line-height: 1.55; white-space: pre-wrap; }
        .msg-cursor::after { content: '▋'; animation: blink 0.7s step-end infinite; color: #3b82f6; }
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>

      {/* W panelu: link do chatu (ukryty na /panel/chat); poza panelem: AI chat */}
      {pathname === '/panel/chat' ? null : pathname.startsWith('/panel') ? (
        <Link
          href="/panel/chat"
          aria-label="Przejdź do chatu drużyny"
          style={{
            position: 'fixed',
            bottom: 28,
            left: 24,
            zIndex: 200,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: '#0f172a',
            border: '1px solid rgba(59,130,246,0.3)',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            textDecoration: 'none',
          }}
        >
          <IconChat />
        </Link>
      ) : (
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Chat z asystentem Drawy"
          style={{
            position: 'fixed',
            bottom: 28,
            left: 24,
            zIndex: 200,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: open ? '#1d4ed8' : '#0f172a',
            border: `1px solid ${open ? 'rgba(59,130,246,0.6)' : 'rgba(59,130,246,0.3)'}`,
            color: '#3b82f6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            transition: 'background 0.2s, border-color 0.2s',
          }}
        >
          {open ? <IconClose /> : <IconChat />}
        </button>
      )}

      {/* Panel AI chatu (tylko poza panelem) */}
      {!pathname.startsWith('/panel') && open && (
        <div className="drawa-chat-panel">
          {/* Header */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <img src="/logo.png" alt="Drawa" width={28} height={28} style={{ objectFit: 'contain' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: '0.08em' }}>ASYSTENT DRAWY</div>
              <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.1em' }}>AI · Sezon 2025/26</div>
            </div>
            {/* Model selector */}
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#64748b', fontSize: 9, padding: '3px 6px', cursor: 'pointer', maxWidth: 110 }}
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Messages */}
          <div className="drawa-chat-messages">
            {messages.map((m, i) => {
              const isStreaming = loading && i === messages.length - 1 && m.role === 'assistant';
              return (
                <div
                  key={i}
                  className={`${m.role === 'user' ? 'msg-user' : 'msg-assistant'}${isStreaming && m.content === '' ? ' msg-cursor' : ''}`}
                >
                  {isStreaming && m.content === ''
                    ? <span style={{ color: '#475569', fontSize: 11 }}>Myślę…</span>
                    : m.content}
                  {isStreaming && m.content !== '' && <span className="msg-cursor" />}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, flexShrink: 0 }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Zapytaj o Drawę…"
              rows={1}
              disabled={loading}
              style={{
                flex: 1,
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                color: '#e2e8f0',
                fontSize: 13,
                padding: '7px 10px',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.4,
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                background: loading || !input.trim() ? 'rgba(59,130,246,0.1)' : 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                border: 'none',
                borderRadius: 8,
                color: loading || !input.trim() ? '#334155' : '#fff',
                width: 36,
                height: 36,
                cursor: loading || !input.trim() ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'background 0.2s, color 0.2s',
                alignSelf: 'flex-end',
              }}
            >
              <IconSend />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
