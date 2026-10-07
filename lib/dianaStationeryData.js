export function formatDianaStationeryDate(value) {
  if (!value) return "19. september 2026"

  const date = new Date(`${value}T12:00:00`)

  if (Number.isNaN(date.getTime())) {
    return "19. september 2026"
  }

  const months = [
    "január",
    "február",
    "marec",
    "apríl",
    "máj",
    "jún",
    "júl",
    "august",
    "september",
    "október",
    "november",
    "december",
  ]

  return `${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`
}

export function splitDianaCoupleName(coupleName) {
  const fallback = ["Diana", "Anton"]
  const normalized = String(coupleName || "").trim()

  if (!normalized) return fallback

  const parts = normalized
    .split(/\s+(?:&|a|\+)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length >= 2) {
    return [parts[0], parts.slice(1).join(" ")]
  }

  return [normalized, ""]
}

export function getDianaInitials(coupleName) {
  const [firstPartner, secondPartner] = splitDianaCoupleName(coupleName)
  const initials = [firstPartner, secondPartner]
    .map((name) => name.trim().charAt(0))
    .filter(Boolean)
    .join("")

  return initials || "DA"
}

export function getDianaShortLocation(project) {
  const venueName = String(project?.venue_name || "").trim()
  const venueAddress = String(project?.venue_address || "").trim()
  const source = venueAddress || venueName

  if (!source) return "Miesto bude doplnené"

  const parts = source
    .split(",")
    .map((part) => normalizeLocationPart(part))
    .filter(Boolean)

  const meaningfulParts = parts.filter((part) => !/^(slovakia|slovensko|slovak republic)$/i.test(part))

  return meaningfulParts[meaningfulParts.length - 1] || parts[parts.length - 1] || source
}

export function getDianaStationeryData(project, weddingWebsiteUrl) {
  const [firstPartner, secondPartner] = splitDianaCoupleName(project?.couple_display_name)
  const ceremonyVenue = String(project?.venue_name || "").trim() || "Kaplnka Božského Srdca Ježišovho"
  const hasCeremonyLocation = Boolean(String(project?.venue_name || project?.venue_address || "").trim())
  const ceremonyCity = hasCeremonyLocation ? getDianaShortLocation(project) : "Piešťany"
  const receptionVenue = String(project?.reception_venue_name || "").trim() || "Kursalone Piešťany"

  return {
    firstPartner,
    secondPartner,
    initials: getDianaInitials(project?.couple_display_name),
    displayDate: formatDianaStationeryDate(project?.wedding_date),
    timeLine: "sobota · 15.00",
    location: ceremonyCity,
    invitationText: "Spoločne s našimi rodinami\nVás s radosťou pozývame na oslavu\nnášho svadobného dňa.",
    ceremonyVenue,
    ceremonyCity,
    receptionIntro: "Svadobná hostina sa uskutoční",
    receptionVenue: `v ${receptionVenue}.`,
    detailsText: "Podrobnosti a potvrdenie účasti\nnájdete na priloženej QR kartičke.",
    qrTitle: "Svadobný web",
    qrInstruction: "naskenujte QR kód",
    qrText: "RSVP a všetky dôležité informácie nájdete online.",
    weddingWebsiteUrl: weddingWebsiteUrl || "",
  }
}

function normalizeLocationPart(value) {
  return String(value || "")
    .trim()
    .replace(/^\d{3}\s?\d{2}\s+/, "")
}
