import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateCertificatePdf } from "@/lib/certificatePdf";

export async function GET(
  request: Request,
  { params }: { params: { eventId: string; participantId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [event, certConfig, participant] = await Promise.all([
    db.event.findUnique({ where: { id: params.eventId, deletedAt: null } }),
    db.certificateConfig.findUnique({ where: { eventId: params.eventId } }),
    db.participant.findFirst({
      where: { id: params.participantId, eventId: params.eventId, deletedAt: null },
      include: { answers: { include: { formField: true } } },
    }),
  ]);

  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  if (!certConfig?.enabled) {
    return NextResponse.json({ error: "Certificados não estão habilitados para este evento." }, { status: 400 });
  }
  if (!participant) return NextResponse.json({ error: "Participante não encontrado." }, { status: 404 });
  if (participant.attendanceStatus !== "PRESENT") {
    return NextResponse.json(
      { error: "Certificado disponível apenas para participantes com presença confirmada." },
      { status: 400 }
    );
  }

  const name = participant.answers.find((a) => a.formField.fieldKey === "name")?.value || "Participante";

  const pdfBuffer = await generateCertificatePdf({
    participantName: name,
    eventName: event.publicName,
    eventDate: event.date ? event.date.toLocaleDateString("pt-BR") : "",
    title: certConfig.title,
    bodyTemplate: certConfig.bodyTemplate,
    signatureName: certConfig.signatureName,
    signatureRole: certConfig.signatureRole,
  });

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="certificado-${name.replace(/\s+/g, "-").toLowerCase()}.pdf"`,
    },
  });
}
