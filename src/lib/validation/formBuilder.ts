import { z } from "zod";

export const formFieldUpdateSchema = z.object({
  publicLabel: z.string().min(1, "Obrigatório"),
  placeholder: z.string().optional().nullable(),
  status: z.enum(["INACTIVE", "OPTIONAL", "REQUIRED"]),
});
export type FormFieldUpdateInput = z.infer<typeof formFieldUpdateSchema>;

export const consentUpdateSchema = z.object({
  textVersion: z.string().min(1, "Obrigatório"),
  isRequired: z.boolean(),
});
export type ConsentUpdateInput = z.infer<typeof consentUpdateSchema>;

export const formConfigUpdateSchema = z.object({
  title: z.string().optional().nullable(),
  subtitle: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  additionalInfo: z.string().optional().nullable(),
  confirmationTitle: z.string().optional().nullable(),
  confirmationMessage: z.string().optional().nullable(),
});
export type FormConfigUpdateInput = z.infer<typeof formConfigUpdateSchema>;
