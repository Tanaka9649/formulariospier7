"use server";

import { db } from "@/lib/db";
import { eventSchema, type EventInput } from "@/lib/validation/event";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureDefaultFormSetup } from "@/server/forms/actions";

export async function listEventsWithStats() {
  const events = await db.event.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { participants: true },
      },
      participants: {
        where: { deletedAt: null },
        select: { registrationStatus: true, attendanceStatus: true },
      },
    },
  });

  return events.map((event) => {
    const registrations = event.participants.filter((p) => p.registrationStatus !== "CANCELLED");
    const confirmed = registrations.filter((p) => p.registrationStatus === "CONFIRMED").length;
    const present = registrations.filter((p) => p.attendanceStatus === "PRESENT").length;
    const absent = registrations.filter((p) => p.attendanceStatus === "ABSENT").length;
    const totalRegistered = registrations.length;
    const remaining = event.maxParticipants ? Math.max(event.maxParticipants - totalRegistered, 0) : null;
    const attendanceRate = totalRegistered > 0 ? Math.round((present / totalRegistered) * 1000) / 10 : 0;

    return {
      id: event.id,
      slug: event.slug,
      internalName: event.internalName,
      publicName: event.publicName,
      date: event.date,
      status: event.status,
      maxParticipants: event.maxParticipants,
      totalRegistered,
      remaining,
      confirmed,
      present,
      absent,
      attendanceRate,
    };
  });
}

export async function getEventById(id: string) {
  return db.event.findUnique({ where: { id, deletedAt: null } });
}

export async function createEvent(input: EventInput) {
  const parsed = eventSchema.parse(input);

  const existingSlug = await db.event.findUnique({ where: { slug: parsed.slug } });
  if (existingSlug) {
    throw new Error("Já existe um evento com esse slug.");
  }

  const event = await db.event.create({
    data: {
      ...parsed,
      date: parsed.date ? new Date(parsed.date) : null,
    },
  });

  await ensureDefaultFormSetup(event.id);

  revalidatePath("/dashboard");
  redirect(`/events/${event.id}/overview`);
}

export async function updateEvent(id: string, input: EventInput) {
  const parsed = eventSchema.parse(input);

  const existingSlug = await db.event.findFirst({
    where: { slug: parsed.slug, NOT: { id } },
  });
  if (existingSlug) {
    throw new Error("Já existe outro evento com esse slug.");
  }

  await db.event.update({
    where: { id },
    data: {
      ...parsed,
      date: parsed.date ? new Date(parsed.date) : null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/events/${id}/overview`);
}

export async function softDeleteEvent(id: string) {
  await db.event.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/dashboard");
}
