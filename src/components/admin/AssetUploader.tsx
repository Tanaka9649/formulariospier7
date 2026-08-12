"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/Button";
import { saveBrandingAsset } from "@/server/branding/actions";
import type { AssetField } from "@/lib/validation/branding";

export function AssetUploader({
  eventId,
  field,
  label,
  accept,
  currentUrl,
  preview = "image",
}: {
  eventId: string;
  field: AssetField;
  label: string;
  accept: string;
  currentUrl: string | null;
  preview?: "image" | "audio" | "none";
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const blob = await upload(`${eventId}/${field}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      await saveBrandingAsset(eventId, field, blob.url);
      setUrl(blob.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>

      {preview === "image" && url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="h-16 w-auto object-contain border border-slate-200 rounded-md p-1" />
      )}
      {preview === "audio" && url && <audio src={url} controls className="h-9" />}

      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? "Enviando..." : url ? "Trocar arquivo" : "Enviar arquivo"}
        </Button>
      </div>

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
