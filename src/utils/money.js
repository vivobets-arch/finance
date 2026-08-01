const eur = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

export function formatEUR(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return eur.format(0);
  return eur.format(n);
}

/** Parse user input to a positive number, or null if invalid. */
export function parseAmount(raw) {
  if (raw == null) return null;
  const normalized = String(raw).trim().replace(',', '.');
  if (!normalized) return null;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

export function signedAmount(tx) {
  const amount = Number(tx.amount) || 0;
  return tx.direction === 'credit' ? amount : -amount;
}

/** Available balance for a card from non-deleted ledger rows. */
export function availableForCard(cardId, transactions) {
  return (transactions || [])
    .filter((t) => t.card_id === cardId && !t.deleted_at)
    .reduce((sum, t) => sum + signedAmount(t), 0);
}
