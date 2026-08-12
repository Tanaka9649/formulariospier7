import { getBranding } from "@/server/branding/actions";
import { AssetUploader } from "@/components/admin/AssetUploader";
import { ColorSettings } from "@/components/admin/ColorSettings";
import { BackgroundSettings } from "@/components/admin/BackgroundSettings";
import { AudioSettings } from "@/components/admin/AudioSettings";

export default async function BrandingPage({ params }: { params: { eventId: string } }) {
  const branding = await getBranding(params.eventId);

  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <section>
        <h2 className="text-sm font-medium text-slate-700 mb-4">Logo e favicon</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <AssetUploader
            eventId={params.eventId}
            field="logoUrl"
            label="Logotipo"
            accept="image/png,image/jpeg,image/webp"
            currentUrl={branding.logoUrl}
            preview="image"
          />
          <AssetUploader
            eventId={params.eventId}
            field="faviconUrl"
            label="Favicon (ícone da aba do navegador)"
            accept="image/png,image/x-icon,image/vnd.microsoft.icon"
            currentUrl={branding.faviconUrl}
            preview="image"
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-700 mb-4">Cores</h2>
        <ColorSettings
          eventId={params.eventId}
          defaultValues={{
            primaryColor: branding.primaryColor,
            secondaryColor: branding.secondaryColor,
            buttonColor: branding.buttonColor,
            textColor: branding.textColor,
            backgroundColor: branding.backgroundColor,
            fieldColor: branding.fieldColor,
          }}
        />
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-700 mb-4">Imagem de fundo</h2>
        <BackgroundSettings
          eventId={params.eventId}
          backgroundUrl={branding.backgroundUrl}
          defaultValues={{
            backgroundEnabled: branding.backgroundEnabled,
            backgroundBlur: branding.backgroundBlur ?? 0,
            backgroundOverlay: branding.backgroundOverlay ?? 0,
          }}
        />
      </section>

      <section>
        <h2 className="text-sm font-medium text-slate-700 mb-4">Música de fundo</h2>
        <AudioSettings
          eventId={params.eventId}
          audioUrl={branding.audioUrl}
          defaultValues={{
            audioEnabled: branding.audioEnabled,
            audioVolume: branding.audioVolume ?? 0.5,
            audioLoop: branding.audioLoop,
          }}
        />
      </section>
    </div>
  );
}
