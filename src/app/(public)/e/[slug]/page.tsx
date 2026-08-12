import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { PublicForm } from "@/components/public/PublicForm";

const closedMessages: Record<string, string> = {
  DRAFT: "As inscrições ainda não foram abertas para este evento.",
  REGISTRATION_CLOSED: "As inscrições para este evento foram encerradas.",
  FULL: "As vagas para este evento se esgotaram.",
  FINISHED: "Este evento já foi finalizado.",
};

export default async function PublicEventPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { ref?: string };
}) {
  const event = await db.event.findUnique({ where: { slug: params.slug, deletedAt: null } });
  if (!event) notFound();

  if (event.status !== "REGISTRATION_OPEN") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-semibold">{event.publicName}</h1>
          <p className="text-sm text-slate-500 mt-2">
            {closedMessages[event.status] ?? "As inscrições não estão disponíveis no momento."}
          </p>
        </div>
      </div>
    );
  }

  const refCode = searchParams.ref ?? cookies().get(`pier7_ref_${params.slug}`)?.value;
  const referralLink = refCode
    ? await db.referralLink.findUnique({
        where: { eventId_refCode: { eventId: event.id, refCode } },
      })
    : null;
  const referralLinkId = referralLink?.isActive ? referralLink.id : null;

  const [formConfig, fields, consents] = await Promise.all([
    db.formConfig.findUnique({ where: { eventId: event.id } }),
    db.formField.findMany({
      where: { eventId: event.id, status: { in: ["OPTIONAL", "REQUIRED"] } },
      orderBy: { displayOrder: "asc" },
    }),
    db.consent.findMany({ where: { eventId: event.id }, orderBy: { displayOrder: "asc" } }),
  ]);

  return (
    <PublicForm
      eventId={event.id}
      publicName={event.publicName}
      fields={fields}
      consents={consents}
      formConfig={formConfig}
      referralLinkId={referralLinkId}
    />
  );
}
