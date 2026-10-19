export const DESIGN_CUSTOMIZATION_OPTIONS = {
  botanique: {
    fonts: [
      { value: 'serif', label: 'Jemné klasické', family: "'Cormorant Garamond', Georgia, serif" },
      { value: 'editorial', label: 'Výrazné editorial', family: "'Playfair Display', Georgia, serif" },
    ],
    colors: [
      { value: 'primary', label: 'Lesná zelená', hex: '#26362B' },
      { value: 'secondary', label: 'Teplá béžová', hex: '#806D59' },
    ],
  },
  penelope: {
    fonts: [
      { value: 'serif', label: 'Jemné romantické', family: "'Cormorant Garamond', Georgia, serif" },
      { value: 'editorial', label: 'Elegantné editorial', family: "'Playfair Display', Georgia, serif" },
    ],
    colors: [
      { value: 'primary', label: 'Tlmená slivková', hex: '#5A3F45' },
      { value: 'secondary', label: 'Teplá kakaová', hex: '#6B584D' },
    ],
  },
}

export function getDesignCustomization(variant, project = {}) {
  const options = DESIGN_CUSTOMIZATION_OPTIONS[variant] || DESIGN_CUSTOMIZATION_OPTIONS.botanique
  const font = options.fonts.find((item) => item.value === project.design_font_variant) || options.fonts[0]
  const color = options.colors.find((item) => item.value === project.design_text_color) || options.colors[0]
  return { options, font, color }
}
