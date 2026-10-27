export const DEMO_FIELDS = [
  ['first', 'Meno nevesty', 'text', 'Diana'],
  ['second', 'Meno ženícha', 'text', 'Anton'],
  ['date', 'Dátum svadby', 'date', '2027-09-18'],
  ['time', 'Čas obradu', 'time', '15:00'],
  ['venue', 'Miesto obradu', 'text', 'Kaplnka Božského Srdca Ježišovho'],
  ['city', 'Mesto', 'text', 'Piešťany'],
  ['reception', 'Miesto hostiny', 'text', 'Kursalon Piešťany'],
  ['welcome', 'Uvítací text', 'text', 'Tešíme sa, že náš deň oslávite s nami.'],
]
export const DEMO_DEFAULTS = Object.fromEntries(DEMO_FIELDS.map(([key, , , value]) => [key, value]))

export function normalizeDemo(values = {}) {
  const result = Object.fromEntries(DEMO_FIELDS.map(([key]) => [key, String(values[key] || DEMO_DEFAULTS[key]).trim().slice(0, key === 'welcome' ? 240 : 80)]))
  result.design = ['diana', 'botanique', 'penelope'].includes(String(values.design || '').toLowerCase())
    ? String(values.design).toLowerCase()
    : 'diana'
  result.font = ['serif', 'editorial'].includes(String(values.font || '').toLowerCase()) ? String(values.font).toLowerCase() : 'serif'
  result.ink = ['primary', 'secondary'].includes(String(values.ink || '').toLowerCase()) ? String(values.ink).toLowerCase() : 'primary'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result.date) || Number.isNaN(new Date(`${result.date}T12:00:00`).getTime())) result.date = DEMO_DEFAULTS.date
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(result.time)) result.time = DEMO_DEFAULTS.time
  return result
}
export function demoProject(values) {
  const v = normalizeDemo(values)
  return { couple_display_name: `${v.first} a ${v.second}`, wedding_date: v.date, ceremony_time: v.time, reception_time: '17:00', venue_name: v.venue, venue_address: v.city, reception_venue_name: v.reception, reception_venue_address: v.city, design_family: v.design, design_font_variant: v.font, design_text_color: v.ink, package_type: 'signature', accommodation_reminder_days: 2, accommodation_reminder_setting_updated_at: '2026-10-20T08:00:00Z', accommodation_reminder_resend_confirmed_for_date: null, timezone: 'Europe/Bratislava' }
}
export const DEMO_RESPONSES = [
  { id: 'demo-1', guest_name: 'Jana Nováková', attending: 'yes', adults_count: 2, children_count: 1, needs_accommodation: true, contact_email: 'jana@example.com', contact_phone: '+421 900 000 001', transport: 'Odvoz z hostiny o 01:00 — 2 dospelí a 1 dieťa', accommodation_option_id: 'demo-accommodation-1', accommodation_hotel: 'Hotel Park', accommodation_room: '204', accommodation_hotel_address: 'Nábrežie Ivana Krasku 2, Piešťany', accommodation_check_in: '18. 9. 2027 od 14:00', accommodation_check_out: '19. 9. 2027 do 10:00', accommodation_guest_note: 'Raňajky sú zahrnuté v cene pobytu. Pri príchode sa, prosím, preukážte menom.', accommodation_internal_note: 'Detská prístelka', accommodation_email_sent_at: '2027-08-20T10:00:00Z', created_at: '2026-10-10T10:00:00Z', people: [{ name: 'Jana Nováková', type: 'adult', menu: 'meat', allergies: '' }, { name: 'Peter Novák', type: 'adult', menu: 'vegetarian', allergies: 'Orechy' }, { name: 'Ema Nováková', type: 'child', menu: 'child', allergies: '' }] },
  { id: 'demo-2', guest_name: 'Lucia Kováčová', attending: 'yes', adults_count: 1, children_count: 0, needs_accommodation: true, contact_email: 'lucia@example.com', transport: 'Odvoz z hostiny o 23:00', accommodation_option_id: 'demo-accommodation-2', accommodation_hotel: 'Penzión Magnolia', accommodation_room: '12', accommodation_hotel_address: 'Nálepkova 1, Piešťany', accommodation_check_in: '18. 9. 2027 od 15:00', accommodation_check_out: '19. 9. 2027 do 11:00', accommodation_guest_note: 'Parkovanie je bezplatné vo dvore penziónu.', created_at: '2026-10-11T10:00:00Z', people: [{ name: 'Lucia Kováčová', type: 'adult', menu: 'vegan', allergies: 'Laktóza' }] },
  { id: 'demo-3', guest_name: 'Martin Biely', attending: 'no', adults_count: 0, children_count: 0, people: [], message: 'Ďakujeme za pozvanie.' },
]

export function createDemoState(values) {
  const v = normalizeDemo(values)
  return { project: demoProject(v), content: { welcome_text: v.welcome, story_text: 'Z náhodného stretnutia sa stal spoločný príbeh. Teraz začíname jeho novú kapitolu.', menu_intro_text: 'PREDJEDLO\nSezónny šalát\n\nHLAVNÉ JEDLO\nSlávnostné menu podľa výberu hostí\n\nDEZERT\nSvadobná torta', dresscode_text: 'Elegantné spoločenské oblečenie.', dresscode_palette_enabled: true, dresscode_palette: [{ name: 'Ivory', hex: '#F7F3EA' }, { name: 'Sage', hex: '#A8B5A1' }, { name: 'Dusty Rose', hex: '#D8A5A5' }, { name: 'Burgundy', hex: '#6E3F48' }], accommodation_text: 'Pre hostí sú pripravené izby v blízkosti miesta oslavy.', transport_text: 'Parkovanie je pri mieste hostiny. Večerný odvoz zabezpečíme podľa požiadaviek hostí.', faq_text: 'Do kedy potvrdiť účasť?\nProsíme, dajte nám vedieť mesiac pred svadbou.' }, schedule: [{ item_time: v.time, item_title: 'Svadobný obrad', item_description: v.venue }, { item_time: '17:00', item_title: 'Svadobná oslava', item_description: v.reception }, { item_time: '20:00', item_title: 'Prvý tanec a zábava', item_description: 'Oslávte tento večer s nami.' }] }
}

// Only public wedding presentation fields can be carried by a demo link.
export function readDemoState(values = {}) {
  const base = createDemoState(values)
  if (typeof values.details !== 'string' || values.details.length > 40000) return base
  try {
    const data = JSON.parse(values.details)
    for (const key of Object.keys(base.project)) {
      if (typeof data.project?.[key] === 'string') base.project[key] = data.project[key].slice(0, 240)
    }
    for (const key of Object.keys(base.content)) {
      if (typeof base.content[key] === 'string' && typeof data.content?.[key] === 'string') base.content[key] = data.content[key].slice(0, 3000)
    }
    base.content.dresscode_palette_enabled = data.content?.dresscode_palette_enabled === true
    if (Array.isArray(data.content?.dresscode_palette)) base.content.dresscode_palette = data.content.dresscode_palette.slice(0, 6)
    if (Array.isArray(data.schedule)) base.schedule = data.schedule.slice(0, 30).map(item => ({ item_time: String(item.item_time || '').slice(0, 5), item_title: String(item.item_title || '').slice(0, 120), item_description: String(item.item_description || '').slice(0, 500) }))
    if (!/^\d{4}-\d{2}-\d{2}$/.test(base.project.wedding_date) || Number.isNaN(new Date(`${base.project.wedding_date}T12:00:00`).getTime())) base.project.wedding_date = DEMO_DEFAULTS.date
    return base
  } catch { return base }
}
