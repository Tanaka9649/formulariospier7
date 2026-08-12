"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { updateParticipant } from "@/server/participants/actions";

type Field = { id: string; fieldKey: string; publicLabel: string };

type Row = {
  id: string;
  registrationStatus: "REGISTERED" | "CONFIRMED" | "CANCELLED" | "WAITLISTED";
  attendanceStatus: "PENDING" | "PRESENT" | "ABSENT";
  answers: Record<string, string>;
};

export function EditParticipantModal({
  eventId,
  fields,
  row,
  onClose,
}: {
  eventId: string;
  fields: Field[];
  row: Row;
  onClose: () => void;
}) {
  const [answers, setAnswers] = useState(row.answers);
  const [registrationStatus, setRegistrationStatus] = useState(row.registrationStatus);
  const [attendanceStatus, setAttendanceStatus] = useState(row.attendanceStatus);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateParticipant(eventId, row.id, { answers, registrationStatus, attendanceStatus });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="font-semibold mb-4">Editar participante</h3>

        <div className="flex flex-col gap-3 mb-4">
          {fields.map((field) => (
            <div key={field.id} className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">{field.publicLabel}</label>
              <input
                className="border border-slate-300 rounded-md px-3 py-2 text-sm"
                value={answers[field.fieldKey] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [field.fieldKey]: e.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Status da inscrição</label>
            <select
              className="border border-slate-300 rounded-md px-2 py-2 text-sm"
              value={registrationStatus}
              onChange={(e) => setRegistrationStatus(e.target.value as Row["registrationStatus"])}
            >
              <option value="REGISTERED">Inscrito</option>
              <option value="CONFIRMED">Confirmado</option>
              <option value="WAITLISTED">Em espera</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Presença</label>
            <select
              className="border border-slate-300 rounded-md px-2 py-2 text-sm"
              value={attendanceStatus}
              onChange={(e) => setAttendanceStatus(e.target.value as Row["attendanceStatus"])}
            >
              <option value="PENDING">Pendente</option>
              <option value="PRESENT">Presente</option>
              <option value="ABSENT">Ausente</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
