import { z } from "zod";

export const referralLinkSchema = z.object({
  internalName: z.string().min(2, "Nome interno é obrigatório"),
});
export type ReferralLinkInput = z.infer<typeof referralLinkSchema>;
