"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { createReferralLink, toggleReferralLink } from "@/server/links/actions";

type LinkRow = {
  id: string;
  internalName: string;
  refCode: string;
  isActive: boolean;
  registrations: number;
  present: number;
  absent: number;
};

export function ReferralLinksTable({ eventId, slug, links }: { eventId: string; slug: string; links: LinkRow[] }) {
  const router = useRouter();
  const [internalName, setInternalName] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const buildUrl = (refCode: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/e/${slug}?ref=${refCode}`;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalName.trim()) return;
    setCreating(true);
    try {
      await createReferralLink(eventId, { internalName: internalName.trim() });
      setInternalName("");
      router.refresh();
    } finally {
      setCreating(false);
    }
  };

  const copy = async (link: LinkRow) => {
    await navigator.clipboard.writeText(buildUrl(link.refCode));
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div>
      <form onSubmit={handleCreate} className="flex items-end gap-2 mb-6 max-w-md">
        <div className="flex-1">
          <Input
            label="Novo link — nome interno"
            placeholder="Ex: Fernanda, Parceiro XPTO..."
            value={internalName}
            onChange={(e) => setInternalName(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={creating}>
          {creating ? "Criando..." : "Criar link"}
        </Button>
      </form>

      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
              <th className="p-3">Nome</th>
              <th className="p-3">Link</th>
              <th className="p-3">Inscrições</th>
              <th className="p-3">Presentes</th>
              <th className="p-3">Ausentes</th>
              <th className="p-3">Ativo</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.id} className="border-b border-slate-100 last:border-0">
                <td className="p-3 font-medium">{link.internalName}</td>
                <td className="p-3 text-slate-500 max-w-[220px] truncate">/e/{slug}?ref={link.refCode}</td>
                <td className="p-3">{link.registrations}</td>
                <td className="p-3">{link.present}</td>
                <td className="p-3">{link.absent}</td>
                <td className="p-3">
                  <Switch
                    checked={link.isActive}
                    onChange={async (value) => {
                      await toggleReferralLink(eventId, link.id, value);
                      router.refresh();
                    }}
                  />
                </td>
                <td className="p-3 text-right">
                  <button className="text-xs text-slate-500 hover:text-slate-900" onClick={() => copy(link)}>
                    {copiedId === link.id ? "Copiado ✓" : "Copiar"}
                  </button>
                </td>
              </tr>
            ))}
            {links.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400 text-sm">
                  Nenhum link criado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
