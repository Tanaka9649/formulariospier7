import { notFound } from "next/navigation";
import { getEventById } from "@/server/events/actions";
import { getReferralLinksWithStats } from "@/server/links/actions";
import { ReferralLinksTable } from "@/components/admin/ReferralLinksTable";

export default async function LinksPage({ params }: { params: { eventId: string } }) {
  const event = await getEventById(params.eventId);
  if (!event) notFound();

  const links = await getReferralLinksWithStats(params.eventId);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-1">Links de divulgação</h2>
      <p className="text-sm text-slate-500 mb-6">
        Crie um link por convidador/parceiro e acompanhe quantas inscrições cada um gerou.
      </p>
      <ReferralLinksTable eventId={params.eventId} slug={event.slug} links={links} />
    </div>
  );
}
