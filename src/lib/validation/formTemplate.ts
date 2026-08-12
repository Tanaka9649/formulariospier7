import { z } from "zod";

export const formTemplateSchema = z.object({
  name: z.string().min(2, "Nome do template é obrigatório"),
  description: z.string().optional().nullable(),
});
export type FormTemplateInput = z.infer<typeof formTemplateSchema>;
