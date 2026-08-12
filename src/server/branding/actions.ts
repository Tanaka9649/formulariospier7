"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  brandingColorsSchema,
  backgroundSettingsSchema,
  audioSettingsSchema,
  assetFieldEnum,
  type BrandingColorsInput,
  type BackgroundSettingsInput,
  type AudioSettingsInput,
  type AssetField,
} from "@/lib/validation/branding";

export async function getBranding(eventId: string) {
  return db.branding.upsert({
    where: { eventId },
    update: {},
    create: { eventId },
  });
}

export async function saveBrandingAsset(eventId: string, field: AssetField, url: string) {
  const parsedField = assetFieldEnum.parse(field);

  const data =
    parsedField === "logoUrl"
      ? { logoUrl: url }
      : parsedField === "faviconUrl"
      ? { faviconUrl: url }
      : parsedField === "backgroundUrl"
      ? { backgroundUrl: url }
      : { audioUrl: url };

  await db.branding.upsert({
    where: { eventId },
    update: data,
    create: { eventId, ...data },
  });
  await db.asset.create({ data: { eventId, url, type: parsedField.replace("Url", "").toLowerCase() } });
  revalidatePath(`/events/${eventId}/branding`);
  const event = await db.event.findUnique({ where: { id: eventId }, select: { slug: true } });
  if (event) revalidatePath(`/e/${event.slug}`);
}

export async function updateBrandingColors(eventId: string, input: BrandingColorsInput) {
  const parsed = brandingColorsSchema.parse(input);
  const clean = Object.fromEntries(
    Object.entries(parsed).map(([k, v]) => [k, v === "" ? null : v])
  );
  await db.branding.upsert({ where: { eventId }, update: clean, create: { eventId, ...clean } });
  revalidatePath(`/events/${eventId}/branding`);
}

export async function updateBackgroundSettings(eventId: string, input: BackgroundSettingsInput) {
  const parsed = backgroundSettingsSchema.parse(input);
  await db.branding.upsert({ where: { eventId }, update: parsed, create: { eventId, ...parsed } });
  revalidatePath(`/events/${eventId}/branding`);
}

export async function updateAudioSettings(eventId: string, input: AudioSettingsInput) {
  const parsed = audioSettingsSchema.parse(input);
  await db.branding.upsert({ where: { eventId }, update: parsed, create: { eventId, ...parsed } });
  revalidatePath(`/events/${eventId}/branding`);
}
