import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawCentered(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color = rgb(0.06, 0.09, 0.16)) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (page.getWidth() - width) / 2, y, size, font, color });
}

export async function generateCertificatePdf({
  participantName,
  eventName,
  eventDate,
  title,
  bodyTemplate,
  signatureName,
  signatureRole,
}: {
  participantName: string;
  eventName: string;
  eventDate: string;
  title: string;
  bodyTemplate: string;
  signatureName?: string | null;
  signatureRole?: string | null;
}): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 paisagem em pontos
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();

  // Moldura simples
  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    borderColor: rgb(0.85, 0.87, 0.9),
    borderWidth: 2,
  });

  drawCentered(page, title, height - 140, fontBold, 28);

  const bodyText = bodyTemplate
    .replaceAll("{{nome}}", participantName)
    .replaceAll("{{evento}}", eventName)
    .replaceAll("{{data}}", eventDate);

  const lines = wrapText(bodyText, font, 16, width - 200);
  let y = height / 2 + (lines.length * 24) / 2;
  for (const line of lines) {
    drawCentered(page, line, y, font, 16, rgb(0.28, 0.34, 0.42));
    y -= 24;
  }

  if (signatureName) {
    const sigY = 110;
    page.drawLine({
      start: { x: width / 2 - 100, y: sigY },
      end: { x: width / 2 + 100, y: sigY },
      thickness: 1,
      color: rgb(0.6, 0.65, 0.7),
    });
    drawCentered(page, signatureName, sigY - 20, fontBold, 12);
    if (signatureRole) {
      drawCentered(page, signatureRole, sigY - 36, font, 10, rgb(0.45, 0.5, 0.56));
    }
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
