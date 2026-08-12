import { db } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function PublicEventPage({ params }: { params: { slug: string } }) {
  const event = await db.event.findUnique({ where: { slug: params.slug, deletedAt: null } });
  if (!event) notFound();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold">{event.publicName}</h1>
        <p className="text-sm text-slate-500 mt-2">
          Formulário de inscrição em construção — chega na Etapa 3.
        </p>
      </div>
    </div>
  );
}
