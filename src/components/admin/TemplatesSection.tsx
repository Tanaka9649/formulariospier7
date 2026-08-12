"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { applyTemplateToEvent, saveEventAsTemplate, deleteFormTemplate } from "@/server/formTemplates/actions";

type Template = {
  id: string;
  name: string;
  description: string | null;
  fieldCount: number;
  consentCount: number;
};

export function TemplatesSection({
  eventId,
  templates,
  hasParticipants,
}: {
  eventId: string;
  templates: Template[];
  hasParticipants: boolean;
}) {
  const router = useRouter();
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id ?? "");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const [showSaveForm, setShowSaveForm] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const apply = async () => {
    if (!selectedTemplateId) return;
    if (!confirm("Aplicar este template? Os campos e consentimentos atuais do formulário serão substituídos.")) {
      return;
    }
    setApplying(true);
    setApplyError(null);
    try {
      await applyTemplateToEvent(eventId, selectedTemplateId);
      router.refresh();
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Falha ao aplicar o template.");
    } finally {
      setApplying(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;
    setSaving(true);
    try {
      await saveEventAsTemplate(eventId, {
        name: templateName.trim(),
        description: templateDescription.trim() || null,
      });
      setTemplateName("");
      setTemplateDescription("");
      setShowSaveForm(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este template? Não afeta eventos que já usaram ele antes.")) return;
    await deleteFormTemplate(id);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      {hasParticipants && (
        <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-md">
          Este evento já tem inscrições, então aplicar um template está desabilitado — isso apagaria
          respostas já registradas. Salvar como template continua disponível normalmente.
        </p>
      )}

      {templates.length > 0 && (
        <div className="flex items-end gap-2">
          <div className="flex-1 max-w-xs">
            <label className="text-xs text-slate-500 mb-1 block">Aplicar template existente</label>
            <select
              className="w-full border border-slate-300 rounded-md px-2 py-2 text-sm"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.fieldCount} campos)
                </option>
              ))}
            </select>
          </div>
          <Button variant="secondary" onClick={apply} disabled={applying || hasParticipants}>
            {applying ? "Aplicando..." : "Aplicar"}
          </Button>
        </div>
      )}
      {applyError && <p className="text-xs text-red-600">{applyError}</p>}

      {templates.length > 0 && (
        <div className="flex flex-col gap-1">
          {templates.map((t) => (
            <div key={t.id} className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 py-1.5">
              <span>
                {t.name}
                {t.description ? ` — ${t.description}` : ""}
              </span>
              <button className="text-red-500 hover:text-red-700" onClick={() => remove(t.id)}>
                Excluir
              </button>
            </div>
          ))}
        </div>
      )}

      {!showSaveForm ? (
        <div>
          <Button variant="secondary" onClick={() => setShowSaveForm(true)}>
            Salvar formulário atual como template
          </Button>
        </div>
      ) : (
        <form onSubmit={save} className="flex flex-col gap-3 max-w-md border border-slate-200 rounded-lg p-4">
          <Input
            label="Nome do template"
            placeholder="Ex: Padrão eventos corporativos"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />
          <Input
            label="Descrição (opcional)"
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar template"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowSaveForm(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
