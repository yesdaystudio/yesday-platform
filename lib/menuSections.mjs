export const MENU_COURSES = [
  { key: 'starter', label: 'Predjedlo' },
  { key: 'soup', label: 'Polievka' },
  { key: 'main', label: 'Hlavné jedlo' },
  { key: 'dessert', label: 'Dezert' },
]

export function createDefaultMenuSections() {
  return MENU_COURSES.map((course) => ({ ...course, enabled: true, text: '' }))
}

export function normalizeMenuSections(value, legacyText = '') {
  if (value?.configured === true && Array.isArray(value.items)) {
    return MENU_COURSES.map((course) => {
      const stored = value.items.find((item) => item?.key === course.key)
      return {
        ...course,
        enabled: stored ? stored.enabled !== false : true,
        text: cleanText(stored?.text),
      }
    })
  }

  return parseLegacyMenuText(legacyText)
}

export function serializeMenuSections(items) {
  return normalizeMenuSections({ configured: true, items })
    .filter((item) => item.enabled && item.text)
    .map((item) => `${item.label.toUpperCase()}\n${item.text}`)
    .join('\n\n')
}

export function getVisibleMenuSections(content) {
  return normalizeMenuSections(content?.menu_sections, content?.menu_intro_text)
    .filter((item) => item.enabled && item.text)
}

function parseLegacyMenuText(value) {
  const text = cleanText(value)
  if (!text) return createDefaultMenuSections()

  const aliases = new Map(MENU_COURSES.flatMap((course) => [
    [normalizeHeading(course.label), course.key],
    [normalizeHeading(course.label.toUpperCase()), course.key],
  ]))
  const found = new Map()
  let activeKey = ''
  let freeform = []

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    const headingKey = aliases.get(normalizeHeading(line))
    if (headingKey) {
      activeKey = headingKey
      if (!found.has(activeKey)) found.set(activeKey, [])
      continue
    }
    if (activeKey) found.get(activeKey).push(rawLine)
    else freeform.push(rawLine)
  }

  if (!found.size) {
    return MENU_COURSES.map((course) => ({
      ...course,
      enabled: course.key === 'main',
      text: course.key === 'main' ? text : '',
    }))
  }

  if (freeform.some((line) => line.trim())) {
    const main = found.get('main') || []
    found.set('main', [...freeform, ...main])
  }

  return MENU_COURSES.map((course) => ({
    ...course,
    enabled: found.has(course.key),
    text: cleanText((found.get(course.key) || []).join('\n')),
  }))
}

function normalizeHeading(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[:\s]+$/g, '')
    .trim()
    .toLowerCase()
}

function cleanText(value) {
  return String(value || '').trim()
}
