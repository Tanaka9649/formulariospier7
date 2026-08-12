"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { updateConsent } from "@/server/forms/actions";

type Consent = {
  id: string;
  consentKey: string;
  textVersion: string;
  isRequired: boolean;
};

export function ConsentRow({ eventId, consent }: { eventId: string; consent: Consent }) {
  const [textVersion, setTextVersion] = useState(consent.textVersion);
  const [isRequired, setIsRequired] = useState(consent.isRequired);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = textVersion !== consent.textVersion || isRequired !== consent.isRequired;

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateConsent(eventId, consent.id, { textVersion, isRequired });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <textarea
        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm mb-2"
        rows={2}
        value={textVersion}
        onChange={(e) => setTextVersion(e.target.value)}
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <Switch checked={isRequired} onChange={setIsRequired} />
          Obrigatório
        </label>
        <Button variant="secondary" onClick={save} disabled={!dirty || saving}>
          {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
