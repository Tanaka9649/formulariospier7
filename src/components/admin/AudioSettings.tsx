"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { AssetUploader } from "@/components/admin/AssetUploader";
import { updateAudioSettings } from "@/server/branding/actions";

export function AudioSettings({
  eventId,
  audioUrl,
  defaultValues,
}: {
  eventId: string;
  audioUrl: string | null;
  defaultValues: { audioEnabled: boolean; audioVolume: number; audioLoop: boolean };
}) {
  const [enabled, setEnabled] = useState(defaultValues.audioEnabled);
  const [volume, setVolume] = useState(defaultValues.audioVolume);
  const [loop, setLoop] = useState(defaultValues.audioLoop);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateAudioSettings(eventId, { audioEnabled: enabled, audioVolume: volume, audioLoop: loop });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <AssetUploader
        eventId={eventId}
        field="audioUrl"
        label="Música de fundo"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
        currentUrl={audioUrl}
        preview="audio"
      />

      <p className="text-xs text-slate-500 max-w-md">
        Navegadores bloqueiam reprodução automática de áudio. No formulário público, a música só
        começa depois que a pessoa clicar em &quot;Ativar música&quot; — nunca antes, e isso nunca
        impede o preenchimento do formulário.
      </p>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <Switch
          checked={enabled}
          onChange={(v) => {
            setEnabled(v);
            setSaved(false);
          }}
        />
        Ativar música neste evento
      </label>

      <div className="flex flex-col gap-1 max-w-xs">
        <label className="text-xs text-slate-500">Volume padrão ({Math.round(volume * 100)}%)</label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => {
            setVolume(Number(e.target.value) / 100);
            setSaved(false);
          }}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <Switch
          checked={loop}
          onChange={(v) => {
            setLoop(v);
            setSaved(false);
          }}
        />
        Repetir em loop
      </label>

      <div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar configuração de áudio"}
        </Button>
      </div>
    </div>
  );
}
