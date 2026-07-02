"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { exerciseLabel, formatExerciseWhen, formatDuration, formatDay, formatSleep } from "@/lib/health-format";

function usePaginatedList(userId, endpoint, itemsKey, enabled) {
  const [player, setPlayer] = useState(null);
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const loadPage = useCallback(async (before) => {
    const url = before
      ? `/api/admin/gracze/${userId}/${endpoint}?before=${encodeURIComponent(before)}`
      : `/api/admin/gracze/${userId}/${endpoint}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error();
    return r.json();
  }, [userId, endpoint]);

  useEffect(() => {
    if (!enabled || loaded || error) return;
    let cancelled = false;
    loadPage(null)
      .then((d) => {
        if (cancelled) return;
        setPlayer(d.player ?? null);
        setItems(d[itemsKey] ?? []);
        setNextCursor(d.nextCursor ?? null);
        setLoaded(true);
      })
      .catch(() => { if (!cancelled) setError("Błąd połączenia"); });
    return () => { cancelled = true; };
  }, [enabled, loaded, error, loadPage, itemsKey]);

  const loading = enabled && !loaded && !error;

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const d = await loadPage(nextCursor);
      setItems((prev) => [...prev, ...(d[itemsKey] ?? [])]);
      setNextCursor(d.nextCursor ?? null);
    } catch {
      setError("Błąd połączenia");
    } finally {
      setLoadingMore(false);
    }
  }

  return { player, items, nextCursor, loading, loadingMore, error, loaded, loadMore };
}

export default function HistoriaClient({ userId }) {
  const [tab, setTab] = useState("treningi");
  const exercisesState = usePaginatedList(userId, "exercises", "exercises", tab === "treningi");
  const dailyState = usePaginatedList(userId, "daily", "days", tab === "dni");

  const player = exercisesState.player ?? dailyState.player;

  return (
    <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ marginBottom: 8 }}>
        <Link href="/panel/gracze" style={{ fontSize: 12, color: "#64748b" }}>← Wróć do listy graczy</Link>
        <div style={{ fontSize: "clamp(20px,4vw,28px)", fontFamily: "'Bebas Neue',Impact,sans-serif", letterSpacing: "0.1em", color: "#fff", marginTop: 6 }}>
          {player ? player.imieNazwisko : "Historia z bandu"}
        </div>
        {player && (
          <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
            {[player.pozycja, player.numer != null ? `#${player.numer}` : null].filter(Boolean).join(" · ") || "Historia z bandu"}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setTab("treningi")} style={tab === "treningi" ? tabActive : tabInactive}>Treningi</button>
        <button onClick={() => setTab("dni")} style={tab === "dni" ? tabActive : tabInactive}>Dni (kroki, kalorie, sen)</button>
      </div>

      {tab === "treningi" && (
        <List state={exercisesState}>
          {exercisesState.items.map((ex) => (
            <div key={ex.id} style={{ ...card, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", fontSize: 13, color: "#94a3b8" }}>
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
        </List>
      )}

      {tab === "dni" && (
        <List state={dailyState} empty="Brak zapisanych dni.">
          {dailyState.items.map((d) => {
            const sleep = formatSleep(d.sleepMinutes);
            return (
              <div key={d.id} style={{ ...card, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", fontSize: 13, color: "#94a3b8" }}>
                <span style={{ color: "#fff", fontWeight: 600, textTransform: "capitalize" }}>{formatDay(d.date)}</span>
                <span>kroki: <strong style={{ color: "#fff" }}>{d.steps}</strong></span>
                <span>kalorie: <strong style={{ color: "#fff" }}>{Math.round(d.activeCalories)}</strong></span>
                {d.distanceMeters > 0 && (
                  <span>dystans: <strong style={{ color: "#fff" }}>{(d.distanceMeters / 1000).toFixed(2)}</strong> km</span>
                )}
                {d.heartRateAvg != null && (
                  <span>śr. tętno: <strong style={{ color: "#fff" }}>{Math.round(d.heartRateAvg)}</strong> bpm</span>
                )}
                {d.heartRateMax != null && (
                  <span>maks: <strong style={{ color: "#fff" }}>{Math.round(d.heartRateMax)}</strong> bpm</span>
                )}
                {sleep && <span>sen: <strong style={{ color: "#fff" }}>{sleep}</strong></span>}
              </div>
            );
          })}
        </List>
      )}
    </div>
  );
}

function List({ state, empty = "Brak zarejestrowanych treningów.", children }) {
  if (state.error) return <span style={{ fontSize: 13, color: "#ef4444" }}>{state.error}</span>;
  if (state.loading) return <span style={{ fontSize: 13, color: "#64748b" }}>Ładowanie...</span>;
  if (state.items.length === 0) return <span style={{ fontSize: 13, color: "#64748b" }}>{empty}</span>;
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
      {state.nextCursor && (
        <button onClick={state.loadMore} disabled={state.loadingMore} style={btnGhost}>
          {state.loadingMore ? "Ładowanie..." : "Załaduj więcej"}
        </button>
      )}
    </>
  );
}

const card = { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 16px" };
const btnGhost = { padding: "9px 14px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer", alignSelf: "flex-start" };
const tabActive = { padding: "7px 14px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)", borderRadius: 7, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" };
const tabInactive = { padding: "7px 14px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "#64748b", fontSize: 12, cursor: "pointer" };
