"use client";

import { useRef, useState } from "react";

export function AudioPlayer({ url, volume, loop }: { url: string; volume: number; loop: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.volume = volume;
      audio.play().catch(() => {
        // Navegador bloqueou por política de autoplay — o botão simplesmente não muda de estado.
      });
      setPlaying(true);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-10">
      <audio ref={audioRef} src={url} loop={loop} />
      <button
        type="button"
        onClick={toggle}
        className="bg-white/90 backdrop-blur border border-slate-200 rounded-full px-4 py-2 text-xs font-medium shadow-sm hover:bg-white"
      >
        {playing ? "🔊 Pausar música" : "🔈 Ativar música"}
      </button>
    </div>
  );
}
