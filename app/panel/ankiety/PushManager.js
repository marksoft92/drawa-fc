"use client";

import { useState, useEffect } from "react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function PushManager() {
  const [status, setStatus] = useState("loading"); // loading | unsupported | denied | off | on | working
  const [sub, setSub] = useState(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") { setStatus("denied"); return; }

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((s) => {
        setSub(s);
        setStatus(s ? "on" : "off");
      });
    });
  }, []);

  async function toggle() {
    setStatus("working");
    try {
      const reg = await navigator.serviceWorker.ready;

      if (sub) {
        await sub.unsubscribe();
        await fetch("/api/panel/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        setSub(null);
        setStatus("off");
        return;
      }

      const res = await fetch("/api/panel/push");
      const { publicKey } = await res.json();

      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }

      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch("/api/panel/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSub.toJSON()),
      });

      setSub(newSub);
      setStatus("on");
    } catch (err) {
      console.error(err);
      setStatus(sub ? "on" : "off");
    }
  }

  if (status === "unsupported") return null;

  const label = {
    loading: "...",
    denied: "Blokada powiadomień",
    off: "Powiadomienia",
    on: "Powiadomienia ON",
    working: "...",
  }[status] ?? "...";

  const isOn = status === "on";
  const disabled = status === "loading" || status === "working" || status === "denied";

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      title={isOn ? "Wyłącz powiadomienia push" : "Włącz powiadomienia push"}
      style={{
        padding: "8px 14px",
        background: isOn ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${isOn ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 8,
        color: isOn ? "#22c55e" : "#64748b",
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span style={{ fontSize: 14 }}>{isOn ? "🔔" : "🔕"}</span>
      {label}
    </button>
  );
}
