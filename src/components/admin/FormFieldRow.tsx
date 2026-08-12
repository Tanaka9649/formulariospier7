"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { updateFormField } from "@/server/forms/actions";

const statusOptions = [
  { value: "INACTIVE", label: "Desativado" },
  { value: "OPTIONAL", label: "Opcional" },
  { value: "REQUIRED", label: "Obrigatório" },
];

type Field = {
  id: string;
  internalName: string;
  publicLabel: string;
  placeholder: string | null;
  status: "INACTIVE" | "OPTIONAL" | "REQUIRED";
};

export function FormFieldRow({ eventId, field }: { eventId: string; field: Field }) {
  const [publicLabel, setPublicLabel] = useState(field.publicLabel);
  const [placeholder, setPlaceholder] = useState(field.placeholder ?? "");
  const [status, setStatus] = useState(field.status);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = publicLabel !== field.publicLabel || placeholder !== (field.placeholder ?? "") || status !== field.status;

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await updateFormField(eventId, field.id, { publicLabel, placeholder, status });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-3 items-center border-b border-slate-100 py-3 last:border-0">
      <div className="col-span-2 text-sm text-slate-500">{field.internalName}</div>
      <input
        className="col-span-3 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
        value={publicLabel}
        onChange={(e) => setPublicLabel(e.target.value)}
      />
      <input
        className="col-span-3 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
        value={placeholder}
        onChange={(e) => setPlaceholder(e.target.value)}
        placeholder="Placeholder"
      />
      <select
        className="col-span-2 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
        value={status}
        onChange={(e) => setStatus(e.target.value as Field["status"])}
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="col-span-2 flex justify-end">
        <Button variant="secondary" onClick={save} disabled={!dirty || saving}>
          {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
