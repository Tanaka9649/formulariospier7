import { z } from "zod";

export const certificateConfigSchema = z.object({
  enabled: z.boolean(),
  title: z.string().min(1, "Obrigatório"),
  bodyTemplate: z.string().min(1, "Obrigatório"),
  signatureName: z.string().optional().nullable(),
  signatureRole: z.string().optional().nullable(),
});
export type CertificateConfigInput = z.infer<typeof certificateConfigSchema>;
