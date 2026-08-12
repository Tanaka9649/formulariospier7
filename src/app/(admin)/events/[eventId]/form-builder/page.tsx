import { getFormBuilderData } from "@/server/forms/actions";
import { getTicketTypesWithStats } from "@/server/ticketTypes/actions";
import { listFormTemplates } from "@/server/formTemplates/actions";
import { db } from "@/lib/db";
import { FormFieldRow } from "@/components/admin/FormFieldRow";
import { ConsentRow } from "@/components/admin/ConsentRow";
import { FormConfigEditor } from "@/components/admin/FormConfigEditor";
import { TicketTypesTable } from "@/components/admin/TicketTypesTable";
import { TemplatesSection } from "@/components/admin/TemplatesSection";

export default async function FormBuilderPage({ params }: { params: { eventId: string } }) {
  const { formConfig, fields, consents } = await getFormBuilderData(params.eventId);
  const ticketTypes = await getTicketTypesWithStats(params.eventId);
  const templates = await listFormTemplates();
  const participantCount = await db.participant.count({
    where: { eventId: params.eventId, deletedAt: null },
  });

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="text-sm font-medium text-slate-700 mb-1">Templates de formulário</h2>
        <p className="text-xs text-slate-500 mb-4">
          Reaproveite a configuração de campos e textos entre eventos, sem duplicar o evento inteiro.
        </p>
        <TemplatesSection eventId={params.eventId} templates={templates} hasParticipants={participantCount > 0} />
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-700 mb-1">Tipos de ingresso</h2>
        <p className="text-xs text-slate-500 mb-4">
          Opcional. Se criar pelo menos um tipo, a escolha vira obrigatória no formulário público.
          Cada tipo pode ter sua própria cota, independente do limite geral do evento.
        </p>
        <TicketTypesTable eventId={params.eventId} ticketTypes={ticketTypes} />
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-700 mb-1">Campos do formulário</h2>
        <p className="text-xs text-slate-500 mb-4">
          Defina o texto exibido, o placeholder e se o campo é desativado, opcional ou obrigatório.
        </p>
        <div className="grid grid-cols-12 gap-3 text-xs text-slate-400 px-0 mb-1">
          <span className="col-span-2">Campo</span>
          <span className="col-span-3">Label público</span>
          <span className="col-span-3">Placeholder</span>
          <span className="col-span-2">Status</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg px-4">
          {fields.map((field) => (
            <FormFieldRow key={field.id} eventId={params.eventId} field={field} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-700 mb-1">Consentimentos</h2>
        <p className="text-xs text-slate-500 mb-4">
          Textos de consentimento exibidos no formulário. Editáveis livremente.
        </p>
        <div className="bg-white border border-slate-200 rounded-lg px-4">
          {consents.map((consent) => (
            <ConsentRow key={consent.id} eventId={params.eventId} consent={consent} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-700 mb-4">Textos do formulário</h2>
        <FormConfigEditor
          eventId={params.eventId}
          defaultValues={{
            title: formConfig?.title ?? "",
            subtitle: formConfig?.subtitle ?? "",
            summary: formConfig?.summary ?? "",
            additionalInfo: formConfig?.additionalInfo ?? "",
            confirmationTitle: formConfig?.confirmationTitle ?? "",
            confirmationMessage: formConfig?.confirmationMessage ?? "",
          }}
        />
      </section>
    </div>
  );
}
