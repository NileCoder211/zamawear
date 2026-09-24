import { useState, useMemo, useEffect } from "react";
import { Eye, Heart, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useViewerCount } from "../queries/useViewerCount";
import ProductDetailsModal from "../pages/ProductDetailPage";
import SelectOptionsModal from "./SelectOptionsModal";
import WhatsAppButton from "./WhatsappButton";
import { formatSizeLabel } from "../lib/formatSize";

export default function ProductCard({
  product,
  isWishlisted = false,
  onToggleWishlist,
  onAddToBag,
  onBuyNow,
  maxVisibleSwatches = 4,
}) {
  if (!product) {
    if (process.env.NODE_ENV !== "production") {
      console.error("ProductCard: missing required `product` prop");
    }
    return null;
  }

  const {
    id,
    name,
    price,
    tags = [],
    originalPrice,
    colors = [],
    // Renamed on destructure: only the *fallback* size list for products
    // with no color variants. When colors exist, sizes live per-color
    // instead (colors[i].sizes) — see availableSizes below, same split
    // as ProductDetailsModal.
    sizes: fallbackSizes = [],
  } = product;

  const [imageIndex, setImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [buyNowOpen, setBuyNowOpen] = useState(false);

  const { count: viewerCount } = useViewerCount(id);

  // Flatten every colour's photos into one gallery, each tagged with
  // which colour it belongs to — same pattern as ProductDetailsModal,
  // so a product with e.g. 5 colours x 1 photo still gets a
  // navigable gallery instead of getting stuck at "1 image, no chevrons".
  const allImages = useMemo(
    () =>
      colors.flatMap((color, colorIndex) =>
        (color.images ?? []).map((src) => ({
          src,
          colorIndex,
          colorName: color.name,
        }))
      ),
    [colors]
  );

  const current = allImages[imageIndex];
  const colorIndex = current?.colorIndex ?? 0;
  const selectedColor = colors[colorIndex];

  // Sizes are scoped to whichever colour is currently selected — same
  // reasoning as ProductDetailsModal: a red dress and a white dress of
  // the same product can have different size runs.
  const availableSizes = useMemo(() => {
    if (colors.length > 0) return selectedColor?.sizes ?? [];
    return fallbackSizes;
  }, [colors.length, selectedColor, fallbackSizes]);

  // Re-picks the default size whenever the selected colour changes
  // (including on mount), since a size chosen for one colour may not
  // exist on another.
  useEffect(() => {
    setSelectedSize(availableSizes[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorIndex, availableSizes]);

  const visibleSwatches = colors.slice(0, maxVisibleSwatches);
  const hiddenSwatchCount = Math.max(colors.length - maxVisibleSwatches, 0);

  const formattedPrice = useMemo(() => formatKES(price), [price]);
  const formattedOriginalPrice = useMemo(
    () => (originalPrice ? formatKES(originalPrice) : null),
    [originalPrice]
  );

  const showPrev = (e) => {
    e.stopPropagation();
    setImageIndex((i) => (i - 1 + allImages.length) % allImages.length);
  };
  const showNext = (e) => {
    e.stopPropagation();
    setImageIndex((i) => (i + 1) % allImages.length);
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    setWishlisted((w) => !w);
    onToggleWishlist?.(id);
  };

  // Clicking a colour swatch jumps the gallery to that colour's first photo
  const handleColorSelect = (e, targetColorIndex) => {
    e.stopPropagation();
    const firstIndexForColor = allImages.findIndex(
      (img) => img.colorIndex === targetColorIndex
    );
    if (firstIndexForColor !== -1) setImageIndex(firstIndexForColor);
  };

  const handleSizeSelect = (e, size) => {
    e.stopPropagation();
    setSelectedSize(size);
  };

  const handleAddToBag = (e) => {
    e.stopPropagation();
    onAddToBag?.(id, selectedColor?.name, selectedSize ?? undefined);
  };

  const handleBuyNowClick = (e) => {
    e.stopPropagation();
    setBuyNowOpen(true);
  };

  const handleConfirmBuyNow = ({ colorName, size }) => {
    setBuyNowOpen(false);
    onBuyNow?.(id, colorName, size);
  };

  return (
    <>
      <div
        onClick={() => setDetailsOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setDetailsOpen(true)}
       className="group relative w-full cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        {/* Image / carousel */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#E7DED1]">
          {current && (
            <img
              src={current.src}
              alt={name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}

          {viewerCount > 0 && (
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-red-500 backdrop-blur-sm">
              <Eye className="h-3.5 w-3.5" />
              <span>{viewerCount} viewing</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleWishlistClick}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#1E1E1E] shadow transition hover:scale-105"
          >
            <Heart className="h-4 w-4" fill={wishlisted ? "currentColor" : "none"} />
          </button>

          {colors.length > 0 && (
            <div className="absolute right-2 top-12 flex flex-col items-center gap-1.5">
              {visibleSwatches.map((color, i) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={(e) => handleColorSelect(e, i)}
                  aria-label={`Select color ${color.name}`}
                  aria-pressed={colorIndex === i}
                  className={`h-5 w-5 rounded-full ring-2 transition ${
                    colorIndex === i ? "ring-[#C9A55C]" : "ring-white/80"
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
              {hiddenSwatchCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-[10px] font-medium text-white">
                  +{hiddenSwatchCount}
                </span>
              )}
            </div>
          )}

          {allImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrev}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-black/60"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Next image"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-black/60"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <div className="space-y-2 p-3">
          <p className="truncate text-sm text-[#1E1E1E]">{name}</p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                    tag.toLowerCase() === "sale"
                      ? "bg-[#C9A55C]/15 text-[#8a6f2f]"
                      : "bg-[#F8F6F2] text-[#5c564c]"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-[#1E1E1E]">{formattedPrice}</span>
            {formattedOriginalPrice && (
              <span className="text-sm text-[#8a8375] line-through">
                {formattedOriginalPrice}
              </span>
            )}
          </div>

          {availableSizes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={(e) => handleSizeSelect(e, size)}
                  aria-pressed={selectedSize === size}
                  className={`min-w-[28px] rounded border px-2 py-1 text-xs font-medium transition ${
                    selectedSize === size
                      ? "border-[#1E1E1E] bg-[#1E1E1E] text-white"
                      : "border-[#E7DED1] text-[#5c564c] hover:border-[#8a8375]"
                  }`}
                >
                  {formatSizeLabel(size)}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
  <button
    type="button"
    onClick={handleAddToBag}
    className="flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[#1E1E1E] px-2 text-sm font-medium text-white transition hover:bg-black"
  >
    <ShoppingCart className="h-4 w-4 shrink-0" />
    Add to Cart
  </button>

  <button
    type="button"
    onClick={handleBuyNowClick}
    className="h-11 w-full rounded-lg bg-[#C9A55C] px-2 text-sm font-medium text-white transition hover:bg-[#b8944e]"
  >
    Buy Now
  </button>
</div>

          <WhatsAppButton
            product={{ id, name, price }}
            selectedColor={selectedColor?.name}
          />
        </div>
      </div>

      <ProductDetailsModal
        product={product}
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onAddToBag={onAddToBag}
        onBuyNow={onBuyNow}
      />

      <SelectOptionsModal
        product={product}
        isOpen={buyNowOpen}
        onClose={() => setBuyNowOpen(false)}
        onConfirm={handleConfirmBuyNow}
        initialColorIndex={colorIndex}
        initialSize={selectedSize}
      />
    </>
  );
}

function formatKES(amount) {
  return `KES ${Number(amount).toLocaleString("en-KE")}`;
}