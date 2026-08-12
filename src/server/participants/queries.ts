import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type ParticipantFilters = {
  search?: string;
  registrationStatus?: "REGISTERED" | "CONFIRMED" | "CANCELLED" | "WAITLISTED" | "ALL";
  attendanceStatus?: "PENDING" | "PRESENT" | "ABSENT" | "ALL";
  sortDir?: "asc" | "desc";
};

function buildWhere(eventId: string, filters: ParticipantFilters): Prisma.ParticipantWhereInput {
  return {
    eventId,
    deletedAt: null,
    ...(filters.registrationStatus && filters.registrationStatus !== "ALL"
      ? { registrationStatus: filters.registrationStatus }
      : {}),
    ...(filters.attendanceStatus && filters.attendanceStatus !== "ALL"
      ? { attendanceStatus: filters.attendanceStatus }
      : {}),
    ...(filters.search
      ? { answers: { some: { value: { contains: filters.search, mode: "insensitive" } } } }
      : {}),
  };
}

export async function getActiveFields(eventId: string) {
  return db.formField.findMany({
    where: { eventId, status: { in: ["OPTIONAL", "REQUIRED"] } },
    orderBy: { displayOrder: "asc" },
  });
}

export async function getParticipantsPage(
  eventId: string,
  filters: ParticipantFilters,
  page: number,
  pageSize = 20
) {
  const where = buildWhere(eventId, filters);

  const [total, participants, fields] = await Promise.all([
    db.participant.count({ where }),
    db.participant.findMany({
      where,
      include: { answers: true, referralLink: { select: { internalName: true } } },
      orderBy: { createdAt: filters.sortDir === "asc" ? "asc" : "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    getActiveFields(eventId),
  ]);

  const rows = participants.map((p) => {
    return {
      id: p.id,
      createdAt: p.createdAt,
      registrationStatus: p.registrationStatus,
      attendanceStatus: p.attendanceStatus,
      origin: p.referralLink?.internalName ?? null,
      answers: fields.reduce<Record<string, string>>((acc, f) => {
        const answer = p.answers.find((a) => a.formFieldId === f.id);
        acc[f.fieldKey] = answer?.value ?? "";
        return acc;
      }, {}),
    };
  });

  return { rows, fields, total, page, pageSize };
}

export async function getAllParticipantsForExport(eventId: string, filters: ParticipantFilters) {
  const where = buildWhere(eventId, filters);
  const [participants, fields] = await Promise.all([
    db.participant.findMany({
      where,
      include: { answers: true, referralLink: { select: { internalName: true } } },
      orderBy: { createdAt: filters.sortDir === "asc" ? "asc" : "desc" },
    }),
    getActiveFields(eventId),
  ]);

  return { participants, fields };
}
