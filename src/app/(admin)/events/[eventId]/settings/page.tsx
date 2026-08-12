import { notFound } from "next/navigation";
import { getEventById } from "@/server/events/actions";
import { getCertificateConfig } from "@/server/certificates/actions";
import { EventSettingsForm } from "./EventSettingsForm";
import { CertificateSettings } from "@/components/admin/CertificateSettings";

export default async function EventSettingsPage({ params }: { params: { eventId: string } }) {
  const event = await getEventById(params.eventId);
  if (!event) notFound();

  const certConfig = await getCertificateConfig(params.eventId);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h2 className="text-lg font-semibold mb-6">Configurações</h2>
        <EventSettingsForm
          eventId={event.id}
          defaultValues={{
            internalName: event.internalName,
            publicName: event.publicName,
            slug: event.slug,
            date: event.date ? event.date.toISOString().slice(0, 10) : undefined,
            time: event.time ?? undefined,
            location: event.location ?? undefined,
            description: event.description ?? undefined,
            summary: event.summary ?? undefined,
            maxParticipants: event.maxParticipants ?? undefined,
            brandName: event.brandName ?? undefined,
            status: event.status,
          }}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">Certificado de participação</h2>
        <p className="text-sm text-slate-500 mb-6">
          Disponível para download (em PDF) pela tabela de participantes, apenas para quem tiver presença confirmada.
        </p>
        <CertificateSettings
          eventId={params.eventId}
          defaultValues={{
            enabled: certConfig.enabled,
            title: certConfig.title,
            bodyTemplate: certConfig.bodyTemplate,
            signatureName: certConfig.signatureName,
            signatureRole: certConfig.signatureRole,
          }}
        />
      </div>
    </div>
  );
}
