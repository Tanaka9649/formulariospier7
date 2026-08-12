"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  formFieldUpdateSchema,
  consentUpdateSchema,
  formConfigUpdateSchema,
  type FormFieldUpdateInput,
  type ConsentUpdateInput,
  type FormConfigUpdateInput,
} from "@/lib/validation/formBuilder";

// Campos e consentimentos padrão criados automaticamente quando um evento é criado.
// fieldType fica pronto para expansão futura (select, date, etc.) sem mudar a tabela.
const DEFAULT_FIELDS = [
  { fieldKey: "name", internalName: "Nome", publicLabel: "Nome completo", placeholder: "Digite seu nome", fieldType: "text", status: "REQUIRED" as const, displayOrder: 0 },
  { fieldKey: "email", internalName: "E-mail", publicLabel: "E-mail", placeholder: "seu@email.com", fieldType: "email", status: "REQUIRED" as const, displayOrder: 1 },
  { fieldKey: "phone", internalName: "Telefone", publicLabel: "Telefone / WhatsApp", placeholder: "(00) 00000-0000", fieldType: "phone", status: "REQUIRED" as const, displayOrder: 2 },
  { fieldKey: "company", internalName: "Empresa", publicLabel: "Empresa", placeholder: "Nome da empresa", fieldType: "text", status: "OPTIONAL" as const, displayOrder: 3 },
];

const DEFAULT_CONSENTS = [
  {
    consentKey: "data_processing",
    textVersion: "Concordo com o tratamento dos meus dados conforme informado.",
    isRequired: true,
    displayOrder: 0,
  },
  {
    consentKey: "future_contact",
    textVersion: "Aceito receber posteriormente contatos, conteúdos, convites ou informações que possam ser úteis para mim.",
    isRequired: false,
    displayOrder: 1,
  },
];

// Idempotente: chamado logo após a criação do evento. Se algo já existir, não duplica.
export async function ensureDefaultFormSetup(eventId: string) {
  await db.formConfig.upsert({
    where: { eventId },
    update: {},
    create: {
      eventId,
      confirmationTitle: "Inscrição realizada com sucesso!",
      confirmationMessage: "Nos vemos no evento.",
    },
  });

  for (const field of DEFAULT_FIELDS) {
    await db.formField.upsert({
      where: { eventId_fieldKey: { eventId, fieldKey: field.fieldKey } },
      update: {},
      create: { eventId, ...field },
    });
  }

  for (const consent of DEFAULT_CONSENTS) {
    await db.consent.upsert({
      where: { eventId_consentKey: { eventId, consentKey: consent.consentKey } },
      update: {},
      create: { eventId, ...consent },
    });
  }
}

export async function getFormBuilderData(eventId: string) {
  const [formConfig, fields, consents] = await Promise.all([
    db.formConfig.findUnique({ where: { eventId } }),
    db.formField.findMany({ where: { eventId }, orderBy: { displayOrder: "asc" } }),
    db.consent.findMany({ where: { eventId }, orderBy: { displayOrder: "asc" } }),
  ]);

  return { formConfig, fields, consents };
}

export async function updateFormField(eventId: string, fieldId: string, input: FormFieldUpdateInput) {
  const parsed = formFieldUpdateSchema.parse(input);
  await db.formField.update({ where: { id: fieldId }, data: parsed });
  revalidatePath(`/events/${eventId}/form-builder`);
}

export async function updateConsent(eventId: string, consentId: string, input: ConsentUpdateInput) {
  const parsed = consentUpdateSchema.parse(input);
  await db.consent.update({ where: { id: consentId }, data: parsed });
  revalidatePath(`/events/${eventId}/form-builder`);
}

export async function updateFormConfig(eventId: string, input: FormConfigUpdateInput) {
  const parsed = formConfigUpdateSchema.parse(input);
  await db.formConfig.upsert({
    where: { eventId },
    update: parsed,
    create: { eventId, ...parsed },
  });
  revalidatePath(`/events/${eventId}/form-builder`);
}
