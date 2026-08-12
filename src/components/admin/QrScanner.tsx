"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { checkInParticipant } from "@/server/participants/actions";

type Feedback = { type: "success" | "duplicate" | "error"; message: string } | null;

export function QrScanner({ eventId }: { eventId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const busyRef = useRef(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (!mounted || !containerRef.current) return;

      const scanner = new Html5Qrcode(containerRef.current.id);
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 240 },
          async (decodedText: string) => {
            if (busyRef.current) return;
            busyRef.current = true;

            const result = await checkInParticipant(eventId, decodedText);
            if (result.success) {
              setFeedback({
                type: result.alreadyCheckedIn ? "duplicate" : "success",
                message: result.alreadyCheckedIn
                  ? `${result.label} já estava com check-in feito.`
                  : `${result.label} — check-in confirmado!`,
              });
              if (!result.alreadyCheckedIn) setCount((c) => c + 1);
            } else {
              setFeedback({ type: "error", message: result.error });
            }

            setTimeout(() => {
              busyRef.current = false;
              setFeedback(null);
            }, 2000);
          },
          undefined
        )
        .catch((err: unknown) => {
          setCameraError(
            "Não foi possível acessar a câmera. Verifique as permissões do navegador."
          );
        });
    });

    return () => {
      mounted = false;
      scannerRef.current?.stop().catch(() => {});
    };
  }, [eventId]);

  const feedbackColors: Record<string, string> = {
    success: "bg-green-600",
    duplicate: "bg-yellow-500",
    error: "bg-red-600",
  };

  return (
    <div className="max-w-md mx-auto">
      <Link href={`/events/${eventId}/attendance`} className="text-sm text-slate-500 hover:underline">
        ← Voltar para presença
      </Link>

      <div className="mt-4 mb-3 text-sm text-slate-600">Check-ins nesta sessão: {count}</div>

      {cameraError ? (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-md">{cameraError}</div>
      ) : (
        <div id="qr-reader" ref={containerRef} className="rounded-lg overflow-hidden border border-slate-200" />
      )}

      {feedback && (
        <div className={`mt-4 text-white text-center py-3 rounded-md text-sm font-medium ${feedbackColors[feedback.type]}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}
