"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { certificateConfigSchema, type CertificateConfigInput } from "@/lib/validation/certificate";

export async function getCertificateConfig(eventId: string) {
  return db.certificateConfig.upsert({
    where: { eventId },
    update: {},
    create: { eventId },
  });
}

export async function updateCertificateConfig(eventId: string, input: CertificateConfigInput) {
  const parsed = certificateConfigSchema.parse(input);
  await db.certificateConfig.upsert({
    where: { eventId },
    update: parsed,
    create: { eventId, ...parsed },
  });
  revalidatePath(`/events/${eventId}/settings`);
  revalidatePath(`/events/${eventId}/participants`);
}
