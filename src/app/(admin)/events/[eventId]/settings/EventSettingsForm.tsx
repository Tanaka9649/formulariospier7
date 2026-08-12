"use client";

import { useRouter } from "next/navigation";
import { EventForm } from "@/components/admin/EventForm";
import { updateEvent } from "@/server/events/actions";
import type { EventInput } from "@/lib/validation/event";

export function EventSettingsForm({
  eventId,
  defaultValues,
}: {
  eventId: string;
  defaultValues: Partial<EventInput>;
}) {
  const router = useRouter();

  const handleSubmit = async (data: EventInput) => {
    await updateEvent(eventId, data);
    router.refresh();
  };

  return <EventForm defaultValues={defaultValues} onSubmit={handleSubmit} submitLabel="Salvar alterações" />;
}
