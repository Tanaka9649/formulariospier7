"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { updateBrandingColors } from "@/server/branding/actions";
import type { BrandingColorsInput } from "@/lib/validation/branding";

const colorFields: { key: keyof BrandingColorsInput; label: string; fallback: string }[] = [
  { key: "primaryColor", label: "Cor principal", fallback: "#0f172a" },
  { key: "secondaryColor", label: "Cor secundária", fallback: "#64748b" },
  { key: "buttonColor", label: "Cor dos botões", fallback: "#0f172a" },
  { key: "textColor", label: "Cor do texto", fallback: "#0f172a" },
  { key: "backgroundColor", label: "Cor de fundo", fallback: "#f8fafc" },
  { key: "fieldColor", label: "Cor dos campos", fallback: "#ffffff" },
];

export function ColorSettings({
  eventId,
  defaultValues,
}: {
  eventId: string;
  defaultValues: Partial<BrandingColorsInput>;
}) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(colorFields.map((f) => [f.key, (defaultValues[f.key] as string) || f.fallback]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateBrandingColors(eventId, values as BrandingColorsInput);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        {colorFields.map((f) => (
          <div key={f.key} className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">{f.label}</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={values[f.key]}
                onChange={(e) => {
                  setValues((v) => ({ ...v, [f.key]: e.target.value }));
                  setSaved(false);
                }}
                className="h-9 w-9 border border-slate-300 rounded cursor-pointer"
              />
              <span className="text-xs text-slate-500">{values[f.key]}</span>
            </div>
          </div>
        ))}
      </div>
      <Button onClick={save} disabled={saving}>
        {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar cores"}
      </Button>
    </div>
  );
}
