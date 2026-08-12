import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: Buffer; content_id?: string }[];
}): Promise<{ sent: boolean }> {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY não configurada — e-mail não enviado:", subject, "→", to);
    return { sent: false };
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Pier7 <onboarding@resend.dev>",
      to,
      subject,
      html,
      attachments,
    });
    return { sent: true };
  } catch (error) {
    // Falha no envio de e-mail NUNCA pode derrubar a inscrição, que já foi gravada no banco.
    console.error("[email] Falha ao enviar:", error);
    return { sent: false };
  }
}
