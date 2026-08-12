"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { submitRegistration } from "@/server/participants/actions";

type FieldType = "text" | "email" | "phone" | string;

type Field = {
  id: string;
  fieldKey: string;
  publicLabel: string;
  placeholder: string | null;
  fieldType: FieldType;
  status: "OPTIONAL" | "REQUIRED";
};

type ConsentItem = {
  id: string;
  consentKey: string;
  textVersion: string;
  isRequired: boolean;
};

type FormConfigData = {
  title: string | null;
  subtitle: string | null;
  summary: string | null;
  additionalInfo: string | null;
  confirmationTitle: string | null;
  confirmationMessage: string | null;
};

const inputTypeMap: Record<string, string> = {
  email: "email",
  phone: "tel",
};

export function PublicForm({
  eventId,
  publicName,
  fields,
  consents,
  formConfig,
  referralLinkId,
}: {
  eventId: string;
  publicName: string;
  fields: Field[];
  consents: ConsentItem[];
  formConfig: FormConfigData | null;
  referralLinkId?: string | null;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [consentValues, setConsentValues] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">
            {formConfig?.confirmationTitle || "Inscrição realizada com sucesso!"}
          </h1>
          <p className="text-sm text-slate-600">
            {formConfig?.confirmationMessage || "Nos vemos no evento."}
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setGeneralError(null);
    setErrors({});

    const result = await submitRegistration(eventId, values, consentValues, referralLinkId ?? null);

    if (!result.success) {
      setGeneralError(result.error);
      if (result.fieldErrors) setErrors(result.fieldErrors);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white border border-slate-200 rounded-lg p-6 sm:p-8"
      >
        <h1 className="text-xl font-semibold mb-1">{formConfig?.title || publicName}</h1>
        {formConfig?.subtitle && <p className="text-sm text-slate-500 mb-4">{formConfig.subtitle}</p>}
        {formConfig?.summary && <p className="text-sm text-slate-600 mb-6">{formConfig.summary}</p>}

        {generalError && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-md mb-4">{generalError}</div>
        )}

        <div className="flex flex-col gap-4 mb-6">
          {fields.map((field) => (
            <div key={field.id} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">
                {field.publicLabel}
                {field.status === "REQUIRED" && <span className="text-red-500"> *</span>}
              </label>
              <input
                type={inputTypeMap[field.fieldType] || "text"}
                placeholder={field.placeholder ?? undefined}
                value={values[field.fieldKey] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.fieldKey]: e.target.value }))}
                className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              {errors[field.fieldKey] && (
                <span className="text-xs text-red-600">{errors[field.fieldKey]}</span>
              )}
            </div>
          ))}
        </div>

        {consents.length > 0 && (
          <div className="flex flex-col gap-3 mb-6">
            {consents.map((consent) => (
              <div key={consent.id}>
                <label className="flex items-start gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={!!consentValues[consent.consentKey]}
                    onChange={(e) =>
                      setConsentValues((v) => ({ ...v, [consent.consentKey]: e.target.checked }))
                    }
                  />
                  <span>
                    {consent.textVersion}
                    {consent.isRequired && <span className="text-red-500"> *</span>}
                  </span>
                </label>
                {errors[`consent_${consent.consentKey}`] && (
                  <span className="text-xs text-red-600 ml-6">{errors[`consent_${consent.consentKey}`]}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Enviando..." : "Confirmar inscrição"}
        </Button>
      </form>
    </div>
  );
}
