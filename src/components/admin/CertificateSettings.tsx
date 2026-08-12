"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { updateCertificateConfig } from "@/server/certificates/actions";
import type { CertificateConfigInput } from "@/lib/validation/certificate";

export function CertificateSettings({
  eventId,
  defaultValues,
}: {
  eventId: string;
  defaultValues: CertificateConfigInput;
}) {
  const [values, setValues] = useState(defaultValues);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key: keyof CertificateConfigInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateCertificateConfig(eventId, values);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <Switch
          checked={values.enabled}
          onChange={(v) => {
            setValues((prev) => ({ ...prev, enabled: v }));
            setSaved(false);
          }}
        />
        Emitir certificado para participantes presentes
      </label>

      <Input label="Título do certificado" value={values.title} onChange={set("title")} />

      <Textarea
        label="Texto do certificado"
        rows={3}
        value={values.bodyTemplate}
        onChange={set("bodyTemplate")}
      />
      <p className="text-xs text-slate-500 -mt-2">
        Use <code className="bg-slate-100 px-1 rounded">{"{{nome}}"}</code>,{" "}
        <code className="bg-slate-100 px-1 rounded">{"{{evento}}"}</code> e{" "}
        <code className="bg-slate-100 px-1 rounded">{"{{data}}"}</code> — serão substituídos automaticamente.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nome de quem assina (opcional)"
          value={values.signatureName ?? ""}
          onChange={set("signatureName")}
        />
        <Input
          label="Cargo de quem assina (opcional)"
          value={values.signatureRole ?? ""}
          onChange={set("signatureRole")}
        />
      </div>

      <div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar certificado"}
        </Button>
      </div>
    </div>
  );
}
