import { getParticipantsPage } from "@/server/participants/queries";
import { getCertificateConfig } from "@/server/certificates/actions";
import { ParticipantsTable } from "@/components/admin/ParticipantsTable";

export default async function ParticipantsPage({
  params,
  searchParams,
}: {
  params: { eventId: string };
  searchParams: { [key: string]: string | undefined };
}) {
  const page = Number(searchParams.page ?? "1") || 1;

  const [{ rows, fields, total, pageSize }, certConfig] = await Promise.all([
    getParticipantsPage(
      params.eventId,
      {
        search: searchParams.search,
        registrationStatus: (searchParams.registrationStatus as any) ?? "ALL",
        attendanceStatus: (searchParams.attendanceStatus as any) ?? "ALL",
        sortDir: (searchParams.sortDir as "asc" | "desc") ?? "desc",
      },
      page
    ),
    getCertificateConfig(params.eventId),
  ]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Participantes</h2>
      <ParticipantsTable
        eventId={params.eventId}
        fields={fields}
        rows={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
        total={total}
        page={page}
        pageSize={pageSize}
        certificateEnabled={certConfig.enabled}
      />
    </div>
  );
}
