"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { referralLinkSchema, type ReferralLinkInput } from "@/lib/validation/referralLink";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function generateUniqueRefCode(eventId: string, base: string) {
  const baseCode = slugify(base) || "link";
  let code = baseCode;
  let counter = 2;

  // Poucos links por evento na prática — checagem sequencial é suficiente, sem exagero de índice/lock.
  while (await db.referralLink.findUnique({ where: { eventId_refCode: { eventId, refCode: code } } })) {
    code = `${baseCode}-${counter}`;
    counter += 1;
  }
  return code;
}

export async function createReferralLink(eventId: string, input: ReferralLinkInput) {
  const parsed = referralLinkSchema.parse(input);
  const refCode = await generateUniqueRefCode(eventId, parsed.internalName);

  await db.referralLink.create({
    data: { eventId, internalName: parsed.internalName, refCode },
  });

  revalidatePath(`/events/${eventId}/links`);
}

export async function toggleReferralLink(eventId: string, linkId: string, isActive: boolean) {
  await db.referralLink.updateMany({ where: { id: linkId, eventId }, data: { isActive } });
  revalidatePath(`/events/${eventId}/links`);
}

export async function renameReferralLink(eventId: string, linkId: string, internalName: string) {
  const parsed = referralLinkSchema.parse({ internalName });
  await db.referralLink.updateMany({ where: { id: linkId, eventId }, data: { internalName: parsed.internalName } });
  revalidatePath(`/events/${eventId}/links`);
}

export async function getReferralLinksWithStats(eventId: string) {
  const links = await db.referralLink.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    include: {
      participants: {
        where: { deletedAt: null, registrationStatus: { not: "CANCELLED" } },
        select: { attendanceStatus: true },
      },
    },
  });

  return links.map((link) => {
    const registrations = link.participants.length;
    const present = link.participants.filter((p) => p.attendanceStatus === "PRESENT").length;
    const absent = link.participants.filter((p) => p.attendanceStatus === "ABSENT").length;
    return {
      id: link.id,
      internalName: link.internalName,
      refCode: link.refCode,
      isActive: link.isActive,
      registrations,
      present,
      absent,
    };
  });
}
