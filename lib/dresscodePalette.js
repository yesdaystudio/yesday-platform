export const DRESSCODE_PALETTE_OPTIONS = [
  { name: "Ivory", hex: "#F7F3EA" },
  { name: "Champagne", hex: "#D8C3A5" },
  { name: "Cream", hex: "#EFE6D8" },
  { name: "Sage", hex: "#A8B5A1" },
  { name: "Olive", hex: "#7C8461" },
  { name: "Forest Green", hex: "#2E4B3B" },
  { name: "Dusty Rose", hex: "#D8A5A5" },
  { name: "Blush", hex: "#EBC7C7" },
  { name: "Mauve", hex: "#BFA7A2" },
  { name: "Taupe", hex: "#A79A92" },
  { name: "Terracotta", hex: "#C86B4A" },
  { name: "Sand", hex: "#DCC9B2" },
  { name: "Lavender", hex: "#C9B8DA" },
  { name: "Navy", hex: "#1F2E46" },
  { name: "Gold", hex: "#C9A24A" },
]

export const MAX_DRESSCODE_PALETTE_COLORS = 5

const PALETTE_OPTIONS_BY_HEX = new Map(
  DRESSCODE_PALETTE_OPTIONS.map((color) => [color.hex.toUpperCase(), color])
)

export function normalizeDresscodePalette(value) {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set()

  return value.reduce((palette, color) => {
    if (palette.length >= MAX_DRESSCODE_PALETTE_COLORS) {
      return palette
    }

    const hex = typeof color?.hex === "string" ? color.hex.toUpperCase() : ""
    const curatedColor = PALETTE_OPTIONS_BY_HEX.get(hex)

    if (!curatedColor || seen.has(curatedColor.hex)) {
      return palette
    }

    seen.add(curatedColor.hex)
    palette.push(curatedColor)
    return palette
  }, [])
}
