export const DESIGN_CUSTOMIZATION_OPTIONS = {
  riviera: {
    fonts: [
      { value: 'serif', label: 'Jemné prímorské', family: "'Cormorant Garamond', Georgia, serif" },
      { value: 'editorial', label: 'Slnečné editorial', family: "'Playfair Display', Georgia, serif" },
    ],
    colors: [
      { value: 'primary', label: 'Stredomorská modrá', hex: '#254F78' },
      { value: 'secondary', label: 'Listová zelená', hex: '#486149' },
    ],
  },
  veno: {
    fonts: [
      { value: 'serif', label: 'Jemné klasické', family: "'Cormorant Garamond', Georgia, serif" },
      { value: 'editorial', label: 'Slávnostné editorial', family: "'Playfair Display', Georgia, serif" },
    ],
    colors: [
      { value: 'primary', label: 'Vyšívaná vínová', hex: '#71343F' },
      { value: 'secondary', label: 'Atramentová modrá', hex: '#3D5362' },
    ],
  },
  botanique: {
    fonts: [
      { value: 'serif', label: 'Jemné klasické', family: "'Cormorant Garamond', Georgia, serif" },
      { value: 'editorial', label: 'Výrazné editorial', family: "'Playfair Display', Georgia, serif" },
    ],
    colors: [
      { value: 'primary', label: 'Lesná zelená', hex: '#26362B' },
      { value: 'secondary', label: 'Elegantná béžová', hex: '#8A6F5B' },
    ],
  },
  penelope: {
    fonts: [
      { value: 'serif', label: 'Jemné romantické', family: "'Cormorant Garamond', Georgia, serif" },
      { value: 'editorial', label: 'Elegantné editorial', family: "'Playfair Display', Georgia, serif" },
    ],
    colors: [
      { value: 'primary', label: 'Tlmená slivková', hex: '#5A3F45' },
      { value: 'secondary', label: 'Púdrová ružová', hex: '#9A6874' },
    ],
  },
  chloe: {
    fonts: [
      { value: 'serif', label: 'Jemné klasické', family: "'Cormorant Garamond', Georgia, serif", previewFamily: "'Ms Madi', cursive" },
      { value: 'editorial', label: 'Elegantné editorial', family: "'Playfair Display', Georgia, serif", previewFamily: "'Ms Madi', cursive" },
    ],
    colors: [
      { value: 'primary', label: 'Akvarelová zelenomodrá', hex: '#344F50' },
      { value: 'secondary', label: 'Jemná šalviová', hex: '#60786F' },
    ],
  },
  fleurie: {
    fonts: [
      { value: 'serif', label: 'Jemný podpis', family: "'Cormorant Garamond', Georgia, serif", previewFamily: "'WindSong', cursive" },
      { value: 'editorial', label: 'Romantické editorial', family: "'Playfair Display', Georgia, serif", previewFamily: "'WindSong', cursive" },
    ],
    colors: [
      { value: 'primary', label: 'Tlmená vínová', hex: '#6E444B' },
      { value: 'secondary', label: 'Šalviová', hex: '#65705D' },
    ],
  },
  provence: {
    fonts: [
      { value: 'serif', label: 'Francúzske editorial', family: "'Playfair Display', Georgia, serif" },
      { value: 'editorial', label: 'Jemné klasické', family: "'Cormorant Garamond', Georgia, serif" },
    ],
    colors: [
      { value: 'primary', label: 'Tlmená slivková', hex: '#68546C' },
      { value: 'secondary', label: 'Olivová sivá', hex: '#6F7461' },
    ],
  },
  lavande: {
    fonts: [
      { value: 'serif', label: 'Jemné francúzske', family: "'Cormorant Garamond', Georgia, serif" },
      { value: 'editorial', label: 'Romantické editorial', family: "'Playfair Display', Georgia, serif" },
    ],
    colors: [
      { value: 'primary', label: 'Dymová levanduľa', hex: '#5F526F' },
      { value: 'secondary', label: 'Olivová', hex: '#6F785F' },
    ],
  },
}

export function getDesignCustomization(variant, project = {}) {
  const options = DESIGN_CUSTOMIZATION_OPTIONS[variant] || DESIGN_CUSTOMIZATION_OPTIONS.botanique
  const font = options.fonts.find((item) => item.value === project.design_font_variant) || options.fonts[0]
  const color = options.colors.find((item) => item.value === project.design_text_color) || options.colors[0]
  return { options, font, color }
}

// Shared by the real hero and its composed homepage preview.
export function getWeddingHeroFonts(variant, project = {}) {
  const fixed = {
    diana: ["'Great Vibes', cursive", "'Cormorant Garamond', Georgia, 'Times New Roman', serif"],
    botanique: ["'Great Vibes', cursive", "'Great Vibes', cursive"],
    chloe: ["'Ms Madi', cursive", "'Ms Madi', cursive"],
    fleurie: ["'WindSong', cursive", "'WindSong', cursive"],
    provence: ["'Playfair Display', Georgia, serif", "'Ms Madi', cursive"],
    lavande: ["'Cormorant Garamond', Georgia, serif", "'Ms Madi', cursive"],
  }
  const family = getDesignCustomization(variant, project).font.family
  const [names, joiner] = fixed[variant] || [family, variant === 'penelope' ? "'Great Vibes', cursive" : family]
  const joinerStyle = ['chloe', 'penelope', 'provence', 'lavande'].includes(variant) ? 'normal' : 'italic'
  return { names, joiner, joinerStyle }
}
