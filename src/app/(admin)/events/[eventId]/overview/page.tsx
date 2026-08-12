import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { getOriginBreakdown, getRegistrationsByDay } from "@/server/analytics/queries";
import { BarList } from "@/components/admin/BarList";

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  REGISTRATION_OPEN: "Inscrições abertas",
  REGISTRATION_CLOSED: "Inscrições encerradas",
  FULL: "Lotado",
  FINISHED: "Finalizado",
};

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default async function EventOverviewPage({ params }: { params: { eventId: string } }) {
  const event = await db.event.findUnique({
    where: { id: params.eventId, deletedAt: null },
    include: {
      participants: {
        where: { deletedAt: null },
        select: { registrationStatus: true, attendanceStatus: true },
      },
    },
  });

  if (!event) notFound();

  const [originBreakdown, registrationsByDay] = await Promise.all([
    getOriginBreakdown(params.eventId),
    getRegistrationsByDay(params.eventId),
  ]);

  const registrations = event.participants.filter(
    (p) => p.registrationStatus === "REGISTERED" || p.registrationStatus === "CONFIRMED"
  );
  const waitlisted = event.participants.filter((p) => p.registrationStatus === "WAITLISTED").length;
  const totalRegistered = registrations.length;
  const confirmed = registrations.filter((p) => p.registrationStatus === "CONFIRMED").length;
  const present = registrations.filter((p) => p.attendanceStatus === "PRESENT").length;
  const absent = registrations.filter((p) => p.attendanceStatus === "ABSENT").length;
  const remaining = event.maxParticipants ? Math.max(event.maxParticipants - totalRegistered, 0) : null;
  const occupancy = event.maxParticipants
    ? Math.round((totalRegistered / event.maxParticipants) * 1000) / 10
    : null;
  const attendanceRate = totalRegistered > 0 ? Math.round((present / totalRegistered) * 1000) / 10 : 0;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3 text-sm">
        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
          {statusLabels[event.status]}
        </span>
        {event.date && <span className="text-slate-500">{new Date(event.date).toLocaleDateString("pt-BR")}</span>}
        {event.location && <span className="text-slate-500">• {event.location}</span>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Inscritos" value={totalRegistered} />
        <StatCard label="Capacidade máxima" value={event.maxParticipants ?? "Ilimitada"} />
        <StatCard label="Vagas restantes" value={remaining ?? "—"} />
        <StatCard label="Ocupação" value={occupancy !== null ? `${occupancy}%` : "—"} />
        <StatCard label="Confirmados" value={confirmed} />
        <StatCard label="Presentes" value={present} />
        <StatCard label="Ausentes" value={absent} />
        <StatCard label="Taxa de comparecimento" value={`${attendanceRate}%`} />
        <StatCard label="Em lista de espera" value={waitlisted} />
      </div>

      {event.summary && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-slate-700 mb-2">Resumo</h2>
          <p className="text-sm text-slate-600">{event.summary}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div>
          <h2 className="text-sm font-medium text-slate-700 mb-3">Inscrições por origem</h2>
          <div className="border border-slate-200 rounded-lg bg-white p-4">
            <BarList items={originBreakdown.map((o) => ({ label: o.name, value: o.count }))} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-slate-700 mb-3">Inscrições por dia</h2>
          <div className="border border-slate-200 rounded-lg bg-white p-4">
            {registrationsByDay.length === 0 ? (
              <p className="text-sm text-slate-400">Sem dados ainda.</p>
            ) : (
              <BarList
                items={registrationsByDay.slice(-14).map((d) => ({
                  label: new Date(d.day).toLocaleDateString("pt-BR"),
                  value: d.count,
                }))}
              />
            )}
            {registrationsByDay.length > 0 && (
              <p className="text-xs text-slate-400 mt-3">
                Total acumulado: {registrationsByDay[registrationsByDay.length - 1].cumulative} inscrições
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
