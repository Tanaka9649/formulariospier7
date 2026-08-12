import { notFound } from "next/navigation";
import { getEventById } from "@/server/events/actions";
import { EventSettingsForm } from "./EventSettingsForm";

export default async function EventSettingsPage({ params }: { params: { eventId: string } }) {
  const event = await getEventById(params.eventId);
  if (!event) notFound();

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Configurações</h2>
      <EventSettingsForm
        eventId={event.id}
        defaultValues={{
          internalName: event.internalName,
          publicName: event.publicName,
          slug: event.slug,
          date: event.date ? event.date.toISOString().slice(0, 10) : undefined,
          time: event.time ?? undefined,
          location: event.location ?? undefined,
          description: event.description ?? undefined,
          summary: event.summary ?? undefined,
          maxParticipants: event.maxParticipants ?? undefined,
          brandName: event.brandName ?? undefined,
          status: event.status,
        }}
      />
    </div>
  );
}
