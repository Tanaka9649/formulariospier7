import QRCode from "qrcode";

export async function generateTicketQrPng(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, { width: 300, margin: 2 });
}
