"use client";
import NavBar from "@/components/NavBar";
import Link from "next/link";
import data from "@/lib/drawa_data_b_klasa_2025_2026";
import { computeTeamStats } from "@/lib/computeStats";

export default function ArchiwumPage() {
  const s = computeTeamStats(data.mecze);
  const row = data.tabela.find((r) => r.nazwa.toLowerCase().includes("drawa"));

  return (
    <>
      <NavBar backLabel="← Strona główna" />

      <div style={{ paddingTop: 64 }}>
        {/* Hero */}
        <div
          style={{
            padding: "60px 20px 40px",
            background: "#030712",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontFamily: "'Bebas Neue', Impact, sans-serif",
              fontSize: "clamp(36px, 7vw, 56px)",
              color: "#fff",
              letterSpacing: "0.1em",
              margin: 0,
            }}
          >
            ARCHIWUM SEZONÓW
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "#475569",
              marginTop: 8,
            }}
          >
            Historia wyników i statystyk MKS Drawa Drawno
          </p>
        </div>

        {/* Content */}
        <section
          style={{
            padding: "0 20px 80px",
            background: "#030712",
          }}
        >
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            {/* Season card 2025/26 */}
            <div
              style={{
                background: "#0f172a",
                border: "1px solid rgba(59,130,246,0.2)",
                borderLeft: "4px solid #3b82f6",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              }}
            >
              {/* Card header */}
              <div
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Bebas Neue', Impact, sans-serif",
                      fontSize: 22,
                      color: "#fff",
                      letterSpacing: "0.08em",
                    }}
                  >
                    SEZON 2025/26
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#475569",
                      marginTop: 4,
                    }}
                  >
                    Klasa B Zachodniopomorska IV
                  </div>
                </div>
                <div
                  style={{
                    background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    color: "#22c55e",
                    borderRadius: 20,
                    padding: "6px 14px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                  }}
                >
                  🏆 MISTRZOSTWO
                </div>
              </div>

              {/* Stats grid */}
              <div
                style={{
                  padding: 24,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                  gap: 16,
                }}
              >
                {[
                  { v: row?.pkt ?? s.wins * 3 + s.draws, l: "PKT" },
                  { v: s.total, l: "MECZÓW" },
                  { v: s.wins, l: "WYGRANYCH" },
                  { v: s.draws, l: "REMISÓW" },
                  { v: s.losses, l: "PORAŻEK" },
                  { v: `${s.golesFor}:${s.golesAgainst}`, l: "BRAMKI" },
                ].map(({ v, l }) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontFamily: "'Bebas Neue', Impact, sans-serif",
                        fontSize: 32,
                        color: "#3b82f6",
                        lineHeight: 1,
                      }}
                    >
                      {v}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: "#475569",
                        letterSpacing: "0.15em",
                        marginTop: 4,
                      }}
                    >
                      {l}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom row */}
              <div
                style={{
                  padding: "0 24px 20px",
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Największa wygrana: {s.biggestWin.score} z {s.biggestWin.opponent}
                </span>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Najskuteczniejszy: Jędrasik Waldemar (34 gole)
                </span>
              </div>
            </div>

            {/* Placeholder card */}
            <div
              style={{
                marginTop: 12,
                border: "1px dashed rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: 32,
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "#334155",
                  letterSpacing: "0.1em",
                }}
              >
                Poprzednie sezony wkrótce
              </span>
            </div>

            {/* Back link */}
            <div style={{ marginTop: 40, textAlign: "center" }}>
              <Link
                href="/"
                style={{
                  fontSize: 13,
                  color: "#3b82f6",
                  textDecoration: "none",
                  letterSpacing: "0.08em",
                  border: "1px solid rgba(59,130,246,0.3)",
                  borderRadius: 8,
                  padding: "10px 20px",
                  display: "inline-block",
                }}
              >
                ← Powrót na stronę główną
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
