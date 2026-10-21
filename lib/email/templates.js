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
    <div style="margin:32px 0 34px">
      <a href="${escapeAttribute(accessUrl)}" style="display:inline-block;background:#65545b;color:#ffffff;text-decoration:none;padding:14px 25px;font-family:Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:.12em;text-transform:uppercase">${buttonLabel}</a>
    </div>
    <div style="margin:0 0 28px;padding:18px 20px;background:#f7f2ef;border-left:2px solid #c9aeb1">
      <p style="margin:0 0 5px;color:#9b777c;font-family:Arial,sans-serif;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.16em">Váš balík</p>
      <p style="margin:0;font-size:21px;color:#393337">${escapeHtml(packageName)}</p>
    </div>
    <p style="margin:0 0 7px;color:#71696b;font-family:Arial,sans-serif;font-size:12px">Ak tlačidlo nefunguje, skopírujte do prehliadača tento odkaz:</p>
    <p style="margin:0;word-break:break-all;font-family:Arial,sans-serif;font-size:11px;line-height:1.6;color:#8c7f82">${escapeHtml(accessUrl)}</p>
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
    <body style="margin:0;background:#f5f2ef;color:#454043;font-family:Georgia,'Times New Roman',serif">
      <div style="padding:42px 14px">
        <div style="max-width:620px;margin:0 auto;background:#fffdfb;border:1px solid #ebe3df;box-shadow:0 16px 46px rgba(61,49,53,.06)">
          <div style="padding:38px 38px 24px;text-align:center">
            <div style="color:#a47f84;font-family:Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:.3em;text-transform:uppercase">Svadobný priestor</div>
            <div style="margin-top:9px;color:#302b2e;font-size:30px;letter-spacing:.04em">YesDay</div>
            <div style="width:42px;height:1px;margin:22px auto 0;background:#d8c3c4"></div>
          </div>
          <div style="padding:18px 42px 42px;font-size:16px;line-height:1.75">${content}</div>
          <div style="padding:22px 38px;border-top:1px solid #eee7e3;color:#8d8586;text-align:center;font:11px Arial,sans-serif;line-height:1.6;letter-spacing:.02em">
            YesDay · svadobný web, hostia a dôležité informácie na jednom mieste
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
