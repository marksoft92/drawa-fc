"use client";

import { useState, useEffect } from "react";
import NavBar from "@/components/NavBar";

const STORAGE_KEY = "koszyk_drawa";

function fmtPLN(grosze) { return (grosze / 100).toFixed(2) + " zł"; }

function readCart() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}
function writeCart(cart) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }

function totalStock(p) {
  const w = Array.isArray(p.warianty) ? p.warianty : [];
  if (w.length > 0) return w.reduce((s, v) => s + (v.stan || 0), 0);
  return p.stan || 0;
}

export default function SklepClient({ produkty, kategorie }) {
  const [cart, setCart] = useState([]);
  const [catFilter, setCatFilter] = useState("");
  const [modal, setModal] = useState(null);
  const [modalWariant, setModalWariant] = useState("");
  const [modalQty, setModalQty] = useState(1);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [orderForm, setOrderForm] = useState({ imie: "", email: "", telefon: "", ulica: "", kodPocztowy: "", miasto: "", uwagi: "" });
  const [sending, setSending] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [addedFeedback, setAddedFeedback] = useState(null);

  useEffect(() => { setCart(readCart()); }, []);
  function updateCart(newCart) { setCart(newCart); writeCart(newCart); }

  function addToCart(p, wariant, qty) {
    const c = [...cart];
    const idx = c.findIndex(i => i.produktId === p.id && i.wariant === (wariant || null));
    if (idx >= 0) { c[idx].ilosc += qty; } else {
      const imgs = Array.isArray(p.zdjecia) ? p.zdjecia : [];
      c.push({ produktId: p.id, nazwa: p.nazwa, wariant: wariant || null, cena: p.cena, ilosc: qty, zdjecie: imgs[0]?.src || null });
    }
    updateCart(c);
    setAddedFeedback(p.id);
    setTimeout(() => setAddedFeedback(null), 1200);
  }

  function removeFromCart(idx) { const c = [...cart]; c.splice(idx, 1); updateCart(c); }
  function setQty(idx, qty) { const c = [...cart]; c[idx].ilosc = Math.max(1, qty); updateCart(c); }
  const cartTotal = cart.reduce((s, i) => s + i.cena * i.ilosc, 0);
  const cartCount = cart.reduce((s, i) => s + i.ilosc, 0);

  function openModal(p) {
    const w = Array.isArray(p.warianty) ? p.warianty : [];
    setModal(p); setModalWariant(w.length > 0 ? w[0].nazwa : ""); setModalQty(1);
  }

  async function placeOrder(e) {
    e.preventDefault(); setSending(true); setOrderResult(null);
    try {
      const r = await fetch("/api/sklep/zamowienie", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...orderForm, pozycje: cart.map(i => ({ produktId: i.produktId, nazwa: i.nazwa, wariant: i.wariant, ilosc: i.ilosc })) }),
      });
      const d = await r.json();
      if (r.ok) { setOrderResult({ ok: true, numer: d.numer }); updateCart([]); }
      else setOrderResult({ ok: false, msg: d.error || "Błąd" });
    } catch { setOrderResult({ ok: false, msg: "Błąd połączenia" }); }
    setSending(false);
  }

  const filtered = catFilter ? produkty.filter(p => p.kategoria?.id === catFilter) : produkty;

  if (orderResult?.ok) return (
    <>
      <NavBar backLabel="Strona główna" />
      <div style={{ paddingTop: 80, textAlign: "center", maxWidth: 500, margin: "0 auto", padding: "80px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Zamówienie złożone!</div>
        <div style={{ fontSize: 15, color: "#94a3b8", marginBottom: 8 }}>Numer: <strong style={{ color: "#3b82f6" }}>{orderResult.numer}</strong></div>
        <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
          Potwierdzenie wysłaliśmy na podany email.<br />Skontaktujemy się w sprawie płatności i realizacji.
        </div>
        <button onClick={() => { setOrderResult(null); setCheckout(false); setCartOpen(false); }}
          style={{ marginTop: 24, padding: "10px 24px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Wróć do sklepu
        </button>
      </div>
    </>
  );

  return (
    <>
      <NavBar backLabel="Strona główna" />
      <div style={{ paddingTop: 64, minHeight: "100vh", background: "#030712" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>

          <div style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 10, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>&#9888;&#65039;</span>
            <div style={{ fontSize: 13, color: "#fbbf24", lineHeight: 1.5 }}>
              <strong>Strona testowa</strong> — sklep jest w trakcie przygotowania. Przeglądanie produktów możliwe, ale składanie zamówień jest tymczasowo wyłączone.
            </div>
          </div>

          <div style={{ fontSize: "clamp(22px,5vw,32px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <span>Sklep</span>
            <span style={{ fontSize: 14, fontWeight: 400, color: "#475569", letterSpacing: 0 }}>MKS Drawa Drawno</span>
          </div>

          {kategorie.length > 0 && (
            <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
              <button onClick={() => setCatFilter("")}
                style={{ padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  background: !catFilter ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                  color: !catFilter ? "#3b82f6" : "#64748b" }}>
                Wszystko
              </button>
              {kategorie.map(k => (
                <button key={k.id} onClick={() => setCatFilter(k.id)}
                  style={{ padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                    background: catFilter === k.id ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                    color: catFilter === k.id ? "#3b82f6" : "#64748b" }}>
                  {k.nazwa}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#475569", fontSize: 14 }}>Brak produktów w tej kategorii.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
              {filtered.map(p => {
                const imgs = Array.isArray(p.zdjecia) ? p.zdjecia : [];
                const outOfStock = totalStock(p) <= 0;
                return (
                  <div key={p.id} onClick={() => !outOfStock && openModal(p)}
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", cursor: outOfStock ? "default" : "pointer", transition: "border-color 0.15s", opacity: outOfStock ? 0.5 : 1 }}
                    onMouseEnter={e => { if (!outOfStock) e.currentTarget.style.borderColor = "rgba(59,130,246,0.3)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}>
                    <div style={{ aspectRatio: "1", background: "#0a0f1a", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      {imgs[0]
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={imgs[0].src} alt={p.nazwa} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ fontSize: 40, opacity: 0.15 }}>🛍</span>
                      }
                      {outOfStock && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", color: "#ef4444", fontSize: 13, fontWeight: 700 }}>Wyprzedane</div>}
                      {addedFeedback === p.id && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(34,197,94,0.8)", color: "#fff", fontSize: 14, fontWeight: 700, borderRadius: 12 }}>✓ Dodano</div>}
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nazwa}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: "#3b82f6" }}>{fmtPLN(p.cena)}</span>
                        {p.kategoria && <span style={{ fontSize: 10, color: "#475569" }}>{p.kategoria.nazwa}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal produktu */}
      {modal && (
        <div onClick={() => setModal(null)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#0f172a", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", maxWidth: 480, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
            {(() => {
              const imgs = Array.isArray(modal.zdjecia) ? modal.zdjecia : [];
              const warianty = Array.isArray(modal.warianty) ? modal.warianty : [];
              return (
                <>
                  {imgs.length > 0 && (
                    <div style={{ aspectRatio: "4/3", overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgs[0].src} alt={modal.nazwa} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                  {imgs.length > 1 && (
                    <div style={{ display: "flex", gap: 6, padding: "8px 16px", overflowX: "auto" }}>
                      {imgs.map((z, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={z.src} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }} />
                      ))}
                    </div>
                  )}
                  <div style={{ padding: "16px 20px 20px" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{modal.nazwa}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "#3b82f6", marginBottom: 12 }}>{fmtPLN(modal.cena)}</div>
                    {modal.opis && <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6, marginBottom: 16 }}>{modal.opis}</div>}
                    {warianty.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>ROZMIAR</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {warianty.map(w => (
                            <button key={w.nazwa} onClick={() => setModalWariant(w.nazwa)}
                              disabled={w.stan <= 0}
                              style={{ padding: "6px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: w.stan > 0 ? "pointer" : "default",
                                background: modalWariant === w.nazwa ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                                color: w.stan <= 0 ? "#334155" : modalWariant === w.nazwa ? "#3b82f6" : "#94a3b8",
                                border: `1px solid ${modalWariant === w.nazwa ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)"}`,
                                opacity: w.stan <= 0 ? 0.4 : 1 }}>
                              {w.nazwa}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, overflow: "hidden" }}>
                        <button onClick={() => setModalQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, background: "none", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer" }}>−</button>
                        <span style={{ width: 36, textAlign: "center", color: "#fff", fontSize: 14, fontWeight: 600 }}>{modalQty}</span>
                        <button onClick={() => setModalQty(q => q + 1)} style={{ width: 36, height: 36, background: "none", border: "none", color: "#94a3b8", fontSize: 18, cursor: "pointer" }}>+</button>
                      </div>
                      <button onClick={() => { addToCart(modal, modalWariant, modalQty); setModal(null); }}
                        style={{ flex: 1, padding: "10px 20px", background: "#3b82f6", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                        Dodaj do koszyka — {fmtPLN(modal.cena * modalQty)}
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
            <button onClick={() => setModal(null)} style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", color: "#fff", fontSize: 16, cursor: "pointer" }}>✕</button>
          </div>
        </div>
      )}

      {/* Floating cart button */}
      {cartCount > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)}
          style={{ position: "fixed", bottom: 24, right: 24, zIndex: 80, width: 56, height: 56, borderRadius: "50%", background: "#3b82f6", border: "none", cursor: "pointer", boxShadow: "0 4px 24px rgba(59,130,246,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span style={{ position: "absolute", top: -4, right: -4, minWidth: 22, height: 22, borderRadius: 11, background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{cartCount}</span>
        </button>
      )}

      {/* Cart panel */}
      {cartOpen && (
        <div onClick={() => { setCartOpen(false); setCheckout(false); }} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.6)" }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(420px,100vw)", background: "#0a0f1a", borderLeft: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", overflow: "auto" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>{checkout ? "Zamówienie" : "Koszyk"}</div>
              <button onClick={() => { setCartOpen(false); setCheckout(false); }} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            {!checkout ? (
              <>
                <div style={{ flex: 1, padding: "12px 16px", overflowY: "auto" }}>
                  {cart.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#475569", fontSize: 14 }}>Koszyk jest pusty</div>
                  ) : cart.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      {item.zdjecie
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={item.zdjecie} alt="" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} />
                        : <div style={{ width: 52, height: 52, background: "rgba(255,255,255,0.04)", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>🛍</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.nazwa}</div>
                        {item.wariant && <div style={{ fontSize: 11, color: "#475569" }}>{item.wariant}</div>}
                        <div style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600, marginTop: 2 }}>{fmtPLN(item.cena * item.ilosc)}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button onClick={() => setQty(i, item.ilosc - 1)} style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>−</button>
                        <span style={{ width: 24, textAlign: "center", fontSize: 13, color: "#fff" }}>{item.ilosc}</span>
                        <button onClick={() => setQty(i, item.ilosc + 1)} style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}>+</button>
                        <button onClick={() => removeFromCart(i)} style={{ width: 28, height: 28, borderRadius: 6, background: "none", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: "pointer", fontSize: 12, marginLeft: 4 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
                {cart.length > 0 && (
                  <div style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 16 }}>
                      <span style={{ color: "#94a3b8" }}>Razem:</span>
                      <span style={{ color: "#fff", fontWeight: 700 }}>{fmtPLN(cartTotal)}</span>
                    </div>
                    <button disabled
                      style={{ width: "100%", padding: "12px", background: "#1e293b", border: "none", borderRadius: 8, color: "#475569", fontSize: 15, fontWeight: 700, cursor: "not-allowed" }}>
                      Zamówienia tymczasowo wyłączone
                    </button>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={placeOrder} style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
                <Field label="Imię i nazwisko *" value={orderForm.imie} onChange={v => setOrderForm(p => ({ ...p, imie: v }))} required />
                <Field label="Email *" type="email" value={orderForm.email} onChange={v => setOrderForm(p => ({ ...p, email: v }))} required />
                <Field label="Telefon *" type="tel" value={orderForm.telefon} onChange={v => setOrderForm(p => ({ ...p, telefon: v }))} required />
                <Field label="Ulica i numer *" value={orderForm.ulica} onChange={v => setOrderForm(p => ({ ...p, ulica: v }))} required />
                <div style={{ display: "flex", gap: 10 }}>
                  <Field label="Kod pocztowy *" value={orderForm.kodPocztowy} onChange={v => setOrderForm(p => ({ ...p, kodPocztowy: v }))} required style={{ flex: 1 }} />
                  <Field label="Miasto *" value={orderForm.miasto} onChange={v => setOrderForm(p => ({ ...p, miasto: v }))} required style={{ flex: 2 }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>Uwagi</div>
                  <textarea value={orderForm.uwagi} onChange={e => setOrderForm(p => ({ ...p, uwagi: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#fff", fontSize: 13, resize: "vertical", minHeight: 60 }}
                    placeholder="Dodatkowe informacje..." />
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: 12, fontSize: 13, color: "#94a3b8" }}>
                  <div style={{ marginBottom: 6, fontWeight: 600, color: "#64748b", fontSize: 11 }}>PODSUMOWANIE</div>
                  {cart.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                      <span>{item.nazwa}{item.wariant ? ` (${item.wariant})` : ""} ×{item.ilosc}</span>
                      <span>{fmtPLN(item.cena * item.ilosc)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 6, paddingTop: 6, fontWeight: 700, color: "#fff" }}>
                    <span>Razem</span><span>{fmtPLN(cartTotal)}</span>
                  </div>
                </div>
                {orderResult && !orderResult.ok && <div style={{ fontSize: 13, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "9px 13px" }}>{orderResult.msg}</div>}
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="button" onClick={() => setCheckout(false)} style={{ padding: "10px 18px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer" }}>← Koszyk</button>
                  <button type="submit" disabled={sending} style={{ flex: 1, padding: "12px", background: sending ? "#1e293b" : "#22c55e", border: "none", borderRadius: 8, color: "#fff", fontSize: 15, fontWeight: 700, cursor: sending ? "wait" : "pointer" }}>
                    {sending ? "Składanie zamówienia..." : "Złóż zamówienie"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        input:focus,textarea:focus{outline:none;border-color:rgba(59,130,246,0.5)!important}
        input::placeholder,textarea::placeholder{color:#334155}
      `}</style>
    </>
  );
}

function Field({ label, value, onChange, type = "text", required, style }) {
  return (
    <div style={style}>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required}
        style={{ width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#fff", fontSize: 13, boxSizing: "border-box" }} />
    </div>
  );
}
