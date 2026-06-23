"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import NavBar from "@/components/NavBar";

const SectionLabel = ({ children }) => (
  <h2 style={{ display: "flex", alignItems: "center", gap: 12, margin: 0 }}>
    <div style={{ width: 4, height: 24, background: "#3b82f6", borderRadius: 2 }} />
    <span style={{ fontSize: "clamp(20px, 4vw, 28px)", fontFamily: "'Bebas Neue', Impact, sans-serif", letterSpacing: "0.1em", color: "#fff", fontWeight: "normal" }}>{children}</span>
  </h2>
);

function fmtDate(d) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return ""; }
}

function ClubSelect({ zrodla, filter, onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const selected = zrodla.find(z => z.id === filter);
  const results = search
    ? zrodla.filter(z => z.nazwa.toLowerCase().includes(search.toLowerCase()))
    : zrodla;

  return (
    <div ref={ref} style={{ position: "relative", minWidth: 220 }}>
      <button
        onClick={() => { setOpen(o => !o); setSearch(""); }}
        style={{
          width: "100%", padding: "9px 14px", borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)",
          color: selected ? "#e2e8f0" : "#64748b", fontSize: 13, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8, textAlign: "left",
        }}
      >
        {selected?.herb && <img src={selected.herb} alt="" style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} />}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.nazwa : "Wszystkie kluby"}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
          background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)", overflow: "hidden", maxHeight: 320,
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Szukaj klubu..."
              style={{
                width: "100%", padding: "8px 10px", background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8,
                color: "#fff", fontSize: 13, outline: "none",
              }}
            />
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            <button
              onClick={() => { onSelect(""); setOpen(false); }}
              style={{
                width: "100%", padding: "10px 14px", border: "none", cursor: "pointer", textAlign: "left",
                background: !filter ? "rgba(59,130,246,0.1)" : "transparent",
                color: !filter ? "#3b82f6" : "#94a3b8", fontSize: 13, fontWeight: !filter ? 600 : 400,
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              Wszystkie kluby
            </button>
            {results.map(z => (
              <button
                key={z.id}
                onClick={() => { onSelect(z.id); setOpen(false); }}
                style={{
                  width: "100%", padding: "10px 14px", border: "none", cursor: "pointer", textAlign: "left",
                  background: filter === z.id ? "rgba(59,130,246,0.1)" : "transparent",
                  color: filter === z.id ? "#3b82f6" : "#cbd5e1", fontSize: 13,
                  fontWeight: filter === z.id ? 600 : 400,
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                {z.herb && <img src={z.herb} alt="" style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} />}
                {z.nazwa}
              </button>
            ))}
            {results.length === 0 && (
              <div style={{ padding: "16px 14px", color: "#475569", fontSize: 13, textAlign: "center" }}>
                Nie znaleziono
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const PER_PAGE = 24;

export default function PilkaLokalnaClient({ wpisy, zrodla }) {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const filtered = filter ? wpisy.filter(w => w.zrodloId === filter) : wpisy;
  const visible = filtered.slice(0, page * PER_PAGE);
  const hasMore = visible.length < filtered.length;

  const handleFilter = (id) => { setFilter(id); setPage(1); };

  return (
    <>
      <NavBar backLabel="Strona główna" />
      <div style={{ paddingTop: 64 }}>
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 16px 80px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <SectionLabel>Piłka lokalna</SectionLabel>
            {zrodla.length > 1 && (
              <ClubSelect zrodla={zrodla} filter={filter} onSelect={handleFilter} />
            )}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>
              <div style={{ fontSize: 15, marginBottom: 8 }}>Brak wpisów{filter ? " dla tego źródła" : ""}.</div>
              <div style={{ fontSize: 13 }}>Wróć wkrótce — agregujemy najnowsze wiadomości z klubów ligowych.</div>
            </div>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 20,
          }}>
            {visible.map(w => (
              <Link
                key={w.id}
                href={`/pilka-lokalna/${w.slug}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <article style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  overflow: "hidden",
                  transition: "border-color 0.2s, transform 0.2s",
                  cursor: "pointer",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; }}
                >
                  {w.miniaturka && (
                    <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
                      <img src={w.miniaturka} alt={w.tytul} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      {w.zrodlo?.herb && (
                        <img src={w.zrodlo.herb} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
                      )}
                      <span style={{ fontSize: 11, color: "#3b82f6", fontWeight: 600 }}>{w.zrodlo?.nazwa}</span>
                      <span style={{ fontSize: 11, color: "#334155" }}>·</span>
                      <span style={{ fontSize: 11, color: "#475569" }}>{fmtDate(w.dataPostu || w.createdAt)}</span>
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.4, marginBottom: 8 }}>
                      {w.tytul}
                    </h3>
                    <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {w.tresc.slice(0, 200)}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <button
                onClick={() => setPage(p => p + 1)}
                style={{
                  padding: "12px 32px", borderRadius: 10, border: "1px solid rgba(59,130,246,0.3)",
                  background: "rgba(59,130,246,0.08)", color: "#3b82f6", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", letterSpacing: "0.03em",
                }}
              >
                Pokaż więcej ({filtered.length - visible.length})
              </button>
            </div>
          )}

          {filtered.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#334155" }}>
              {visible.length} z {filtered.length} wpisów
            </div>
          )}
        </section>
      </div>
    </>
  );
}
