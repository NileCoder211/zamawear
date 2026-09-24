// Adapts a raw product document from the API into the shape
// ProductCard expects. Each color now carries its own real image
// gallery from the backend (colors[].images), so this no longer
// needs to fake per-color galleries by reusing one flat list —
// colors[].images IS the per-color gallery. Products with no color
// variants (e.g. Body Lotions & Creams) fall back to the top-level
// `images` array as a single "Default" color group.

const FALLBACK_HEX = "#B9A58E";

export function mapApiProductToCard(product) {
  // Guards against a stale reference to a since-deleted product —
  // e.g. Mongoose leaves a `null` slot in populated arrays (like
  // wishlist) when the referenced doc no longer exists, same as
  // getCartProducts already filters out for cart lines. Returning
  // null here (instead of crashing on product.colors) lets callers
  // filter it out the same way.
  if (!product) return null;

  const hasColors = Array.isArray(product.colors) && product.colors.length > 0;
  const fallbackSizes = Array.isArray(product.sizes) ? product.sizes : [];

  // colors[].sizes is where ProductDetailsModal actually reads from —
  // since this mapper always returns a non-empty `colors` array (real
  // colors, or the synthetic "Default" one below), the modal's
  // `colors.length > 0` branch is the one that always runs, so every
  // color entry needs its own `sizes`, not just the top-level product.
  const colors = hasColors
    ? product.colors.map((c) => ({
        name: c.name,
        hex: c.hex || FALLBACK_HEX,
        images: (c.images || []).map((img) => img.url).filter(Boolean),
        sizes: Array.isArray(c.sizes) ? c.sizes : [],
      }))
    : [
        {
          name: "Default",
          hex: FALLBACK_HEX,
          images: (product.images || []).map((img) => img.url).filter(Boolean),
          sizes: fallbackSizes,
        },
      ];

  return {
    id: product._id,
    name: product.name,
    tags: product.isFeatured ? ["FEATURED"] : [],
    price: product.price,
    originalPrice: undefined,
    stockStatus: product.stock > 0 ? "In Stock" : "Out of Stock",
    material: product.brand || undefined,
    description: product.description,
    // Kept for any other consumer that still reads a flat size list
    // (e.g. a colorless-only view); ProductDetailsModal itself reads
    // sizes from `colors[i].sizes` now, per the note above.
    sizes: fallbackSizes,
    colors,
  };
}