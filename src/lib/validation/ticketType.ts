import { z } from "zod";

export const ticketTypeSchema = z.object({
  name: z.string().min(1, "Obrigatório"),
  description: z.string().optional().nullable(),
  quota: z.coerce.number().int().positive().optional().nullable(),
});
export type TicketTypeInput = z.infer<typeof ticketTypeSchema>;
