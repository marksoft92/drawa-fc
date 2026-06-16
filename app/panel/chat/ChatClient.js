"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "😡"];

function Avatar({ foto, initials, size = 32, color = "#3b82f6" }) {
  if (foto) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img src={foto} alt={initials} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", objectPosition: "top", flexShrink: 0, border: "1.5px solid rgba(255,255,255,0.1)" }} />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `rgba(${color === "#3b82f6" ? "59,130,246" : "100,116,139"},0.15)`, border: `1px solid rgba(${color === "#3b82f6" ? "59,130,246" : "100,116,139"},0.25)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.4), fontWeight: 700, color, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function ChatClient({ myId, myName, isAdmin }) {
  const [messages, setMessages] = useState([]);
  const [odczytania, setOdczytania] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [picker, setPicker] = useState(null); // { id, x, y }
  const [lightbox, setLightbox] = useState(null); // url
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef(null);
  const messagesRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const atBottomRef = useRef(true);
  const lastReadSentRef = useRef(null);

  const scrollToBottom = useCallback((force = false) => {
    if (force || atBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // ładowanie historii
  useEffect(() => {
    fetch("/api/panel/chat")
      .then((r) => r.json())
      .then(({ messages: msgs, odczytania: od }) => {
        setMessages(msgs ?? []);
        setOdczytania(od ?? []);
        setLoading(false);
        setTimeout(() => scrollToBottom(true), 50);
      });
  }, [scrollToBottom]);

  // SSE
  useEffect(() => {
    let es;
    let retry;

    function connect() {
      es = new EventSource("/api/panel/chat/stream");

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
          setMessages((prev) =>
            prev.map((m) => m.id === ev.wiadId ? { ...m, reakcje: ev.reakcje } : m)
          );
        }

        if (ev.type === "delete") {
          setMessages((prev) =>
            prev.map((m) => m.id === ev.id ? { ...m, usunieta: true, tresc: null, plik: null } : m)
          );
        }

        if (ev.type === "odczytanie") {
          setOdczytania((prev) => {
            const next = prev.filter((o) => o.userId !== ev.userId);
            next.push({ userId: ev.userId, name: ev.name, initials: ev.initials, foto: ev.foto ?? null, ostatniaId: ev.ostatniaId });
            return next;
          });
        }
      };

      es.onerror = () => {
        es.close();
        retry = setTimeout(connect, 3000);
      };
    }

    connect();
    return () => { es?.close(); clearTimeout(retry); };
  }, [scrollToBottom]);

  // markowanie przeczytanych
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (!last || last.id === lastReadSentRef.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        lastReadSentRef.current = last.id;
        fetch("/api/panel/chat/przeczytaj", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wiadId: last.id }),
        });
        observer.disconnect();
      }
    }, { threshold: 0.5 });

    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [messages]);

  // scroll detection
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
    setSending(true);
    try {
      await fetch("/api/panel/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tresc: text }),
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
      await fetch("/api/panel/chat/zdjecie", { method: "POST", body: fd });
      scrollToBottom(true);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function toggleReakcja(wiadId, emoji) {
    setPicker(null);
    await fetch("/api/panel/chat/reakcja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wiadId, emoji }),
    });
  }

  async function deleteMsg(id) {
    if (!confirm("Usunąć wiadomość?")) return;
    await fetch("/api/panel/chat/" + id, { method: "DELETE" });
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  }

  // grupowanie wiadomości
  const grouped = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    const sameAuthor = prev && prev.author.id === msg.author.id && !prev.usunieta && !msg.usunieta;
    const timeDiff = prev ? (new Date(msg.createdAt) - new Date(prev.createdAt)) / 1000 / 60 : 999;
    const grouped = sameAuthor && timeDiff < 5;
    acc.push({ ...msg, grouped });
    return acc;
  }, []);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <div style={{ width: 28, height: 28, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 52px)", margin: "-24px -24px 0", overflow: "hidden" }}>
      {/* header */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0, background: "#030712" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Drużyna</div>
          <div style={{ fontSize: 11, color: "#475569" }}>czat wewnętrzny</div>
        </div>
      </div>

      {/* messages */}
      <div ref={messagesRef} onScroll={onScroll} style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}
        onClick={() => setPicker(null)}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#475569", fontSize: 14, marginTop: 60 }}>
            Bądź pierwszy — napisz coś do drużyny 👋
          </div>
        )}

        {grouped.map((msg, i) => {
          const isMe = msg.author.id === myId;
          const isLast = i === grouped.length - 1;
          const seenBy = odczytania.filter((o) => o.userId !== myId && o.ostatniaId === msg.id);
          const canDelete = isMe || isAdmin;
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
                  <div className="chat-avatar" style={{ flexShrink: 0, display: "flex" }}>
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
                        padding: msg.typ === "image" ? 4 : "9px 14px",
                        borderRadius: 16,
                        background: isMe ? "#2563eb" : "rgba(255,255,255,0.06)",
                        border: isMe ? "none" : "1px solid rgba(255,255,255,0.07)",
                        color: "#fff",
                        fontSize: 14,
                        lineHeight: 1.5,
                        cursor: "context-menu",
                        wordBreak: "break-word",
                      }}
                    >
                      {msg.typ === "image" ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setLightbox(msg.plik); }}
                          onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); setLightbox(msg.plik); }}
                          style={{ background: "none", border: "none", padding: 0, cursor: "zoom-in", display: "block", WebkitTouchCallout: "none" }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={msg.plik} alt="zdjęcie" draggable={false} style={{ maxWidth: 260, maxHeight: 320, borderRadius: 13, display: "block", pointerEvents: "none" }} />
                        </button>
                      ) : (
                        msg.tresc
                      )}
                    </div>
                  )}

                  {/* reakcje */}
                  {hasReakcje && !msg.usunieta && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4, justifyContent: isMe ? "flex-end" : "flex-start" }}>
                      {Object.entries(msg.reakcje).map(([emoji, { count, mine }]) => (
                        <button key={emoji} onClick={() => toggleReakcja(msg.id, emoji)} style={{
                          padding: "2px 7px", borderRadius: 10, fontSize: 12, cursor: "pointer",
                          background: mine ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
                          border: mine ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.1)",
                          color: "#fff", display: "flex", alignItems: "center", gap: 4,
                        }}>
                          {emoji} <span style={{ color: "#94a3b8", fontSize: 11 }}>{count}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* szybka reakcja + usuń */}
                  {!msg.usunieta && (
                    <div className="msg-actions" style={{
                      position: "absolute", top: -28, [isMe ? "left" : "right"]: 0,
                      display: "none", alignItems: "center", gap: 4, background: "#0f172a",
                      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "3px 6px",
                    }}>
                      {EMOJI_LIST.map((e) => (
                        <button key={e} onClick={() => toggleReakcja(msg.id, e)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "0 2px", lineHeight: 1 }}>
                          {e}
                        </button>
                      ))}
                      {canDelete && (
                        <button onClick={() => deleteMsg(msg.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#ef4444", padding: "0 4px" }}>✕</button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* seen */}
              {isLast && seenBy.length > 0 && (
                <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", gap: 3, marginTop: 4, paddingRight: isMe ? 4 : 0, paddingLeft: isMe ? 0 : 44 }}>
                  {seenBy.slice(0, 5).map((o) => (
                    <div key={o.userId} title={`Widziane przez ${o.name}`} style={{ width: 16, height: 16, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(34,197,94,0.3)" }}>
                      {o.foto ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={o.foto} alt={o.initials} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "rgba(34,197,94,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#22c55e", fontWeight: 700 }}>
                          {o.initials}
                        </div>
                      )}
                    </div>
                  ))}
                  {seenBy.length > 5 && <span style={{ fontSize: 10, color: "#475569" }}>+{seenBy.length - 5}</span>}
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* context picker */}
      {picker && (
        <div onClick={(e) => e.stopPropagation()} style={{
          position: "fixed", left: picker.x, top: picker.y, zIndex: 200,
          background: "#0f172a", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16,
          padding: "6px 8px", display: "flex", gap: 4,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          {EMOJI_LIST.map((e) => (
            <button key={e} onClick={() => toggleReakcja(picker.id, e)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: "2px 4px", borderRadius: 8, lineHeight: 1 }}>
              {e}
            </button>
          ))}
          {(messages.find((m) => m.id === picker.id)?.author.id === myId || isAdmin) && (
            <button onClick={() => { deleteMsg(picker.id); setPicker(null); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#ef4444", padding: "2px 8px", borderRadius: 8 }}>
              Usuń
            </button>
          )}
        </div>
      )}

      {/* input */}
      <div className="chat-input-bar" style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "#030712", flexShrink: 0, display: "flex", alignItems: "flex-end", gap: 8 }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => sendImage(e.target.files?.[0])}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="Wyślij zdjęcie"
          className="chat-icon-btn"
          style={{ ...iconBtn, flexShrink: 0 }}
        >
          {uploading ? (
            <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21,15 16,10 5,21" />
            </svg>
          )}
        </button>

        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
          onKeyDown={onKeyDown}
          placeholder="Napisz wiadomość…"
          rows={1}
          className="chat-textarea"
          style={{
            flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 20, padding: "10px 16px", color: "#fff", fontSize: 14, resize: "none",
            lineHeight: 1.5, maxHeight: 120, overflowY: "auto", fontFamily: "inherit", minWidth: 0,
          }}
        />

        <button onClick={sendText} disabled={!input.trim() || sending} className="chat-icon-btn" style={{
          ...iconBtn, flexShrink: 0,
          background: input.trim() ? "#2563eb" : "rgba(255,255,255,0.04)",
          border: input.trim() ? "none" : "1px solid rgba(255,255,255,0.08)",
          opacity: sending ? 0.6 : 1,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22,2 15,22 11,13 2,9" />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
        div[style*="flexDirection: column"] { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
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
          .chat-avatar > img,
          .chat-avatar > div { width: 26px !important; height: 26px !important; min-width: 26px !important; font-size: 10px !important; }
          .chat-avatar-spacer { width: 26px !important; min-width: 26px !important; }
        }
      `}</style>

      {/* lightbox */}
      {lightbox && <Lightbox url={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

function Lightbox({ url, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backdropFilter: "blur(6px)" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="powiększone zdjęcie"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 12, objectFit: "contain", animation: "fadeIn 0.18s ease", boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}
      />
      <button
        onClick={onClose}
        style={{ position: "fixed", top: 16, right: 16, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
      >
        ✕
      </button>
      <a
        href={url}
        download
        onClick={(e) => e.stopPropagation()}
        style={{ position: "fixed", top: 16, right: 64, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", textDecoration: "none" }}
        title="Pobierz"
      >
        ↓
      </a>
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
