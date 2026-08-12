"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { createTicketType, toggleTicketType, updateTicketType } from "@/server/ticketTypes/actions";

type TicketTypeRow = {
  id: string;
  name: string;
  description: string | null;
  quota: number | null;
  isActive: boolean;
  registered: number;
};

function TicketTypeEditRow({ eventId, tt }: { eventId: string; tt: TicketTypeRow }) {
  const router = useRouter();
  const [name, setName] = useState(tt.name);
  const [description, setDescription] = useState(tt.description ?? "");
  const [quota, setQuota] = useState(tt.quota?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = name !== tt.name || description !== (tt.description ?? "") || quota !== (tt.quota?.toString() ?? "");

  const save = async () => {
    setSaving(true);
    try {
      await updateTicketType(eventId, tt.id, {
        name,
        description: description || null,
        quota: quota ? Number(quota) : null,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-3 items-center border-b border-slate-100 py-3 last:border-0">
      <input
        className="col-span-3 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setSaved(false);
        }}
      />
      <input
        className="col-span-4 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
        placeholder="Descrição (opcional)"
        value={description}
        onChange={(e) => {
          setDescription(e.target.value);
          setSaved(false);
        }}
      />
      <input
        className="col-span-1 border border-slate-300 rounded-md px-2 py-1.5 text-sm"
        placeholder="Cota"
        type="number"
        value={quota}
        onChange={(e) => {
          setQuota(e.target.value);
          setSaved(false);
        }}
      />
      <span className="col-span-1 text-xs text-slate-500 text-center">
        {tt.registered}
        {tt.quota ? `/${tt.quota}` : ""}
      </span>
      <div className="col-span-1 flex justify-center">
        <Switch
          checked={tt.isActive}
          onChange={async (v) => {
            await toggleTicketType(eventId, tt.id, v);
            router.refresh();
          }}
        />
      </div>
      <div className="col-span-2 flex justify-end">
        <Button variant="secondary" onClick={save} disabled={!dirty || saving}>
          {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}

export function TicketTypesTable({ eventId, ticketTypes }: { eventId: string; ticketTypes: TicketTypeRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createTicketType(eventId, { name: name.trim() });
      setName("");
      router.refresh();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleCreate} className="flex items-end gap-2 mb-4 max-w-md">
        <div className="flex-1">
          <Input
            label="Novo tipo de ingresso"
            placeholder="Ex: Estudante, VIP, Cortesia..."
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={creating}>
          {creating ? "Criando..." : "Criar tipo"}
        </Button>
      </form>

      {ticketTypes.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg px-4">
          <div className="grid grid-cols-12 gap-3 text-xs text-slate-400 py-2">
            <span className="col-span-3">Nome</span>
            <span className="col-span-4">Descrição</span>
            <span className="col-span-1">Cota</span>
            <span className="col-span-1 text-center">Uso</span>
            <span className="col-span-1 text-center">Ativo</span>
          </div>
          {ticketTypes.map((tt) => (
            <TicketTypeEditRow key={tt.id} eventId={eventId} tt={tt} />
          ))}
        </div>
      )}

      {ticketTypes.length === 0 && (
        <p className="text-sm text-slate-400">
          Nenhum tipo de ingresso configurado — o formulário público mostra apenas a inscrição padrão.
        </p>
      )}
    </div>
  );
}
