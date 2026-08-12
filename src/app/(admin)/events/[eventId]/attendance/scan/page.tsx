import { QrScanner } from "@/components/admin/QrScanner";

export default function ScanPage({ params }: { params: { eventId: string } }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Leitor de QR Code</h2>
      <QrScanner eventId={params.eventId} />
    </div>
  );
}
