export interface CategoryTheme {
  tint: string;
  ink: string;
}

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  epicerie: { tint: '#FFE9EB', ink: '#F50012' },
  fruits: { tint: '#E6F6EC', ink: '#15A05A' },
  boissons: { tint: '#E8F1FF', ink: '#2563EB' },
  resto: { tint: '#FFF1E2', ink: '#E2730B' },
  maison: { tint: '#F0ECFF', ink: '#6D4AE0' },
  electro: { tint: '#E9F4F6', ink: '#0E8AA0' },
};

export function getCategoryTheme(slug: string | null | undefined): CategoryTheme {
  if (!slug) return CATEGORY_THEMES.epicerie;
  return CATEGORY_THEMES[slug] || CATEGORY_THEMES.epicerie;
}
export default getCategoryTheme;
