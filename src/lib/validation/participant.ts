import { z } from "zod";

export const registrationStatusEnum = z.enum(["REGISTERED", "CONFIRMED", "CANCELLED", "WAITLISTED"]);
export const attendanceStatusEnum = z.enum(["PENDING", "PRESENT", "ABSENT"]);

export const participantUpdateSchema = z.object({
  answers: z.record(z.string(), z.string()),
  registrationStatus: registrationStatusEnum,
  attendanceStatus: attendanceStatusEnum,
});
export type ParticipantUpdateInput = z.infer<typeof participantUpdateSchema>;
