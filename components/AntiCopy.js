"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AntiCopy() {
  const pathname = usePathname();
  const isProtected = !pathname?.startsWith("/panel") &&
                      !pathname?.startsWith("/admin") &&
                      !pathname?.startsWith("/login");

  useEffect(() => {
    if (!isProtected) return;

    // Blokuj prawy przycisk myszy
    const blockContextMenu = e => e.preventDefault();

    // Blokuj skróty klawiszowe do devtools i podglądu źródła
    const blockKeys = e => {
      // F12
      if (e.key === "F12") { e.preventDefault(); return; }
      // Ctrl+U (źródło), Ctrl+S (zapisz stronę)
      if (e.ctrlKey && !e.shiftKey && ["u", "s"].includes(e.key.toLowerCase())) {
        e.preventDefault(); return;
      }
      // Ctrl+Shift+I / J / C / K (narzędzia deweloperskie)
      if (e.ctrlKey && e.shiftKey && ["i", "j", "c", "k"].includes(e.key.toLowerCase())) {
        e.preventDefault(); return;
      }
    };

    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("keydown", blockKeys);

    return () => {
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("keydown", blockKeys);
    };
  }, [isProtected]);

  return null;
}
