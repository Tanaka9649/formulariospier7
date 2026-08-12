"use client";

import { useState } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { updateFormConfig } from "@/server/forms/actions";
import type { FormConfigUpdateInput } from "@/lib/validation/formBuilder";

export function FormConfigEditor({
  eventId,
  defaultValues,
}: {
  eventId: string;
  defaultValues: FormConfigUpdateInput;
}) {
  const [values, setValues] = useState(defaultValues);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key: keyof FormConfigUpdateInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateFormConfig(eventId, values);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Input label="Título principal" value={values.title ?? ""} onChange={set("title")} />
      <Input label="Subtítulo" value={values.subtitle ?? ""} onChange={set("subtitle")} />
      <Textarea label="Resumo do evento" rows={2} value={values.summary ?? ""} onChange={set("summary")} />
      <Textarea label="Informações adicionais" rows={2} value={values.additionalInfo ?? ""} onChange={set("additionalInfo")} />
      <Input label="Título da tela de confirmação" value={values.confirmationTitle ?? ""} onChange={set("confirmationTitle")} />
      <Textarea
        label="Mensagem da tela de confirmação"
        rows={2}
        value={values.confirmationMessage ?? ""}
        onChange={set("confirmationMessage")}
      />
      <div>
        <Button onClick={save} disabled={saving}>
          {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar textos"}
        </Button>
      </div>
    </div>
  );
}
