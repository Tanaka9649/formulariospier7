"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { participantUpdateSchema, attendanceStatusEnum, type ParticipantUpdateInput } from "@/lib/validation/participant";
import { sendEmail } from "@/lib/email";
import { generateTicketQrPng } from "@/lib/qrCodeImage";
import { confirmationEmailHtml } from "@/lib/emailTemplates/confirmation";

type SubmitResult =
  | { success: true; participantId: string; isWaitlist: boolean }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

// Campo usado como identificador de duplicidade, em ordem de preferência.
const IDENTIFIER_FIELD_PRIORITY = ["email", "phone"];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export async function submitRegistration(
  eventId: string,
  answers: Record<string, string>,
  consentAnswers: Record<string, boolean>,
  referralLinkId?: string | null
): Promise<SubmitResult> {
  const event = await db.event.findUnique({ where: { id: eventId, deletedAt: null } });
  if (!event) return { success: false, error: "Evento não encontrado." };

  if (event.status !== "REGISTRATION_OPEN" && event.status !== "FULL") {
    return { success: false, error: "As inscrições não estão abertas para este evento." };
  }
  const isWaitlist = event.status === "FULL";

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

  // Nunca confia no referralLinkId vindo do client: revalida que pertence a este evento e está ativo.
  let validReferralLinkId: string | null = null;
  if (referralLinkId) {
    const link = await db.referralLink.findFirst({
      where: { id: referralLinkId, eventId, isActive: true },
    });
    validReferralLinkId = link?.id ?? null;
  }

  const result = await db.$transaction(async (tx) => {
    if (!isWaitlist && event.maxParticipants) {
      const currentCount = await tx.participant.count({
        where: {
          eventId,
          deletedAt: null,
          registrationStatus: { in: ["REGISTERED", "CONFIRMED"] },
        },
      });
      if (currentCount >= event.maxParticipants) {
        return { success: false as const, error: "As vagas para este evento se esgotaram." };
      }
    }

    const participant = await tx.participant.create({
      data: {
        eventId,
        referralLinkId: validReferralLinkId,
        registrationStatus: isWaitlist ? "WAITLISTED" : "REGISTERED",
      },
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

    if (!isWaitlist && event.maxParticipants) {
      const newCount = await tx.participant.count({
        where: {
          eventId,
          deletedAt: null,
          registrationStatus: { in: ["REGISTERED", "CONFIRMED"] },
        },
      });
      if (newCount >= event.maxParticipants && event.status === "REGISTRATION_OPEN") {
        await tx.event.update({ where: { id: eventId }, data: { status: "FULL" } });
      }
    }

    return { success: true as const, participantId: participant.id, isWaitlist };
  });

  if (result.success) {
    revalidatePath(`/events/${eventId}/participants`);
    revalidatePath(`/events/${eventId}/overview`);
    revalidatePath(`/events/${eventId}/links`);

    const recipientEmail = cleanAnswers["email"];
    if (recipientEmail) {
      try {
        const formConfig = await db.formConfig.findUnique({ where: { eventId } });

        if (result.isWaitlist) {
          const html = confirmationEmailHtml({
            brandName: event.brandName || "Pier7",
            eventPublicName: event.publicName,
            eventDate: event.date ? event.date.toLocaleDateString("pt-BR") : null,
            eventLocation: event.location,
            confirmationTitle: "Você entrou na lista de espera",
            confirmationMessage:
              "As vagas deste evento estão esgotadas no momento. Avisaremos por e-mail se surgir uma vaga.",
            showTicket: false,
          });
          await sendEmail({
            to: recipientEmail,
            subject: `Lista de espera — ${event.publicName}`,
            html,
          });
        } else {
          const qrPng = await generateTicketQrPng(`${eventId}.${result.participantId}`);
          const html = confirmationEmailHtml({
            brandName: event.brandName || "Pier7",
            eventPublicName: event.publicName,
            eventDate: event.date ? event.date.toLocaleDateString("pt-BR") : null,
            eventLocation: event.location,
            confirmationTitle: formConfig?.confirmationTitle || "Inscrição realizada com sucesso!",
            confirmationMessage: formConfig?.confirmationMessage || "Nos vemos no evento.",
            showTicket: true,
          });
          await sendEmail({
            to: recipientEmail,
            subject: `Inscrição confirmada — ${event.publicName}`,
            html,
            attachments: [{ filename: "ingresso.png", content: qrPng, content_id: "ticket-qr" }],
          });
        }
      } catch (error) {
        // Falha de e-mail é registrada mas nunca reverte ou reporta erro pro participante —
        // a inscrição já foi gravada com sucesso no banco antes deste bloco rodar.
        console.error("[submitRegistration] Falha ao enviar e-mail de confirmação:", error);
      }
    }
  }

  return result;
}

// Quando uma vaga é liberada (cancelamento ou exclusão), promove o mais antigo da lista de
// espera, um de cada vez, e reabre as inscrições se o evento estava marcado como lotado.
async function promoteFromWaitlist(eventId: string) {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event || !event.maxParticipants) return;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const activeCount = await db.participant.count({
      where: { eventId, deletedAt: null, registrationStatus: { in: ["REGISTERED", "CONFIRMED"] } },
    });
    if (activeCount >= event.maxParticipants) break;

    const nextInLine = await db.participant.findFirst({
      where: { eventId, deletedAt: null, registrationStatus: "WAITLISTED" },
      orderBy: { createdAt: "asc" },
    });
    if (!nextInLine) break;

    await db.participant.update({
      where: { id: nextInLine.id },
      data: { registrationStatus: "REGISTERED" },
    });
  }

  const stillFull = await db.event.findUnique({ where: { id: eventId } });
  if (stillFull?.status === "FULL") {
    const activeCount = await db.participant.count({
      where: { eventId, deletedAt: null, registrationStatus: { in: ["REGISTERED", "CONFIRMED"] } },
    });
    if (activeCount < event.maxParticipants) {
      await db.event.update({ where: { id: eventId }, data: { status: "REGISTRATION_OPEN" } });
    }
  }

  revalidatePath(`/events/${eventId}/participants`);
  revalidatePath(`/events/${eventId}/overview`);
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

  if (parsed.registrationStatus === "CANCELLED") {
    await promoteFromWaitlist(eventId);
  }
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
  await promoteFromWaitlist(eventId);
}

