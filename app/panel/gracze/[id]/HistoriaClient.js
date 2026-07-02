"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { exerciseLabel, formatExerciseWhen, formatDuration } from "@/lib/health-format";

export default function HistoriaClient({ userId }) {
  const [player, setPlayer] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadPage = useCallback(async (before) => {
    const url = before
      ? `/api/admin/gracze/${userId}/exercises?before=${encodeURIComponent(before)}`
      : `/api/admin/gracze/${userId}/exercises`;
    const r = await fetch(url);
    if (!r.ok) throw new Error();
    return r.json();
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    loadPage(null)
      .then((d) => {
        if (cancelled) return;
        setPlayer(d.player ?? null);
        setExercises(d.exercises ?? []);
        setNextCursor(d.nextCursor ?? null);
      })
      .catch(() => { if (!cancelled) setError("Błąd połączenia"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loadPage]);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const d = await loadPage(nextCursor);
      setExercises((prev) => [...prev, ...(d.exercises ?? [])]);
      setNextCursor(d.nextCursor ?? null);
    } catch {
      setError("Błąd połączenia");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <Link href="/panel/gracze" style={{ fontSize: 12, color: "#64748b" }}>← Wróć do listy graczy</Link>
        <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff", marginTop: 6 }}>
          {player ? player.imieNazwisko : "Historia treningów"}
        </div>
        {player && (
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
            {[player.pozycja, player.numer != null ? `#${player.numer}` : null].filter(Boolean).join(" · ") || "Historia treningów z bandu"}
          </div>
        )}
      </div>

      {loading ? (
        <span style={{ fontSize: 13, color: "#64748b" }}>Ładowanie...</span>
      ) : error ? (
        <span style={{ fontSize: 13, color: "#ef4444" }}>{error}</span>
      ) : exercises.length === 0 ? (
        <span style={{ fontSize: 13, color: "#64748b" }}>Brak zarejestrowanych treningów.</span>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {exercises.map((ex) => (
              <div
                key={ex.id}
                style={{ ...card, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", fontSize: 13, color: "#94a3b8" }}
              >
                <span style={{ color: "#fff", fontWeight: 600 }}>{exerciseLabel(ex.exerciseType)}</span>
                <span>{formatExerciseWhen(ex.startTime)}</span>
                <span>{formatDuration(ex.durationSeconds)}</span>
                {ex.heartRateAvg != null && (
                  <span>śr. tętno: <strong style={{ color: "#fff" }}>{Math.round(ex.heartRateAvg)}</strong> bpm</span>
                )}
                {ex.heartRateMax != null && (
                  <span>maks: <strong style={{ color: "#fff" }}>{Math.round(ex.heartRateMax)}</strong> bpm</span>
                )}
                {ex.heartRateMin != null && (
                  <span>min: <strong style={{ color: "#fff" }}>{Math.round(ex.heartRateMin)}</strong> bpm</span>
                )}
              </div>
            ))}
          </div>

          {nextCursor && (
            <button onClick={loadMore} disabled={loadingMore} style={btnGhost}>
              {loadingMore ? "Ładowanie..." : "Załaduj więcej"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 16px" };
const btnGhost = { padding: "9px 14px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer", alignSelf: "flex-start" };
