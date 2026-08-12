"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EditParticipantModal } from "@/components/admin/EditParticipantModal";
import { bulkMarkAttendance, deleteParticipant } from "@/server/participants/actions";

type Field = { id: string; fieldKey: string; publicLabel: string };

type Row = {
  id: string;
  createdAt: string;
  registrationStatus: "REGISTERED" | "CONFIRMED" | "CANCELLED";
  attendanceStatus: "PENDING" | "PRESENT" | "ABSENT";
  origin: string | null;
  answers: Record<string, string>;
};

const registrationLabels: Record<string, string> = {
  REGISTERED: "Inscrito",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
};
const attendanceLabels: Record<string, string> = {
  PENDING: "Pendente",
  PRESENT: "Presente",
  ABSENT: "Ausente",
};
const attendanceColors: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  PRESENT: "bg-green-100 text-green-700",
  ABSENT: "bg-red-100 text-red-700",
};

export function ParticipantsTable({
  eventId,
  fields,
  rows,
  total,
  page,
  pageSize,
}: {
  eventId: string;
  fields: Field[];
  rows: Row[];
  total: number;
  page: number;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingRow, setEditingRow] = useState<Row | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  const updateParams = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    if (!("page" in patch)) params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const toggleAll = () => {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markSelected = async (status: "PRESENT" | "ABSENT") => {
    await bulkMarkAttendance(eventId, Array.from(selected), status);
    setSelected(new Set());
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este participante? Essa ação não pode ser desfeita.")) return;
    await deleteParticipant(eventId, id);
    router.refresh();
  };

  const exportUrl = `/api/events/${eventId}/participants/export?${searchParams.toString()}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateParams({ search: searchInput || null });
          }}
          className="flex gap-2"
        >
          <input
            className="border border-slate-300 rounded-md px-3 py-2 text-sm w-56"
            placeholder="Buscar..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </form>

        <select
          className="border border-slate-300 rounded-md px-2 py-2 text-sm"
          value={searchParams.get("registrationStatus") ?? "ALL"}
          onChange={(e) => updateParams({ registrationStatus: e.target.value })}
        >
          <option value="ALL">Todos os status</option>
          <option value="REGISTERED">Inscrito</option>
          <option value="CONFIRMED">Confirmado</option>
          <option value="CANCELLED">Cancelado</option>
        </select>

        <select
          className="border border-slate-300 rounded-md px-2 py-2 text-sm"
          value={searchParams.get("attendanceStatus") ?? "ALL"}
          onChange={(e) => updateParams({ attendanceStatus: e.target.value })}
        >
          <option value="ALL">Toda presença</option>
          <option value="PENDING">Pendente</option>
          <option value="PRESENT">Presente</option>
          <option value="ABSENT">Ausente</option>
        </select>

        <button
          className="text-sm text-slate-500 hover:text-slate-800"
          onClick={() =>
            updateParams({
              sortDir: searchParams.get("sortDir") === "asc" ? "desc" : "asc",
            })
          }
        >
          Data {searchParams.get("sortDir") === "asc" ? "↑" : "↓"}
        </button>

        <a href={exportUrl} className="ml-auto">
          <Button variant="secondary">Exportar CSV</Button>
        </a>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 bg-slate-100 rounded-md px-3 py-2 text-sm">
          <span>{selected.size} selecionado(s)</span>
          <Button variant="secondary" onClick={() => markSelected("PRESENT")}>
            Marcar presente
          </Button>
          <Button variant="secondary" onClick={() => markSelected("ABSENT")}>
            Marcar ausente
          </Button>
        </div>
      )}

      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="p-3 w-8">
                <input
                  type="checkbox"
                  checked={selected.size === rows.length && rows.length > 0}
                  onChange={toggleAll}
                />
              </th>
              {fields.map((f) => (
                <th key={f.id} className="p-3 whitespace-nowrap">
                  {f.publicLabel}
                </th>
              ))}
              <th className="p-3 whitespace-nowrap">Inscrição</th>
              <th className="p-3 whitespace-nowrap">Origem</th>
              <th className="p-3 whitespace-nowrap">Status</th>
              <th className="p-3 whitespace-nowrap">Presença</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 last:border-0">
                <td className="p-3">
                  <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleOne(row.id)} />
                </td>
                {fields.map((f) => (
                  <td key={f.id} className="p-3 whitespace-nowrap">
                    {row.answers[f.fieldKey] || "—"}
                  </td>
                ))}
                <td className="p-3 whitespace-nowrap text-slate-500">
                  {new Date(row.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="p-3 whitespace-nowrap text-slate-500">{row.origin ?? "—"}</td>
                <td className="p-3 whitespace-nowrap">{registrationLabels[row.registrationStatus]}</td>
                <td className="p-3 whitespace-nowrap">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${attendanceColors[row.attendanceStatus]}`}>
                    {attendanceLabels[row.attendanceStatus]}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap text-right">
                  <button
                    className="text-slate-500 hover:text-slate-900 text-xs mr-3"
                    onClick={() => setEditingRow(row)}
                  >
                    Editar
                  </button>
                  <button className="text-red-500 hover:text-red-700 text-xs" onClick={() => remove(row.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={fields.length + 6} className="p-6 text-center text-slate-400 text-sm">
                  Nenhum participante encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
        <span>
          {total} participante(s) • página {page} de {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={page <= 1 || isPending}
            onClick={() => updateParams({ page: String(page - 1) })}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            disabled={page >= totalPages || isPending}
            onClick={() => updateParams({ page: String(page + 1) })}
          >
            Próxima
          </Button>
        </div>
      </div>

      {editingRow && (
        <EditParticipantModal
          eventId={eventId}
          fields={fields}
          row={editingRow}
          onClose={() => {
            setEditingRow(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
