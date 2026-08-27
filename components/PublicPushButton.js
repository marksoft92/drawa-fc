"use client";

import { useState, useEffect } from "react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function PublicPushButton() {
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
        await fetch("/api/push/public", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        setSub(null);
        setStatus("off");
        return;
      }

      const res = await fetch("/api/push/public");
      const { publicKey } = await res.json();
      if (!publicKey) { setStatus("unsupported"); return; }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setStatus("denied"); return; }

      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch("/api/push/public", {
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

  if (status === "unsupported" || status === "loading") return null;

  const isOn = status === "on";
  const disabled = status === "working" || status === "denied";

  return (
    <button
      onClick={toggle}
      disabled={disabled}
      title={
        status === "denied"
          ? "Powiadomienia zablokowane w przeglądarce"
          : isOn
            ? "Wyłącz powiadomienia o golach i meczach"
            : "Włącz powiadomienia o golach i meczach"
      }
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 40,
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: isOn ? "rgba(34,197,94,0.15)" : "#0f172a",
        border: `1px solid ${isOn ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.12)"}`,
        color: isOn ? "#22c55e" : "#94a3b8",
        fontSize: 20,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {isOn ? "🔔" : "🔕"}
    </button>
  );
}
