"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "😡"];

function Avatar({ foto, initials, size = 32 }) {
  if (foto) {
    /* eslint-disable-next-line @next/next/no-img-element */
    return <img src={foto} alt={initials} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.1)" }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.4), fontWeight: 700, color: "#3b82f6", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "przed chwilą";
  if (diff < 3600) return `${Math.floor(diff / 60)} min temu`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

const iconBtn = {
  width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)", color: "#94a3b8", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};

export default function DMClient({ myId, otherId }) {
  const [conv, setConv] = useState(null); // { convId, other, messages }
  const [messages, setMessages] = useState([]);
  const [otherRead, setOtherRead] = useState(null); // ostatniaId przeczytana przez drugą stronę
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [picker, setPicker] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [uploading, setUploading] = useState(false);

  const bottomRef = useRef(null);
  const messagesRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const atBottomRef = useRef(true);
  const lastReadSentRef = useRef(null);

  const scrollToBottom = useCallback((force = false) => {
    if (force || atBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ładowanie historii
  useEffect(() => {
    fetch(`/api/panel/dm/${otherId}`)
      .then((r) => r.json())
      .then((d) => {
        setConv(d);
        setMessages(d.messages ?? []);
        setLoading(false);
        setTimeout(() => scrollToBottom(true), 50);
      })
      .catch(() => setLoading(false));
  }, [otherId, scrollToBottom]);

  // SSE
  useEffect(() => {
    let es;
    let retry;
    function connect() {
      es = new EventSource(`/api/panel/dm/${otherId}/stream`);
      es.onmessage = (e) => {
        const ev = JSON.parse(e.data);
        if (ev.type === "message") {
          setMessages((prev) => {
            if (prev.find((m) => m.id === ev.data.id)) return prev;
            return [...prev, ev.data];
          });
          setTimeout(() => scrollToBottom(), 30);
        }
        if (ev.type === "reakcja") {
          setMessages((prev) => prev.map((m) => m.id === ev.data.msgId ? { ...m, reakcje: ev.data.reakcje } : m));
        }
        if (ev.type === "delete") {
          setMessages((prev) => prev.map((m) => m.id === ev.data.msgId ? { ...m, usunieta: true, tresc: null, plik: null } : m));
        }
        if (ev.type === "odczytanie") {
          if (ev.data.userId !== myId) setOtherRead(ev.data.ostatniaId);
        }
      };
      es.onerror = () => { es.close(); retry = setTimeout(connect, 3000); };
    }
    connect();
    return () => { es?.close(); clearTimeout(retry); };
  }, [otherId, myId, scrollToBottom]);

  // mark as read gdy dolna wiadomość widoczna
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (!last || last.id === lastReadSentRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        lastReadSentRef.current = last.id;
        fetch(`/api/panel/dm/${otherId}/przeczytaj`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ msgId: last.id }),
        });
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [messages, otherId]);

  const onScroll = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  async function sendText(e) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const replyId = replyTo?.id ?? null;
    setReplyTo(null);
    setSending(true);
    try {
      await fetch(`/api/panel/dm/${otherId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tresc: text, replyToId: replyId }),
      });
      scrollToBottom(true);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function sendImage(file) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await fetch(`/api/panel/dm/${otherId}/zdjecie`, { method: "POST", body: fd });
      scrollToBottom(true);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function toggleReakcja(msgId, emoji) {
    setPicker(null);
    await fetch(`/api/panel/dm/${otherId}/reakcja`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ msgId, emoji }),
    });
  }

  async function deleteMsg(id) {
    if (!confirm("Usunąć wiadomość?")) return;
    await fetch(`/api/panel/dm/${otherId}/${id}`, { method: "DELETE" });
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); }
  }

  const grouped = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    const same = prev && prev.author.id === msg.author.id && !prev.usunieta && !msg.usunieta;
    const timeDiff = prev ? (new Date(msg.createdAt) - new Date(prev.createdAt)) / 60000 : 999;
    acc.push({ ...msg, grouped: same && timeDiff < 5 });
    return acc;
  }, []);

  const other = conv?.other;
  const online = other?.online;

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <div style={{ width: 28, height: 28, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 52px)", margin: "-24px -24px 0", overflow: "hidden" }}>
      {/* header */}
      <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, background: "#030712" }}>
        <Link href="/panel/dm" style={{ color: "#475569", display: "flex", alignItems: "center", textDecoration: "none", padding: "4px 6px", borderRadius: 6 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <Avatar foto={other?.foto} initials={other?.initials ?? "?"} size={36} />
          <span style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: online ? "#22c55e" : "#374151", border: "2px solid #030712" }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{other?.name ?? "..."}</div>
          <div style={{ fontSize: 11, color: online ? "#22c55e" : "#475569" }}>{online ? "online" : "offline"}</div>
        </div>
      </div>

      {/* messages */}
      <div ref={messagesRef} onScroll={onScroll} style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }} onClick={() => setPicker(null)}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#475569", fontSize: 14, marginTop: 60 }}>
            Wyślij pierwszą wiadomość do {other?.name} 👋
          </div>
        )}

        {grouped.map((msg, i) => {
          const isMe = msg.author.id === myId;
          const isLast = i === grouped.length - 1;
          const seenByOther = isMe && isLast && otherRead && msg.id === otherRead;
          const hasReakcje = Object.keys(msg.reakcje).length > 0;

          return (
            <div key={msg.id} style={{ marginBottom: msg.grouped ? 2 : 14 }}>
              {!msg.grouped && (
                <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 4, paddingLeft: isMe ? 0 : 44 }}>
                  <span style={{ fontSize: 11, color: "#334155" }}>
                    {!isMe && <strong style={{ color: "#64748b" }}>{msg.author.name} · </strong>}
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, flexDirection: isMe ? "row-reverse" : "row" }}>
                {!isMe && !msg.grouped && (
                  <div className="chat-avatar" style={{ flexShrink: 0 }}>
                    <Avatar foto={msg.author.foto} initials={msg.author.initials} size={32} />
                  </div>
                )}
                {!isMe && msg.grouped && <div className="chat-avatar-spacer" style={{ width: 32, flexShrink: 0 }} />}

                <div style={{ maxWidth: "72%", position: "relative" }}>
                  {msg.usunieta ? (
                    <div style={{ padding: "8px 14px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#334155", fontSize: 13, fontStyle: "italic" }}>
                      Wiadomość usunięta
                    </div>
                  ) : (
                    <div
                      onContextMenu={(e) => { e.preventDefault(); setPicker({ id: msg.id, x: e.clientX, y: e.clientY }); }}
                      style={{
                        padding: msg.typ === "image" && !msg.replyTo ? 4 : "9px 14px",
                        borderRadius: 16,
                        background: isMe ? "#2563eb" : "rgba(255,255,255,0.06)",
                        border: isMe ? "none" : "1px solid rgba(255,255,255,0.07)",
                        color: "#fff", fontSize: 14, lineHeight: 1.5,
                        cursor: "context-menu", wordBreak: "break-word", overflow: "hidden",
                      }}
                    >
                      {msg.replyTo && (
                        <div style={{ borderLeft: `3px solid ${isMe ? "rgba(255,255,255,0.35)" : "#3b82f6"}`, paddingLeft: 8, marginBottom: 6, background: isMe ? "rgba(0,0,0,0.12)" : "rgba(59,130,246,0.08)", borderRadius: "0 6px 6px 0", padding: "5px 8px" }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: isMe ? "rgba(255,255,255,0.7)" : "#3b82f6", marginBottom: 2 }}>{msg.replyTo.authorName}</div>
                          <div style={{ fontSize: 12, color: isMe ? "rgba(255,255,255,0.55)" : "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                            {msg.replyTo.usunieta ? "Wiadomość usunięta" : msg.replyTo.typ === "image" ? "📷 Zdjęcie" : msg.replyTo.tresc}
                          </div>
                        </div>
                      )}
                      {msg.typ === "image" ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setLightbox(msg.plik); }}
                          onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setLightbox(msg.plik); }}
                          style={{ background: "none", border: "none", padding: 0, cursor: "zoom-in", display: "block", WebkitTouchCallout: "none" }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={msg.plik} alt="zdjęcie" draggable={false} style={{ maxWidth: 240, maxHeight: 300, borderRadius: msg.replyTo ? 8 : 13, display: "block", pointerEvents: "none" }} />
                        </button>
                      ) : msg.tresc}
                    </div>
                  )}

                  {hasReakcje && !msg.usunieta && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                      {Object.entries(msg.reakcje).map(([emoji, { count, mine }]) => (
                        <button key={emoji} onClick={() => toggleReakcja(msg.id, emoji)} style={{ padding: "2px 7px", borderRadius: 10, fontSize: 12, cursor: "pointer", background: mine ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)", border: mine ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.1)", color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
                          {emoji} <span style={{ color: "#94a3b8", fontSize: 11 }}>{count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {!msg.usunieta && (
                    <div className="msg-actions" style={{ position: "absolute", top: -28, [isMe ? "left" : "right"]: 0, display: "none", alignItems: "center", gap: 4, background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "3px 6px" }}>
                      {EMOJI_LIST.map((e) => (
                        <button key={e} onClick={() => toggleReakcja(msg.id, e)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "0 2px", lineHeight: 1 }}>{e}</button>
                      ))}
                      {isMe && (
                        <button onClick={() => deleteMsg(msg.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#ef4444", padding: "0 4px" }}>✕</button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* seen by other */}
              {seenByOther && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 3, paddingRight: 4 }}>
                  <div title={`Widziane przez ${other?.name}`} style={{ width: 16, height: 16, borderRadius: "50%", overflow: "hidden", border: "1px solid rgba(34,197,94,0.4)" }}>
                    {other?.foto ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={other.foto} alt={other.initials} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#22c55e", fontWeight: 700 }}>
                        {other?.initials}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* context picker */}
      {picker && (
        <div onClick={(e) => e.stopPropagation()} style={{ position: "fixed", left: Math.min(picker.x, window.innerWidth - 280), top: Math.max(picker.y - 60, 8), zIndex: 200, background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: "6px 8px", display: "flex", flexDirection: "column", gap: 2, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", minWidth: 200 }}>
          <div style={{ display: "flex", gap: 2, padding: "2px 2px 6px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            {EMOJI_LIST.map((e) => (
              <button key={e} onClick={() => { toggleReakcja(picker.id, e); setPicker(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: "2px 4px", borderRadius: 8, lineHeight: 1 }}>{e}</button>
            ))}
          </div>
          <button onClick={() => {
            const msg = messages.find((m) => m.id === picker.id);
            if (msg) setReplyTo({ id: msg.id, authorName: msg.author.name, tresc: msg.tresc, typ: msg.typ, plik: msg.plik });
            setPicker(null);
            setTimeout(() => inputRef.current?.focus(), 50);
          }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#94a3b8", padding: "7px 10px", borderRadius: 8, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>↩️</span> Odpowiedz
          </button>
          {messages.find((m) => m.id === picker.id)?.author.id === myId && (
            <button onClick={() => { deleteMsg(picker.id); setPicker(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#ef4444", padding: "7px 10px", borderRadius: 8, textAlign: "left", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>🗑️</span> Usuń
            </button>
          )}
        </div>
      )}

      {/* reply bar */}
      {replyTo && (
        <div style={{ padding: "8px 14px", background: "rgba(59,130,246,0.06)", borderTop: "1px solid rgba(59,130,246,0.15)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 3, alignSelf: "stretch", background: "#3b82f6", borderRadius: 2, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600, marginBottom: 2 }}>{replyTo.authorName}</div>
            <div style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {replyTo.typ === "image" ? "📷 Zdjęcie" : replyTo.tresc ?? "Wiadomość usunięta"}
            </div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: "#475569", fontSize: 16, cursor: "pointer", padding: 4, flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* input */}
      <div className="chat-input-bar" style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "#030712", flexShrink: 0, display: "flex", alignItems: "flex-end", gap: 8 }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => sendImage(e.target.files?.[0])} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="chat-icon-btn" style={{ ...iconBtn, flexShrink: 0 }}>
          {uploading ? (
            <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
          )}
        </button>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
          onKeyDown={onKeyDown}
          placeholder={`Napisz do ${other?.name ?? ""}…`}
          rows={1}
          className="chat-textarea"
          style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "10px 16px", color: "#fff", fontSize: 14, resize: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto", fontFamily: "inherit", minWidth: 0 }}
        />
        <button onClick={sendText} disabled={!input.trim() || sending} className="chat-icon-btn" style={{ ...iconBtn, flexShrink: 0, background: input.trim() ? "#2563eb" : "rgba(255,255,255,0.04)", border: input.trim() ? "none" : "1px solid rgba(255,255,255,0.08)", opacity: sending ? 0.6 : 1 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
        .msg-wrap:hover .msg-actions { display: flex !important; }
        textarea:focus { outline: none; border-color: rgba(59,130,246,0.4) !important; }
        textarea::placeholder { color: #334155; }
        @media (max-width: 768px) {
          div[style*="height: calc(100vh - 52px)"] { margin: -16px -14px 0 !important; }
        }
        @media (max-width: 380px) {
          .chat-input-bar { padding: 6px !important; gap: 4px !important; }
          .chat-icon-btn { width: 34px !important; height: 34px !important; min-width: 34px !important; border-radius: 50% !important; }
          .chat-textarea { padding: 8px 10px !important; font-size: 13px !important; }
          .chat-avatar > img, .chat-avatar > div { width: 26px !important; height: 26px !important; }
          .chat-avatar-spacer { width: 26px !important; }
        }
      `}</style>

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(6px)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="powiększone" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12, objectFit: "contain", animation: "fadeIn 0.18s ease", boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }} />
          <button onClick={() => setLightbox(null)} style={{ position: "fixed", top: 16, right: 16, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
      )}
    </div>
  );
}
