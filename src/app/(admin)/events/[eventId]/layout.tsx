import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventById } from "@/server/events/actions";

const tabs = [
  { href: "overview", label: "Visão geral" },
  { href: "participants", label: "Participantes" },
  { href: "form-builder", label: "Formulário" },
  { href: "branding", label: "Personalização" },
  { href: "links", label: "Links" },
  { href: "attendance", label: "Presença" },
  { href: "settings", label: "Configurações" },
];

export default async function EventLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { eventId: string };
}) {
  const event = await getEventById(params.eventId);
  if (!event) notFound();

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs text-slate-500 mb-1">
          <Link href="/dashboard" className="hover:underline">
            Eventos
          </Link>{" "}
          / {event.internalName}
        </p>
        <h1 className="text-xl font-semibold">{event.publicName}</h1>
      </div>

      <nav className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={`/events/${event.id}/${tab.href}`}
            className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 whitespace-nowrap"
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
