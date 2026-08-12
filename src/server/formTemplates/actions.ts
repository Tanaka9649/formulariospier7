"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { formTemplateSchema, type FormTemplateInput } from "@/lib/validation/formTemplate";

export async function listFormTemplates() {
  const templates = await db.formTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { fields: true, consents: true } } },
  });
  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    fieldCount: t._count.fields,
    consentCount: t._count.consents,
  }));
}

export async function saveEventAsTemplate(eventId: string, input: FormTemplateInput) {
  const parsed = formTemplateSchema.parse(input);

  const [formConfig, fields, consents] = await Promise.all([
    db.formConfig.findUnique({ where: { eventId } }),
    db.formField.findMany({ where: { eventId }, orderBy: { displayOrder: "asc" } }),
    db.consent.findMany({ where: { eventId }, orderBy: { displayOrder: "asc" } }),
  ]);

  await db.formTemplate.create({
    data: {
      name: parsed.name,
      description: parsed.description,
      title: formConfig?.title,
      subtitle: formConfig?.subtitle,
      summary: formConfig?.summary,
      additionalInfo: formConfig?.additionalInfo,
      confirmationTitle: formConfig?.confirmationTitle,
      confirmationMessage: formConfig?.confirmationMessage,
      fields: {
        create: fields.map((f) => ({
          fieldKey: f.fieldKey,
          internalName: f.internalName,
          publicLabel: f.publicLabel,
          placeholder: f.placeholder,
          fieldType: f.fieldType,
          status: f.status,
          displayOrder: f.displayOrder,
        })),
      },
      consents: {
        create: consents.map((c) => ({
          consentKey: c.consentKey,
          textVersion: c.textVersion,
          isRequired: c.isRequired,
          displayOrder: c.displayOrder,
        })),
      },
    },
  });

  revalidatePath(`/events/${eventId}/form-builder`);
}

// Aplicar um template SUBSTITUI os campos/consentimentos atuais do evento. Isso é seguro só
// enquanto não houver ninguém inscrito — apagar um form_field com respostas já registradas
// apagaria essas respostas junto (cascade). Por isso bloqueamos com dado real no meio.
export async function applyTemplateToEvent(eventId: string, templateId: string) {
  const participantCount = await db.participant.count({ where: { eventId, deletedAt: null } });
  if (participantCount > 0) {
    throw new Error(
      "Este evento já tem inscrições — aplicar um template apagaria as respostas já registradas. Use em um evento sem inscrições."
    );
  }

  const template = await db.formTemplate.findUnique({
    where: { id: templateId },
    include: { fields: true, consents: true },
  });
  if (!template) throw new Error("Template não encontrado.");

  await db.$transaction(async (tx) => {
    await tx.formField.deleteMany({ where: { eventId } });
    await tx.consent.deleteMany({ where: { eventId } });

    for (const f of template.fields) {
      await tx.formField.create({
        data: {
          eventId,
          fieldKey: f.fieldKey,
          internalName: f.internalName,
          publicLabel: f.publicLabel,
          placeholder: f.placeholder,
          fieldType: f.fieldType,
          status: f.status,
          displayOrder: f.displayOrder,
        },
      });
    }

    for (const c of template.consents) {
      await tx.consent.create({
        data: {
          eventId,
          consentKey: c.consentKey,
          textVersion: c.textVersion,
          isRequired: c.isRequired,
          displayOrder: c.displayOrder,
        },
      });
    }

    await tx.formConfig.upsert({
      where: { eventId },
      update: {
        title: template.title,
        subtitle: template.subtitle,
        summary: template.summary,
        additionalInfo: template.additionalInfo,
        confirmationTitle: template.confirmationTitle,
        confirmationMessage: template.confirmationMessage,
      },
      create: {
        eventId,
        title: template.title,
        subtitle: template.subtitle,
        summary: template.summary,
        additionalInfo: template.additionalInfo,
        confirmationTitle: template.confirmationTitle,
        confirmationMessage: template.confirmationMessage,
      },
    });
  });

  revalidatePath(`/events/${eventId}/form-builder`);
}

export async function deleteFormTemplate(templateId: string) {
  await db.formTemplate.delete({ where: { id: templateId } });
}
