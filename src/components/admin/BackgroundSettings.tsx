"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { AssetUploader } from "@/components/admin/AssetUploader";
import { updateBackgroundSettings } from "@/server/branding/actions";

export function BackgroundSettings({
  eventId,
  backgroundUrl,
  defaultValues,
}: {
  eventId: string;
  backgroundUrl: string | null;
  defaultValues: { backgroundEnabled: boolean; backgroundBlur: number; backgroundOverlay: number };
}) {
  const [enabled, setEnabled] = useState(defaultValues.backgroundEnabled);
  const [blur, setBlur] = useState(defaultValues.backgroundBlur);
  const [overlay, setOverlay] = useState(defaultValues.backgroundOverlay);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateBackgroundSettings(eventId, {
        backgroundEnabled: enabled,
        backgroundBlur: blur,
        backgroundOverlay: overlay,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <AssetUploader
        eventId={eventId}
        field="backgroundUrl"
        label="Imagem de fundo"
        accept="image/png,image/jpeg,image/webp"
        currentUrl={backgroundUrl}
        preview="image"
      />

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <Switch
          checked={enabled}
          onChange={(v) => {
            setEnabled(v);
            setSaved(false);
          }}
        />
        Ativar imagem de fundo no formulário
      </label>

      <div className="flex flex-col gap-1 max-w-xs">
        <label className="text-xs text-slate-500">Desfoque ({blur}px)</label>
        <input
          type="range"
          min={0}
          max={20}
          value={blur}
          onChange={(e) => {
            setBlur(Number(e.target.value));
            setSaved(false);
          }}
        />
      </div>

      <div className="flex flex-col gap-1 max-w-xs">
        <label className="text-xs text-slate-500">Escurecimento ({Math.round(overlay * 100)}%)</label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(overlay * 100)}
          onChange={(e) => {
            setOverlay(Number(e.target.value) / 100);
            setSaved(false);
          }}
        />
      </div>

      <div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar configuração de fundo"}
        </Button>
      </div>
    </div>
  );
}
