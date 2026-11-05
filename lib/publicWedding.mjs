// Explicit allowlists keep future private columns out of public responses.
export const PUBLIC_PROJECT_FIELDS = [
  'id', 'slug', 'couple_display_name', 'wedding_date', 'ceremony_time', 'reception_time',
  'venue_name', 'venue_address', 'reception_venue_name', 'reception_venue_address',
  'design_family', 'color_variant', 'design_font_variant', 'design_text_color',
]
export const PUBLIC_CONTENT_FIELDS = [
  'welcome_text', 'story_text', 'menu_intro_text', 'menu_sections', 'dresscode_text',
  'dresscode_palette_enabled', 'dresscode_palette', 'accommodation_text', 'transport_text', 'faq_text',
]
export const PUBLIC_SCHEDULE_FIELDS = ['id', 'sort_order', 'item_time', 'item_title', 'item_description']
export function isPublicWedding(project) {
  return project?.payment_status === 'paid' && project?.project_status === 'active'
}
export function publicProject(project) {
  return Object.fromEntries(PUBLIC_PROJECT_FIELDS.filter(key => Object.hasOwn(project, key)).map(key => [key, project[key]]))
}
