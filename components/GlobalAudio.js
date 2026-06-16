'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function GlobalAudio() {
  const audioRef = useRef(null);
  const pathname = usePathname();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (pathname.startsWith('/panel') || pathname.startsWith('/transmisja')) {
      audio.pause();
    }
  }, [pathname]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (pathname.startsWith('/panel') || pathname.startsWith('/transmisja')) {
      return;
    }
    audio.volume = 0.4;

    const dispatch = (playing) =>
      window.dispatchEvent(new CustomEvent('audio:state', { detail: { playing } }));

    // Próbuj zagrać od razu
    audio.play().then(() => dispatch(true)).catch(() => {
      const onInteraction = () => {
        audio.play().then(() => dispatch(true)).catch(() => {});
        ['click', 'keydown', 'touchstart'].forEach(e =>
          document.removeEventListener(e, onInteraction)
        );
      };
      ['click', 'keydown', 'touchstart'].forEach(e =>
        document.addEventListener(e, onInteraction, { once: true })
      );
    });

    const onToggle = () => {
      if (audio.paused) {
        audio.play().then(() => dispatch(true)).catch(() => {});
      } else {
        audio.pause();
        dispatch(false);
      }
    };

    window.addEventListener('audio:toggle', onToggle);
    return () => window.removeEventListener('audio:toggle', onToggle);
  }, []);

  return <audio ref={audioRef} src="/filipo.mp3" loop preload="none" />;
}
