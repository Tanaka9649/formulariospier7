export function confirmationEmailHtml({
  brandName,
  eventPublicName,
  eventDate,
  eventLocation,
  confirmationTitle,
  confirmationMessage,
}: {
  brandName: string;
  eventPublicName: string;
  eventDate: string | null;
  eventLocation: string | null;
  confirmationTitle: string;
  confirmationMessage: string;
}): string {
  return `
  <div style="font-family: -apple-system, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
    <p style="font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 16px;">${brandName}</p>
    <h1 style="font-size: 20px; margin: 0 0 8px;">${confirmationTitle}</h1>
    <p style="font-size: 14px; color: #475569; margin: 0 0 24px;">${confirmationMessage}</p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 12px 0; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">Evento</td>
        <td style="padding: 12px 0; border-top: 1px solid #e2e8f0; font-size: 13px; text-align: right;">${eventPublicName}</td>
      </tr>
      ${
        eventDate
          ? `<tr>
        <td style="padding: 12px 0; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">Data</td>
        <td style="padding: 12px 0; border-top: 1px solid #e2e8f0; font-size: 13px; text-align: right;">${eventDate}</td>
      </tr>`
          : ""
      }
      ${
        eventLocation
          ? `<tr>
        <td style="padding: 12px 0; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">Local</td>
        <td style="padding: 12px 0; border-top: 1px solid #e2e8f0; font-size: 13px; text-align: right;">${eventLocation}</td>
      </tr>`
          : ""
      }
    </table>

    <p style="font-size: 13px; color: #475569; margin-bottom: 8px;">Seu ingresso (QR Code de entrada):</p>
    <img src="cid:ticket-qr" alt="QR Code de entrada" width="200" height="200" style="display: block; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px;" />

    <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">Apresente este QR Code na entrada do evento.</p>
  </div>
  `;
}
