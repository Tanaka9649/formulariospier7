import { NextRequest } from "next/server";
import { getAllParticipantsForExport } from "@/server/participants/queries";

const registrationLabels: Record<string, string> = {
  REGISTERED: "Inscrito",
  CONFIRMED: "Confirmado",
  CANCELLED: "Cancelado",
  WAITLISTED: "Em espera",
};
const attendanceLabels: Record<string, string> = {
  PENDING: "Pendente",
  PRESENT: "Presente",
  ABSENT: "Ausente",
};

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: NextRequest, { params }: { params: { eventId: string } }) {
  const searchParams = request.nextUrl.searchParams;

  const { participants, fields } = await getAllParticipantsForExport(params.eventId, {
    search: searchParams.get("search") ?? undefined,
    registrationStatus: (searchParams.get("registrationStatus") as any) ?? "ALL",
    attendanceStatus: (searchParams.get("attendanceStatus") as any) ?? "ALL",
  });

  const headers = [...fields.map((f) => f.publicLabel), "Data de inscrição", "Origem", "Status", "Presença"];
  const lines = [headers.map(csvEscape).join(",")];

  for (const p of participants) {
    const answerByFieldId = new Map(p.answers.map((a) => [a.formFieldId, a.value]));
    const row = [
      ...fields.map((f) => csvEscape(answerByFieldId.get(f.id) ?? "")),
      csvEscape(p.createdAt.toLocaleString("pt-BR")),
      csvEscape(p.referralLink?.internalName ?? ""),
      csvEscape(registrationLabels[p.registrationStatus] ?? p.registrationStatus),
      csvEscape(attendanceLabels[p.attendanceStatus] ?? p.attendanceStatus),
    ];
    lines.push(row.join(","));
  }

  const csv = "\uFEFF" + lines.join("\n"); // BOM para acentuação abrir certo no Excel

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="participantes.csv"`,
    },
  });
}
