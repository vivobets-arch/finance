/** Default available balance / credit limit for each card at start of month. */
export const DEFAULT_MONTHLY_AVAILABLE = 2600;

/** Preset payment methods shown in the carousel. */
export const CARD_PRESETS = [
  {
    name: 'Wizz Air',
    sort_order: 0,
    image: '/cards/wizz.webp',
    theme: 'wizz',
  },
  {
    name: 'Platinum',
    sort_order: 1,
    image: '/cards/platinum.webp',
    theme: 'platinum',
  },
  {
    name: 'Cash',
    sort_order: 2,
    image: null,
    theme: 'cash',
  },
];

export function presetForCard(card) {
  if (!card) return CARD_PRESETS[0];
  const byName = CARD_PRESETS.find(
    (p) => p.name.toLowerCase() === String(card.name || '').toLowerCase(),
  );
  if (byName) return byName;
  return CARD_PRESETS[card.sort_order] || CARD_PRESETS[0];
}
