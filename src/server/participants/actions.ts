"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { participantUpdateSchema, attendanceStatusEnum, type ParticipantUpdateInput } from "@/lib/validation/participant";

type SubmitResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

// Campo usado como identificador de duplicidade, em ordem de preferência.
const IDENTIFIER_FIELD_PRIORITY = ["email", "phone"];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export async function submitRegistration(
  eventId: string,
  answers: Record<string, string>,
  consentAnswers: Record<string, boolean>
): Promise<SubmitResult> {
  const event = await db.event.findUnique({ where: { id: eventId, deletedAt: null } });
  if (!event) return { success: false, error: "Evento não encontrado." };

  if (event.status !== "REGISTRATION_OPEN") {
    return { success: false, error: "As inscrições não estão abertas para este evento." };
  }

  const [fields, consents] = await Promise.all([
    db.formField.findMany({ where: { eventId, status: { in: ["OPTIONAL", "REQUIRED"] } } }),
    db.consent.findMany({ where: { eventId } }),
  ]);

  // Validação server-side autoritativa — nunca confia no que veio do client.
  const fieldErrors: Record<string, string> = {};
  const cleanAnswers: Record<string, string> = {};

  for (const field of fields) {
    const raw = (answers[field.fieldKey] ?? "").trim();

    if (field.status === "REQUIRED" && !raw) {
      fieldErrors[field.fieldKey] = "Campo obrigatório.";
      continue;
    }
    if (!raw) continue;

    if (field.fieldType === "email" && raw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      fieldErrors[field.fieldKey] = "E-mail inválido.";
      continue;
    }

    cleanAnswers[field.fieldKey] = raw;
  }

  for (const consent of consents) {
    if (consent.isRequired && !consentAnswers[consent.consentKey]) {
      fieldErrors[`consent_${consent.consentKey}`] = "É necessário aceitar para continuar.";
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { success: false, error: "Verifique os campos destacados.", fieldErrors };
  }

  // Duplicidade: usa o primeiro campo identificador ativo (email, depois telefone).
  const identifierKey = IDENTIFIER_FIELD_PRIORITY.find((key) => cleanAnswers[key]);
  if (identifierKey) {
    const identifierValue = normalize(cleanAnswers[identifierKey]);
    const existing = await db.participantAnswer.findFirst({
      where: {
        formField: { eventId, fieldKey: identifierKey },
        value: { equals: identifierValue, mode: "insensitive" },
        participant: { deletedAt: null, registrationStatus: { not: "CANCELLED" } },
      },
    });
    if (existing) {
      return {
        success: false,
        error: "Você já está inscrito neste evento.",
        fieldErrors: { [identifierKey]: "Já inscrito com este valor." },
      };
    }
  }

  const result = await db.$transaction(async (tx) => {
    if (event.maxParticipants) {
      const currentCount = await tx.participant.count({
        where: { eventId, deletedAt: null, registrationStatus: { not: "CANCELLED" } },
      });
      if (currentCount >= event.maxParticipants) {
        return { success: false as const, error: "As vagas para este evento se esgotaram." };
      }
    }

    const participant = await tx.participant.create({
      data: { eventId },
    });

    for (const field of fields) {
      const value = cleanAnswers[field.fieldKey];
      if (value === undefined) continue;
      await tx.participantAnswer.create({
        data: { participantId: participant.id, formFieldId: field.id, value },
      });
    }

    for (const consent of consents) {
      await tx.participantConsent.create({
        data: {
          participantId: participant.id,
          consentId: consent.id,
          accepted: !!consentAnswers[consent.consentKey],
        },
      });
    }

    if (event.maxParticipants) {
      const newCount = await tx.participant.count({
        where: { eventId, deletedAt: null, registrationStatus: { not: "CANCELLED" } },
      });
      if (newCount >= event.maxParticipants && event.status === "REGISTRATION_OPEN") {
        await tx.event.update({ where: { id: eventId }, data: { status: "FULL" } });
      }
    }

    return { success: true as const };
  });

  if (result.success) {
    revalidatePath(`/events/${eventId}/participants`);
    revalidatePath(`/events/${eventId}/overview`);
  }

  return result;
}

export async function updateParticipant(eventId: string, participantId: string, input: ParticipantUpdateInput) {
  const parsed = participantUpdateSchema.parse(input);

  const fields = await db.formField.findMany({ where: { eventId } });
  const fieldByKey = new Map(fields.map((f) => [f.fieldKey, f]));

  await db.$transaction(async (tx) => {
    await tx.participant.updateMany({
      where: { id: participantId, eventId },
      data: {
        registrationStatus: parsed.registrationStatus,
        attendanceStatus: parsed.attendanceStatus,
      },
    });

    for (const [fieldKey, value] of Object.entries(parsed.answers)) {
      const field = fieldByKey.get(fieldKey);
      if (!field) continue;
      await tx.participantAnswer.upsert({
        where: { participantId_formFieldId: { participantId, formFieldId: field.id } },
        update: { value },
        create: { participantId, formFieldId: field.id, value },
      });
    }
  });

  revalidatePath(`/events/${eventId}/participants`);
}

export async function bulkMarkAttendance(
  eventId: string,
  participantIds: string[],
  attendanceStatus: "PENDING" | "PRESENT" | "ABSENT"
) {
  const status = attendanceStatusEnum.parse(attendanceStatus);
  await db.participant.updateMany({
    where: { id: { in: participantIds }, eventId },
    data: { attendanceStatus: status },
  });
  revalidatePath(`/events/${eventId}/participants`);
  revalidatePath(`/events/${eventId}/overview`);
}

export async function deleteParticipant(eventId: string, participantId: string) {
  await db.participant.updateMany({
    where: { id: participantId, eventId },
    data: { deletedAt: new Date() },
  });
  revalidatePath(`/events/${eventId}/participants`);
  revalidatePath(`/events/${eventId}/overview`);
}
