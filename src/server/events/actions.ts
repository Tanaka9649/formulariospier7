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
    const registrations = event.participants.filter(
      (p) => p.registrationStatus === "REGISTERED" || p.registrationStatus === "CONFIRMED"
    );
    const waitlisted = event.participants.filter((p) => p.registrationStatus === "WAITLISTED").length;
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
      waitlisted,
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

// Duplica a estrutura de um evento (formulário, consentimentos, personalização, certificado)
// para um novo evento em rascunho. NÃO copia participantes, links de divulgação nem visitas —
// esses são dados de campanha/execução, não configuração; duplicá-los junto criaria links
// "fantasmas" e um contador de inscritos que não corresponde a nenhuma inscrição real do evento novo.
async function generateUniqueSlugFrom(baseSlug: string) {
  let candidate = `${baseSlug}-copia`;
  let counter = 2;
  while (await db.event.findUnique({ where: { slug: candidate } })) {
    candidate = `${baseSlug}-copia-${counter}`;
    counter += 1;
  }
  return candidate;
}

export async function duplicateEvent(eventId: string) {
  const source = await db.event.findUnique({
    where: { id: eventId, deletedAt: null },
    include: {
      formConfig: true,
      formFields: true,
      consents: true,
      branding: true,
      certificateConfig: true,
      ticketTypes: true,
    },
  });
  if (!source) throw new Error("Evento não encontrado.");

  const newSlug = await generateUniqueSlugFrom(source.slug);

  const newEvent = await db.$transaction(async (tx) => {
    const event = await tx.event.create({
      data: {
        slug: newSlug,
        internalName: `${source.internalName} (cópia)`,
        publicName: `${source.publicName} (cópia)`,
        date: source.date,
        time: source.time,
        location: source.location,
        description: source.description,
        summary: source.summary,
        maxParticipants: source.maxParticipants,
        brandName: source.brandName,
        status: "DRAFT",
      },
    });

    if (source.formConfig) {
      await tx.formConfig.create({
        data: {
          eventId: event.id,
          title: source.formConfig.title,
          subtitle: source.formConfig.subtitle,
          summary: source.formConfig.summary,
          additionalInfo: source.formConfig.additionalInfo,
          confirmationTitle: source.formConfig.confirmationTitle,
          confirmationMessage: source.formConfig.confirmationMessage,
        },
      });
    }

    for (const field of source.formFields) {
      await tx.formField.create({
        data: {
          eventId: event.id,
          fieldKey: field.fieldKey,
          internalName: field.internalName,
          publicLabel: field.publicLabel,
          placeholder: field.placeholder,
          fieldType: field.fieldType,
          status: field.status,
          displayOrder: field.displayOrder,
        },
      });
    }

    for (const consent of source.consents) {
      await tx.consent.create({
        data: {
          eventId: event.id,
          consentKey: consent.consentKey,
          textVersion: consent.textVersion,
          isRequired: consent.isRequired,
          displayOrder: consent.displayOrder,
        },
      });
    }

    if (source.branding) {
      await tx.branding.create({
        data: {
          eventId: event.id,
          logoUrl: source.branding.logoUrl,
          faviconUrl: source.branding.faviconUrl,
          backgroundUrl: source.branding.backgroundUrl,
          backgroundEnabled: source.branding.backgroundEnabled,
          backgroundBlur: source.branding.backgroundBlur,
          backgroundOverlay: source.branding.backgroundOverlay,
          primaryColor: source.branding.primaryColor,
          secondaryColor: source.branding.secondaryColor,
          buttonColor: source.branding.buttonColor,
          textColor: source.branding.textColor,
          backgroundColor: source.branding.backgroundColor,
          fieldColor: source.branding.fieldColor,
          audioUrl: source.branding.audioUrl,
          audioEnabled: source.branding.audioEnabled,
          audioVolume: source.branding.audioVolume,
          audioLoop: source.branding.audioLoop,
        },
      });
    }

    if (source.certificateConfig) {
      await tx.certificateConfig.create({
        data: {
          eventId: event.id,
          enabled: source.certificateConfig.enabled,
          title: source.certificateConfig.title,
          bodyTemplate: source.certificateConfig.bodyTemplate,
          signatureName: source.certificateConfig.signatureName,
          signatureRole: source.certificateConfig.signatureRole,
        },
      });
    }

    for (const ticketType of source.ticketTypes) {
      await tx.ticketType.create({
        data: {
          eventId: event.id,
          name: ticketType.name,
          description: ticketType.description,
          quota: ticketType.quota,
          isActive: ticketType.isActive,
          displayOrder: ticketType.displayOrder,
        },
      });
    }

    return event;
  });

  revalidatePath("/dashboard");
  redirect(`/events/${newEvent.id}/settings`);
}
