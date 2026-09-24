import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Eye,
  ShieldCheck,
  Lock,
  Truck,
  ShoppingCart,
} from "lucide-react";
import { useViewerCount } from "../queries/useViewerCount";
import { formatSizeLabel } from "../lib/formatSize";

// How far one chevron tap scrolls the thumbnail strip — roughly 3
// thumbnails' worth (thumbnail size + gap), in either axis.
const THUMBNAIL_SCROLL_AMOUNT = 220;

export default function ProductDetailsModal({
  product,
  isOpen,
  onClose,
  onAddToBag,
  onBuyNow,
}) {
  // imageIndex = permanently selected/clicked image
  const [imageIndex, setImageIndex] = useState(0);

  // hoveredImageIndex = temporary image preview while hovering thumbnails
  const [hoveredImageIndex, setHoveredImageIndex] = useState(null);

  const [selectedSize, setSelectedSize] = useState(null);

  const thumbnailStripRef = useRef(null);

  const { count: viewerCount } = useViewerCount(product?.id);

  const {
    id,
    name,
    price,
    originalPrice,
    stockStatus = "In Stock",
    material,
    description,
    colors = [],
    // Renamed on destructure: this is only the *fallback* size list for
    // products with no color variants. When colors exist, sizes live on
    // each color instead (colors[i].sizes) — see availableSizes below.
    sizes: fallbackSizes = [],
  } = product ?? {};

  // Flatten every color's photos into one ordered gallery.
  // Each image keeps track of the color it belongs to.
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

  /*
   * imageIndex is the image the user actually selected.
   *
   * hoveredImageIndex is only temporary.
   * When hovering a thumbnail, the carousel shows that image.
   * When the mouse leaves, it goes back to imageIndex.
   */
  const displayedImageIndex =
    hoveredImageIndex !== null ? hoveredImageIndex : imageIndex;

  const current = allImages[displayedImageIndex];

  // The selected color should be based on the permanently selected image,
  // not the temporarily hovered image.
  const selectedImage = allImages[imageIndex];
  const selectedColorIndex = selectedImage?.colorIndex ?? 0;
  const selectedColor = colors[selectedColorIndex];

  // Sizes are scoped to whichever color is currently selected — a red
  // dress and a white dress of the same product can have different size
  // runs. Products with no colors at all fall back to the product-level
  // size list (e.g. a lotion sold in 100ml/200ml).
  const availableSizes = useMemo(() => {
    if (colors.length > 0) return selectedColor?.sizes ?? [];
    return fallbackSizes;
  }, [colors.length, selectedColor, fallbackSizes]);

  useEffect(() => {
    if (isOpen) {
      setImageIndex(0);
      setHoveredImageIndex(null);
    }
  }, [isOpen, product?.id]);

  // Re-picks the default size whenever the modal opens or the selected
  // color changes, since the previous color's chosen size may not exist
  // on the new color (e.g. red doesn't come in XL but white does).
  useEffect(() => {
    if (!isOpen) return;
    setSelectedSize(availableSizes[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedColorIndex, product?.id, availableSizes]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onClose, allImages.length]);

  if (!isOpen || !product) return null;

  const showPrev = () => {
    // Arrow navigation should override any thumbnail hover preview.
    setHoveredImageIndex(null);

    setImageIndex(
      (i) => (i - 1 + allImages.length) % allImages.length
    );
  };

  const showNext = () => {
    // Arrow navigation should override any thumbnail hover preview.
    setHoveredImageIndex(null);

    setImageIndex((i) => (i + 1) % allImages.length);
  };

  // Clicking a thumbnail permanently selects that image.
  const handleSelectImage = (index) => {
    setImageIndex(index);
    setHoveredImageIndex(null);
  };

  // Clicking a color swatch jumps the gallery to that color's first photo.
  const handleSelectColor = (colorIndex) => {
    const firstIndexForColor = allImages.findIndex(
      (img) => img.colorIndex === colorIndex
    );

    if (firstIndexForColor !== -1) {
      setImageIndex(firstIndexForColor);
      setHoveredImageIndex(null);
    }
  };

  // Paginates the thumbnail strip. The strip only ever overflows on
  // one axis at a time (x on mobile, y on desktop, per the responsive
  // classes below), so scrolling both axes at once is harmless — the
  // axis with nothing to scroll is simply a no-op.
  const scrollThumbnails = (direction) => {
    const el = thumbnailStripRef.current;
    if (!el) return;
    el.scrollBy({
      top: direction * THUMBNAIL_SCROLL_AMOUNT,
      left: direction * THUMBNAIL_SCROLL_AMOUNT,
      behavior: "smooth",
    });
  };

  const stopPropagation = (e) => e.stopPropagation();

  const needsColor = colors.length > 0 && !selectedColor;
  const needsSize = availableSizes.length > 0 && !selectedSize;
  const actionsDisabled = needsColor || needsSize;

  const actionLabel = needsColor
    ? "Select a colour"
    : needsSize
    ? "Select a size"
    : null;

  const showThumbnailNav = allImages.length > 5;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={name}
    >
      <div
        className="relative flex max-h-screen w-full  max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={stopPropagation}
      >
        {/* Header — close button only */}
        <div className="flex items-center justify-end border-b border-[#E7DED1] px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#8a8375] transition hover:bg-[#F8F6F2]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="grid flex-1 grid-cols-1 gap-8 overflow-y-auto px-6 py-6 md:grid-cols-2">
          {/* Gallery */}
          <div className="min-w-0">
           <div className="flex flex-col gap-3 md:flex-row md:items-stretch">
              {/* Thumbnails — a flex row (mobile) / column (desktop) with
                  optional prev/next chevrons as flex items on either end,
                  so they never overlap the images themselves. */}
              {allImages.length > 1 && (
                <div className="order-2 flex items-center gap-1 md:order-1 md:w-20 md:flex-col">
                  {showThumbnailNav && (
                    <button
                      type="button"
                      onClick={() => scrollThumbnails(-1)}
                      aria-label="Show previous thumbnails"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#1E1E1E] shadow ring-1 ring-[#E7DED1] transition hover:scale-105 md:w-full"
                    >
                      <ChevronLeft className="h-4 w-4 md:hidden" />
                      <ChevronUp className="hidden h-4 w-4 md:block" />
                    </button>
                  )}

                  <div
                    ref={thumbnailStripRef}
                    // Scrollbar hidden but the element still scrolls —
                    // scrollbarWidth/msOverflowStyle cover Firefox/legacy
                    // Edge, the arbitrary variant covers Chrome/Safari.
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    className="flex flex-1 gap-2 overflow-x-auto scroll-smooth pb-1 [&::-webkit-scrollbar]:hidden md:w-full md:max-h-[420px] md:flex-col md:overflow-y-auto md:overflow-x-visible md:pb-0"
                  >
                    {allImages.map((img, i) => {
                      const isSelected = i === imageIndex;
                      const isHovered = i === hoveredImageIndex;

                      return (
                        <button
                          key={`${img.colorIndex}-${i}-thumb`}
                          type="button"
                          onClick={() => handleSelectImage(i)}
                          onMouseEnter={() => setHoveredImageIndex(i)}
                          onMouseLeave={() => setHoveredImageIndex(null)}
                          aria-label={`View ${img.colorName} image ${i + 1}`}
                          aria-current={isSelected}
                          className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200 md:h-16 md:w-full ${
                            isSelected
                              ? "border-black"
                              : isHovered
                              ? "border-black/50"
                              : "border-transparent"
                          }`}
                        >
                          <img
                            src={img.src}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>

                  {showThumbnailNav && (
                    <button
                      type="button"
                      onClick={() => scrollThumbnails(1)}
                      aria-label="Show more thumbnails"
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#1E1E1E] shadow ring-1 ring-[#E7DED1] transition hover:scale-105 md:w-full"
                    >
                      <ChevronRight className="h-4 w-4 md:hidden" />
                      <ChevronDown className="hidden h-4 w-4 md:block" />
                    </button>
                  )}
                </div>
              )}
              {/* Main Carousel */}
              <div className="order-1 min-w-0  flex-1 md:order-2">
                <div className="relative max-h-[80vh] w-full  overflow-hidden rounded-xl bg-[#E7DED1]">
                  {current && (
                    <img
                      src={current.src}
                      alt={`${name} — ${current.colorName}`}
                      className="h-full w-full object-cover"
                    />
                  )}

                  {viewerCount > 0 && (
                    <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-red-500 backdrop-blur-sm">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{viewerCount} people viewing</span>
                    </div>
                  )}

                  {allImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={showPrev}
                        aria-label="Previous image"
                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1E1E1E] shadow transition hover:scale-105"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={showNext}
                        aria-label="Next image"
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1E1E1E] shadow transition hover:scale-105"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Carousel dots */}
                {allImages.length > 1 && (
                  <div className="mt-2.5 flex items-center justify-center gap-1.5">
                    {allImages.map((img, i) => (
                      <button
                        key={`${img.colorIndex}-${i}-dot`}
                        type="button"
                        onClick={() => handleSelectImage(i)}
                        aria-label={`Go to image ${i + 1}`}
                        aria-current={i === imageIndex}
                        className={`h-1.5 rounded-full transition-all ${
                          i === imageIndex
                            ? "w-4 bg-[#C9A55C]"
                            : "w-1.5 bg-[#E7DED1] hover:bg-[#B9A58E]"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <h2 className="text-xl font-semibold text-[#1E1E1E]">
              {name}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-2xl font-bold text-[#1E1E1E]">
                {formatKES(price)}
              </span>

              {originalPrice && (
                <span className="text-sm text-[#8a8375] line-through">
                  {formatKES(originalPrice)}
                </span>
              )}

              <span className="rounded-full bg-[#C9A55C]/15 px-2.5 py-1 text-xs font-medium text-[#8a6f2f]">
                {stockStatus}
              </span>

              {material && (
                <span className="rounded-full bg-[#F8F6F2] px-2.5 py-1 text-xs font-medium text-[#5c564c]">
                  {material}
                </span>
              )}
            </div>

            {description && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-[#1E1E1E]">
                  About this item
                </h3>

                <p className="mt-1.5 text-sm leading-relaxed text-[#5c564c]">
                  {description}
                </p>
              </div>
            )}

            {colors.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-[#1E1E1E]">
                  Select Colour
                </h3>

                <p className="mt-1 text-xs text-[#8a8375]">
                  Tap a colour to jump to its photos.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {colors.map((color, i) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => handleSelectColor(i)}
                      aria-pressed={i === selectedColorIndex}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                        i === selectedColorIndex
                          ? "border-[#C9A55C] bg-[#C9A55C]/10 text-[#1E1E1E]"
                          : "border-[#E7DED1] text-[#5c564c] hover:border-[#8a8375]"
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full ring-1 ring-black/10"
                        style={{ backgroundColor: color.hex }}
                      />

                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {availableSizes.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-[#1E1E1E]">
                  Select Size
                  {selectedColor && (
                    <span className="ml-1.5 text-xs font-normal text-[#8a8375]">
                      ({selectedColor.name})
                    </span>
                  )}
                </h3>

                <div className="mt-3 flex flex-wrap gap-2">
                  {availableSizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      aria-pressed={selectedSize === s}
                      className={`min-w-[44px] rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        selectedSize === s
                          ? "border-[#1E1E1E] bg-[#1E1E1E] text-white"
                          : "border-[#E7DED1] text-[#5c564c] hover:border-[#8a8375]"
                      }`}
                    >
                      {formatSizeLabel(s)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  onAddToBag?.(
                    id,
                    selectedColor?.name,
                    selectedSize ?? undefined
                  )
                }
                disabled={actionsDisabled}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-[#1E1E1E] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-[#E7DED1] disabled:text-[#8a8375]"
              >
                {actionsDisabled ? (
                  actionLabel
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  onBuyNow?.(
                    id,
                    selectedColor?.name,
                    selectedSize ?? undefined
                  )
                }
                disabled={actionsDisabled}
                className="rounded-lg bg-[#C9A55C] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#b8944e] disabled:cursor-not-allowed disabled:bg-[#E7DED1] disabled:text-[#8a8375]"
              >
                Buy Now
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-[#E7DED1] pt-5">
              <div className="flex items-center gap-2 rounded-lg border border-[#E7DED1] px-3 py-2">
                <ShieldCheck className="h-4 w-4 text-[#C9A55C]" />

                <div className="text-xs">
                  <p className="font-medium text-[#1E1E1E]">
                    Secure Shopping
                  </p>

                  <p className="text-[#8a8375]">
                    256-bit SSL Encryption
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-[#E7DED1] px-3 py-2">
                <Lock className="h-4 w-4 text-[#C9A55C]" />

                <div className="text-xs">
                  <p className="font-medium text-[#1E1E1E]">
                    Exchange Guarantee
                  </p>

                  <p className="text-[#8a8375]">
                    within 7 days
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-[#E7DED1] px-3 py-2">
                <Truck className="h-4 w-4 text-[#C9A55C]" />

                <div className="text-xs">
                  <p className="font-medium text-[#1E1E1E]">
                    Fast Delivery
                  </p>

                  <p className="text-[#8a8375]">
                    within 24hrs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatKES(amount) {
  return `KES ${Number(amount).toLocaleString("en-KE")}`;
}