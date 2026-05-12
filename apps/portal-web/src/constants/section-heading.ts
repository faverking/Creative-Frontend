export const PORTAL_SECTION_HEADING_ICON_NAMES = {
  featured: 'channel-featured',
  catalog: 'channel-owner',
  article: 'channel-article',
  column: 'channel-column',
  bookshelf: 'channel-bookshelf',
  gallery: 'channel-gallery'
} as const

export type PortalSectionHeadingVariant = keyof typeof PORTAL_SECTION_HEADING_ICON_NAMES
