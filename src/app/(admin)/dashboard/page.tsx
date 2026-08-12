import Link from "next/link";
import { listEventsWithStats } from "@/server/events/actions";
import { EventCard } from "@/components/admin/EventCard";
import { Button } from "@/components/ui/Button";

export default async function DashboardPage() {
  const events = await listEventsWithStats();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Eventos</h1>
        <Link href="/events/new">
          <Button>Novo evento</Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg p-10 text-center">
          Nenhum evento cadastrado ainda.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
