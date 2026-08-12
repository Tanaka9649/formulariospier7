import { db } from "@/lib/db";
import Link from "next/link";
import { AttendanceCheckin } from "@/components/admin/AttendanceCheckin";

export default async function AttendancePage({ params }: { params: { eventId: string } }) {
  const participants = await db.participant.findMany({
    where: {
      eventId: params.eventId,
      deletedAt: null,
      registrationStatus: { in: ["REGISTERED", "CONFIRMED"] },
    },
    include: { answers: { include: { formField: true } } },
    orderBy: { createdAt: "asc" },
  });

  const rows = participants.map((p) => {
    const name = p.answers.find((a) => a.formField.fieldKey === "name")?.value;
    const email = p.answers.find((a) => a.formField.fieldKey === "email")?.value;
    const label = [name, email].filter(Boolean).join(" — ") || "Sem identificação";
    return { id: p.id, label, attendanceStatus: p.attendanceStatus };
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Controle de presença</h2>
        <Link
          href={`/events/${params.eventId}/attendance/scan`}
          className="text-sm bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-700"
        >
          Abrir leitor de QR Code
        </Link>
      </div>
      <AttendanceCheckin eventId={params.eventId} rows={rows} />
    </div>
  );
}