// Payload do QR Code: "<eventId>.<participantId>" — simples de propósito, pois a validação real
// de segurança é o próprio scanner só ficar acessível a admins autenticados (rota protegida
// pelo middleware). Não usamos assinatura HMAC aqui porque ninguém de fora consegue chegar
// nesta action sem estar logado — adicionar isso agora seria complexidade sem ganho real.
type CheckInResult =
  | { success: true; alreadyCheckedIn: boolean; label: string }
  | { success: false; error: string };

export async function checkInParticipant(eventId: string, qrPayload: string): Promise<CheckInResult> {
  const [payloadEventId, participantId] = qrPayload.split(".");

  if (payloadEventId !== eventId || !participantId) {
    return { success: false, error: "QR Code não pertence a este evento." };
  }

  const participant = await db.participant.findFirst({
    where: { id: participantId, eventId, deletedAt: null },
    include: { answers: { include: { formField: true } } },
  });

  if (!participant) {
    return { success: false, error: "Participante não encontrado." };
  }
  if (participant.registrationStatus === "CANCELLED") {
    return { success: false, error: "Esta inscrição foi cancelada." };
  }
  if (participant.registrationStatus === "WAITLISTED") {
    return { success: false, error: "Esta pessoa está na lista de espera, sem vaga confirmada." };
  }

  const name = participant.answers.find((a) => a.formField.fieldKey === "name")?.value;
  const label = name || "Participante";

  const alreadyCheckedIn = participant.attendanceStatus === "PRESENT";
  if (!alreadyCheckedIn) {
    await db.participant.update({
      where: { id: participant.id },
      data: { attendanceStatus: "PRESENT" },
    });
    revalidatePath(`/events/${eventId}/participants`);
    revalidatePath(`/events/${eventId}/attendance`);
    revalidatePath(`/events/${eventId}/overview`);
  }

  return { success: true, alreadyCheckedIn, label };
}
