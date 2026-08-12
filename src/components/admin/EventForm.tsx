"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { eventSchema, type EventInput } from "@/lib/validation/event";

const statusOptions = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "REGISTRATION_OPEN", label: "Inscrições abertas" },
  { value: "REGISTRATION_CLOSED", label: "Inscrições encerradas" },
  { value: "FULL", label: "Lotado" },
  { value: "FINISHED", label: "Finalizado" },
];

const emptyValues: EventInput = {
  slug: "",
  internalName: "",
  publicName: "",
  date: "",
  time: "",
  location: "",
  description: "",
  summary: "",
  maxParticipants: undefined,
  brandName: "",
  status: "DRAFT",
};

function toDateInputValue(value: unknown) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function EventForm({
  defaultValues,
  onSubmit,
  submitLabel = "Salvar",
}: {
  defaultValues?: Partial<EventInput>;
  onSubmit: (data: EventInput) => Promise<void>;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<EventInput>({
    ...emptyValues,
    ...defaultValues,
    date: toDateInputValue(defaultValues?.date),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof EventInput, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const set =
    (key: keyof EventInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = eventSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof EventInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof EventInput;
        if (key) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(parsed.data);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Não foi possível salvar o evento.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-2xl">
      {formError && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-md">{formError}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nome interno"
          value={values.internalName ?? ""}
          onChange={set("internalName")}
          error={errors.internalName}
        />
        <Input
          label="Nome público"
          value={values.publicName ?? ""}
          onChange={set("publicName")}
          error={errors.publicName}
        />
      </div>

      <Input
        label="Slug (usado na URL pública)"
        value={values.slug ?? ""}
        onChange={set("slug")}
        error={errors.slug}
        placeholder="ex: radar-empresarial"
      />

      <div className="grid grid-cols-3 gap-4">
        <Input type="date" label="Data" value={values.date ?? ""} onChange={set("date")} error={errors.date} />
        <Input label="Horário" value={values.time ?? ""} onChange={set("time")} placeholder="19h" error={errors.time} />
        <Input
          type="number"
          label="Capacidade máxima"
          value={values.maxParticipants ?? ""}
          onChange={set("maxParticipants")}
          error={errors.maxParticipants}
          placeholder="Sem limite"
        />
      </div>

      <Input label="Local" value={values.location ?? ""} onChange={set("location")} error={errors.location} />

      <Textarea
        label="Descrição"
        rows={3}
        value={values.description ?? ""}
        onChange={set("description")}
        error={errors.description}
      />

      <Textarea
        label="Resumo (usado em listagens)"
        rows={2}
        value={values.summary ?? ""}
        onChange={set("summary")}
        error={errors.summary}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nome da marca (opcional)"
          value={values.brandName ?? ""}
          onChange={set("brandName")}
          error={errors.brandName}
          placeholder="Pier7"
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-600">Status</label>
          <select
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900"
            value={values.status ?? "DRAFT"}
            onChange={set("status")}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." :
