export function normalizeInvitationToken(value) {
  const token = String(value || '').trim().toLowerCase()
  return /^[a-f0-9]{64}$/.test(token) ? token : ''
}

export function normalizePersonalizedRsvp(body) {
  const attending = body?.attending === 'no' ? 'no' : body?.attending === 'yes' ? 'yes' : ''
  if (!attending) return { error: 'Vyberte, či sa svadby zúčastníte.' }

  const adults = attending === 'yes' ? clampCount(body?.adults_count) : 0
  const children = attending === 'yes' ? clampCount(body?.children_count) : 0
  const expectedPeople = adults + children
  if (attending === 'yes' && expectedPeople < 1) return { error: 'Uveďte aspoň jedného hosťa.' }

  const people = attending === 'yes'
    ? Array.isArray(body?.people)
      ? body.people.slice(0, expectedPeople).map((person, index) => ({
          name: cleanText(person?.name, 120),
          type: index < adults ? 'adult' : 'child',
          menu: cleanChoice(person?.menu, ['meat', 'vegetarian', 'vegan', 'child', 'other'], index < adults ? 'meat' : 'child'),
          allergies: cleanText(person?.allergies, 300),
          ...(index === 0 && cleanText(body?.transport, 500) ? { transport_request: cleanText(body.transport, 500) } : {}),
        }))
      : []
    : []

  if (attending === 'yes' && (people.length !== expectedPeople || people.some((person) => !person.name))) {
    return { error: 'Doplňte mená všetkých hostí.' }
  }

  const decliningName = cleanText(body?.guest_name, 120)
  if (attending === 'no' && !decliningName) return { error: 'Doplňte svoje meno.' }

  const needsAccommodation = attending === 'yes' && body?.needs_accommodation === true
  const transport = attending === 'yes' ? cleanText(body?.transport, 500) : ''
  const needsContact = needsAccommodation || Boolean(transport)

  return {
    value: {
      guest_name: attending === 'yes' ? people[0].name : decliningName,
      attending,
      adults_count: adults,
      children_count: children,
      people,
      needs_accommodation: needsAccommodation,
      transport: transport || null,
      contact_email: needsContact ? cleanEmail(body?.contact_email) : null,
      contact_phone: needsContact ? cleanText(body?.contact_phone, 80) || null : null,
      message: cleanText(body?.message, 2000),
    },
  }
}

function clampCount(value) {
  const count = Number.parseInt(value, 10)
  return Number.isFinite(count) ? Math.max(0, Math.min(20, count)) : 0
}

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
}

function cleanEmail(value) {
  const email = cleanText(value, 254)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

function cleanChoice(value, choices, fallback) {
  const choice = String(value || '')
  return choices.includes(choice) ? choice : fallback
}
