import { z } from "zod";

const hexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Cor inválida");
const optionalHex = z.union([hexColor, z.literal(""), z.null()]).optional();

export const brandingColorsSchema = z.object({
  primaryColor: optionalHex,
  secondaryColor: optionalHex,
  buttonColor: optionalHex,
  textColor: optionalHex,
  backgroundColor: optionalHex,
  fieldColor: optionalHex,
});
export type BrandingColorsInput = z.infer<typeof brandingColorsSchema>;

export const backgroundSettingsSchema = z.object({
  backgroundEnabled: z.boolean(),
  backgroundBlur: z.coerce.number().int().min(0).max(20),
  backgroundOverlay: z.coerce.number().min(0).max(1),
});
export type BackgroundSettingsInput = z.infer<typeof backgroundSettingsSchema>;

export const audioSettingsSchema = z.object({
  audioEnabled: z.boolean(),
  audioVolume: z.coerce.number().min(0).max(1),
  audioLoop: z.boolean(),
});
export type AudioSettingsInput = z.infer<typeof audioSettingsSchema>;

export const assetFieldEnum = z.enum(["logoUrl", "faviconUrl", "backgroundUrl", "audioUrl"]);
export type AssetField = z.infer<typeof assetFieldEnum>;
