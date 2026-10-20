import 'server-only'

const PACKAGE_NAMES = {
  essential: 'Essential',
  signature: 'Signature',
  atelier: 'Atelier',
}

export function createWelcomeEmail({ coupleDisplayName, packageType, accessUrl, existingUser = false }) {
  const couple = String(coupleDisplayName || '').trim() || 'milí snúbenci'
  const packageName = PACKAGE_NAMES[String(packageType || '').toLowerCase()] || 'YesDay'
  const intro = existingUser
    ? 'Váš svadobný priestor je pripravený. Pomocou tlačidla nižšie si obnovíte prístup do klientskej zóny.'
    : 'Váš svadobný priestor je pripravený. Ako prvý krok si pomocou tlačidla nižšie nastavíte heslo do klientskej zóny.'
  const buttonLabel = existingUser ? 'Obnoviť prístup' : 'Nastaviť heslo'
  const subject = `Vitajte v YesDay – váš priestor je pripravený`
  const content = `
    <p style="margin:0 0 18px">Dobrý deň, ${escapeHtml(couple)},</p>
    <p style="margin:0 0 18px">ďakujeme, že ste si pre svoj svadobný deň vybrali YesDay.</p>
    <p style="margin:0 0 18px">${escapeHtml(intro)}</p>
    <div style="margin:28px 0">
      <a href="${escapeAttribute(accessUrl)}" style="display:inline-block;background:#5f4838;color:#fffaf5;text-decoration:none;padding:13px 22px;font-size:13px;letter-spacing:.08em;text-transform:uppercase">${buttonLabel}</a>
    </div>
    <p style="margin:0 0 6px;color:#8a6f54;font-size:13px;text-transform:uppercase;letter-spacing:.08em">Váš balík</p>
    <p style="margin:0 0 22px;font-size:20px;color:#3f3128">${escapeHtml(packageName)}</p>
    <p style="margin:0 0 8px">Ak tlačidlo nefunguje, skopírujte do prehliadača tento odkaz:</p>
    <p style="margin:0;word-break:break-all;font-size:12px;color:#7b624f">${escapeHtml(accessUrl)}</p>
  `
  const text = [
    `Dobrý deň, ${couple},`,
    '',
    'ďakujeme, že ste si pre svoj svadobný deň vybrali YesDay.',
    intro,
    '',
    `${buttonLabel}: ${accessUrl}`,
    '',
    `Váš balík: ${packageName}`,
    '',
    'Tešíme sa, že môžeme byť súčasťou vašich príprav.',
    'YesDay',
  ].join('\n')

  return { subject, html: wrapEmail(content), text }
}

export function createAccommodationEmail({ subject, body }) {
  const safeBody = escapeHtml(String(body || '')).replace(/\n/g, '<br>')
  const content = `<div style="white-space:normal">${safeBody}</div>`
  return {
    subject: String(subject || '').trim(),
    html: wrapEmail(content),
    text: String(body || ''),
  }
}

function wrapEmail(content) {
  return `<!doctype html>
  <html lang="sk">
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;background:#f4efe8;color:#4f4035;font-family:Georgia,'Times New Roman',serif">
      <div style="padding:32px 14px">
        <div style="max-width:620px;margin:0 auto;background:#fffaf5;border:1px solid #e4d8ca">
          <div style="padding:24px 34px;background:#5f4838;color:#fffaf5;font-size:22px;letter-spacing:.06em">YesDay</div>
          <div style="padding:36px 34px;font-size:16px;line-height:1.7">${content}</div>
          <div style="padding:18px 34px;border-top:1px solid #eadfd3;color:#8a7768;font:12px Arial,sans-serif;line-height:1.5">
            YesDay · váš svadobný web, hostia a všetky dôležité informácie na jednom mieste
          </div>
        </div>
      </div>
    </body>
  </html>`
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function escapeAttribute(value) {
  return escapeHtml(value)
}
