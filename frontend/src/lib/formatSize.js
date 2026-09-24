// Strips a leading "UK " (any case) for display only — the raw
// value (e.g. "UK 10") is still what gets sent to the cart/order, so
// nothing about the actual size data changes, just how it's shown.
export function formatSizeLabel(size) {
  return String(size).replace(/^uk\s*/i, "");
}