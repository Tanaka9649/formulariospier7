import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { PublicForm } from "@/components/public/PublicForm";
import { getActiveTicketTypes } from "@/server/ticketTypes/actions";

const closedMessages: Record<string, string> = {
  DRAFT: "As inscrições ainda não foram abertas para este evento.",
  REGISTRATION_CLOSED: "As inscrições para este evento foram encerradas.",
  FINISHED: "Este evento já foi finalizado.",
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const event = await db.event.findUnique({
    where: { slug: params.slug, deletedAt: null },
    select: { publicName: true, brandName: true, branding: { select: { faviconUrl: true } } },
  });
  if (!event) return {};

  return {
    title: `${event.publicName} — ${event.brandName || "Pier7"}`,
    icons: event.branding?.faviconUrl ? { icon: event.branding.faviconUrl } : undefined,
  };
}

export default async function PublicEventPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { ref?: string };
}) {
  const event = await db.event.findUnique({ where: { slug: params.slug, deletedAt: null } });
  if (!event) notFound();

  const isWaitlistMode = event.status === "FULL";

  if (event.status !== "REGISTRATION_OPEN" && !isWaitlistMode) {
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

  const [formConfig, fields, consents, branding, ticketTypes] = await Promise.all([
    db.formConfig.findUnique({ where: { eventId: event.id } }),
    db.formField.findMany({
      where: { eventId: event.id, status: { in: ["OPTIONAL", "REQUIRED"] } },
      orderBy: { displayOrder: "asc" },
    }),
    db.consent.findMany({ where: { eventId: event.id }, orderBy: { displayOrder: "asc" } }),
    db.branding.findUnique({ where: { eventId: event.id } }),
    getActiveTicketTypes(event.id),
  ]);

  return (
    <PublicForm
      eventId={event.id}
      publicName={event.publicName}
      fields={fields}
      consents={consents}
      formConfig={formConfig}
      branding={branding}
      referralLinkId={referralLinkId}
      waitlistMode={isWaitlistMode}
      ticketTypes={ticketTypes}
    />
  );
}
