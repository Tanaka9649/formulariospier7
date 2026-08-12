import Link from "next/link";

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  REGISTRATION_OPEN: "Inscrições abertas",
  REGISTRATION_CLOSED: "Inscrições encerradas",
  FULL: "Lotado",
  FINISHED: "Finalizado",
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  REGISTRATION_OPEN: "bg-green-100 text-green-700",
  REGISTRATION_CLOSED: "bg-yellow-100 text-yellow-700",
  FULL: "bg-orange-100 text-orange-700",
  FINISHED: "bg-slate-200 text-slate-600",
};

type EventCardData = {
  id: string;
  publicName: string;
  internalName: string;
  date: Date | null;
  status: string;
  maxParticipants: number | null;
  totalRegistered: number;
  remaining: number | null;
  confirmed: number;
  present: number;
  absent: number;
  waitlisted: number;
  attendanceRate: number;
};

export function EventCard({ event }: { event: EventCardData }) {
  return (
    <Link
      href={`/events/${event.id}/overview`}
      className="block border border-slate-200 rounded-lg p-5 hover:border-slate-400 transition-colors bg-white"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-slate-900">{event.publicName}</h3>
          <p className="text-xs text-slate-500">{event.internalName}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[event.status]}`}>
          {statusLabels[event.status]}
        </span>
      </div>

      {event.date && (
        <p className="text-sm text-slate-600 mb-3">
          {new Date(event.date).toLocaleDateString("pt-BR")}
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-700">
        <span>
          Inscritos: <strong>{event.totalRegistered}</strong>
          {event.maxParticipants ? ` / ${event.maxParticipants}` : ""}
        </span>
        {event.remaining !== null && <span>Vagas restantes: <strong>{event.remaining}</strong></span>}
        <span>Confirmados: <strong>{event.confirmed}</strong></span>
        <span>Presentes: <strong>{event.present}</strong></span>
        <span>Ausentes: <strong>{event.absent}</strong></span>
        <span>Comparecimento: <strong>{event.attendanceRate}%</strong></span>
        {event.waitlisted > 0 && (
          <span className="text-amber-600">Em espera: <strong>{event.waitlisted}</strong></span>
        )}
      </div>
    </Link>
  );
}
