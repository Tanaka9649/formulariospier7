"use client";

import { EventForm } from "@/components/admin/EventForm";
import { createEvent } from "@/server/events/actions";
import type { EventInput } from "@/lib/validation/event";

export default function NewEventPage() {
  const handleSubmit = async (data: EventInput) => {
    await createEvent(data);
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Novo evento</h1>
      <EventForm onSubmit={handleSubmit} submitLabel="Criar evento" />
    </div>
  );
}
