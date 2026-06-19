import Link from "next/link";
import NavBar from "@/components/NavBar";

export const metadata = {
  title: "404 — Strona nie znaleziona",
  description: "Strona, której szukasz, nie istnieje. Wróć na stronę główną MKS Drawa Drawno.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <NavBar backLabel="Strona główna" />
      <main style={{
        minHeight: "100vh",
        background: "#030712",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 20px",
        textAlign: "center",
        fontFamily: "-apple-system, 'Segoe UI', sans-serif",
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', Impact, sans-serif",
          fontSize: "clamp(80px, 15vw, 160px)",
          color: "#1e293b",
          lineHeight: 1,
        }}>
          404
        </div>
        <h1 style={{
          fontFamily: "'Bebas Neue', Impact, sans-serif",
          fontSize: "clamp(20px, 4vw, 32px)",
          letterSpacing: "0.08em",
          color: "#fff",
          margin: "16px 0 12px",
        }}>
          Strona nie znaleziona
        </h1>
        <p style={{ fontSize: 14, color: "#475569", maxWidth: 400, lineHeight: 1.7, marginBottom: 40 }}>
          Strona, której szukasz, mogła zostać przeniesiona lub nie istnieje. Sprawdź poniższe linki.
        </p>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {[
            { href: "/", label: "Strona główna" },
            { href: "/aktualnosci", label: "Aktualności" },
            { href: "/statystyki", label: "Statystyki" },
            { href: "/archiwum", label: "Archiwum" },
            { href: "/wspolpraca", label: "Współpraca" },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding: "10px 22px",
                borderRadius: 8,
                border: "1px solid rgba(59,130,246,0.3)",
                color: "#3b82f6",
                fontSize: 12,
                letterSpacing: "0.12em",
                textDecoration: "none",
                fontWeight: 600,
                transition: "background 0.2s, border-color 0.2s",
              }}
            >
              {link.label.toUpperCase()}
            </Link>
          ))}
        </nav>
      </main>
    </>
  );
}
