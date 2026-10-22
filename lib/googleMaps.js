export function buildGoogleMapsSearchUrl(name, address) {
  const query = [name, address]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ')

  if (!query) return null

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
