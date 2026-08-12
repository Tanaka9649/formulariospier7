"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ticketTypeSchema, type TicketTypeInput } from "@/lib/validation/ticketType";

export async function createTicketType(eventId: string, input: TicketTypeInput) {
  const parsed = ticketTypeSchema.parse(input);
  const count = await db.ticketType.count({ where: { eventId } });
  await db.ticketType.create({ data: { eventId, ...parsed, displayOrder: count } });
  revalidatePath(`/events/${eventId}/form-builder`);
}

export async function updateTicketType(eventId: string, ticketTypeId: string, input: TicketTypeInput) {
  const parsed = ticketTypeSchema.parse(input);
  await db.ticketType.updateMany({ where: { id: ticketTypeId, eventId }, data: parsed });
  revalidatePath(`/events/${eventId}/form-builder`);
}

export async function toggleTicketType(eventId: string, ticketTypeId: string, isActive: boolean) {
  await db.ticketType.updateMany({ where: { id: ticketTypeId, eventId }, data: { isActive } });
  revalidatePath(`/events/${eventId}/form-builder`);
}

export async function getTicketTypesWithStats(eventId: string) {
  const types = await db.ticketType.findMany({
    where: { eventId },
    orderBy: { displayOrder: "asc" },
    include: {
      participants: {
        where: { deletedAt: null, registrationStatus: { in: ["REGISTERED", "CONFIRMED"] } },
        select: { id: true },
      },
    },
  });

  return types.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    quota: t.quota,
    isActive: t.isActive,
    registered: t.participants.length,
  }));
}

// Usado pelo formulário público — só os tipos ativos, sem dado sensível de outros participantes.
export async function getActiveTicketTypes(eventId: string) {
  const types = await db.ticketType.findMany({
    where: { eventId, isActive: true },
    orderBy: { displayOrder: "asc" },
    include: {
      participants: {
        where: { deletedAt: null, registrationStatus: { in: ["REGISTERED", "CONFIRMED"] } },
        select: { id: true },
      },
    },
  });

  return types.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    quota: t.quota,
    soldOut: t.quota !== null && t.participants.length >= t.quota,
  }));
}
