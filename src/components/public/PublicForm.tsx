"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { submitRegistration } from "@/server/participants/actions";
import { AudioPlayer } from "@/components/public/AudioPlayer";

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

type BrandingData = {
  logoUrl: string | null;
  backgroundUrl: string | null;
  backgroundEnabled: boolean;
  backgroundBlur: number;
  backgroundOverlay: number;
  primaryColor: string | null;
  secondaryColor: string | null;
  buttonColor: string | null;
  textColor: string | null;
  backgroundColor: string | null;
  fieldColor: string | null;
  audioUrl: string | null;
  audioEnabled: boolean;
  audioVolume: number;
  audioLoop: boolean;
} | null;

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
  branding,
  referralLinkId,
}: {
  eventId: string;
  publicName: string;
  fields: Field[];
  consents: ConsentItem[];
  formConfig: FormConfigData | null;
  branding?: BrandingData;
  referralLinkId?: string | null;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [consentValues, setConsentValues] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const pageStyle: React.CSSProperties = {
    backgroundColor: branding?.backgroundColor || "#f8fafc",
    color: branding?.textColor || undefined,
  };
  const cardStyle: React.CSSProperties = {
    backgroundColor: branding?.fieldColor ? undefined : "#ffffff",
  };
  const buttonStyle: React.CSSProperties = branding?.buttonColor
    ? { backgroundColor: branding.buttonColor, borderColor: branding.buttonColor }
    : {};

  const showBackground = branding?.backgroundEnabled && branding.backgroundUrl;

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
    <div className="min-h-screen relative flex items-center justify-center p-6" style={pageStyle}>
      {showBackground && (
        <div className="absolute inset-0 overflow-hidden -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={branding!.backgroundUrl!}
            alt=""
            className="w-full h-full object-cover"
            style={{ filter: `blur(${branding!.backgroundBlur}px)` }}
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: branding!.backgroundOverlay }}
          />
        </div>
      )}

      {branding?.audioUrl && branding.audioEnabled && (
        <AudioPlayer url={branding.audioUrl} volume={branding.audioVolume} loop={branding.audioLoop} />
      )}

      {success ? (
        <div
          className="max-w-md text-center bg-white border border-slate-200 rounded-lg p-8"
          style={cardStyle}
        >
          {branding?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt="" className="h-12 mx-auto mb-4 object-contain" />
          )}
          <h1 className="text-xl font-semibold mb-2">
            {formConfig?.confirmationTitle || "Inscrição realizada com sucesso!"}
          </h1>
          <p className="text-sm text-slate-600">
            {formConfig?.confirmationMessage || "Nos vemos no evento."}
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg bg-white border border-slate-200 rounded-lg p-6 sm:p-8"
          style={cardStyle}
        >
          {branding?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoUrl} alt="" className="h-12 mb-4 object-contain" />
          )}

          <h1 className="text-xl font-semibold mb-1" style={{ color: branding?.primaryColor || undefined }}>
            {formConfig?.title || publicName}
          </h1>
          {formConfig?.subtitle && (
            <p className="text-sm mb-4" style={{ color: branding?.secondaryColor || "#64748b" }}>
              {formConfig.subtitle}
            </p>
          )}
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
                  style={branding?.fieldColor ? { backgroundColor: branding.fieldColor } : undefined}
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

          <Button type="submit" disabled={submitting} className="w-full" style={buttonStyle}>
            {submitting ? "Enviando..." : "Confirmar inscrição"}
          </Button>
        </form>
      )}
    </div>
  );
}
