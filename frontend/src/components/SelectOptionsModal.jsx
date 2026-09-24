import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { formatSizeLabel } from "../lib/formatSize";

export default function SelectOptionsModal({
  product,
  isOpen,
  onClose,
  onConfirm,
  initialColorIndex = 0,
  initialSize = null,
}) {
  const [colorIndex, setColorIndex] = useState(initialColorIndex);
  const [size, setSize] = useState(initialSize);

  useEffect(() => {
    if (isOpen) {
      setColorIndex(initialColorIndex);
      setSize(initialSize);
    }
  }, [isOpen, initialColorIndex, initialSize, product?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const { name, price, colors = [], sizes = [] } = product;
  const selectedColor = colors[colorIndex];
  const thumbnail = selectedColor?.images?.[0];

  const handleConfirm = () => {
    if (!size) return;
    onConfirm?.({ colorName: selectedColor?.name, size });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Select options for ${name}`}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-lg font-semibold text-[#1E1E1E]">Select Options</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#8a8375] transition hover:bg-[#F8F6F2]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Product summary */}
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-[#E7DED1]">
              {thumbnail && (
                <img src={thumbnail} alt={name} className="h-full w-full object-cover" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1E1E1E]">{name}</p>
              <p className="text-sm text-[#C9A55C] font-medium">{formatKES(price)}</p>
            </div>
          </div>

          {/* Colors */}
          {colors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[#1E1E1E] mb-2">Select Color</p>
              <div className="grid grid-cols-3 gap-2">
                {colors.map((color, i) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setColorIndex(i)}
                    aria-pressed={i === colorIndex}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      i === colorIndex
                        ? "border-[#C9A55C] ring-1 ring-[#C9A55C] text-[#1E1E1E]"
                        : "border-[#E7DED1] text-[#5c564c] hover:border-[#8a8375]"
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10 flex-shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="truncate">{color.name}</span>
                  </button>
                ))}
              </div>
              {selectedColor && (
                <p className="mt-2 text-xs text-[#8a8375]">Selected: {selectedColor.name}</p>
              )}
            </div>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[#1E1E1E] mb-2">Available Sizes</p>
              <div className="grid grid-cols-3 gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    aria-pressed={size === s}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      size === s
                        ? "border-[#C9A55C] ring-1 ring-[#C9A55C] text-[#1E1E1E]"
                        : "border-[#E7DED1] text-[#5c564c] hover:border-[#8a8375]"
                    }`}
                  >
                    {formatSizeLabel(s)}
                  </button>
                ))}
              </div>
              {size && (
                <p className="mt-2 text-xs text-[#8a8375]">
                  Selected: {formatSizeLabel(size)}
                </p>
              )}
            </div>
          )}

          {/* Confirm */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!size}
            className={`w-full rounded-lg px-4 py-3 text-sm font-semibold transition ${
              size
                ? "bg-[#1E1E1E] text-white hover:bg-black"
                : "bg-[#E7DED1] text-[#8a8375] cursor-not-allowed"
            }`}
          >
            {size ? "Continue to Checkout" : "Select a size"}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-sm text-[#8a8375] hover:text-[#1E1E1E]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function formatKES(amount) {
  return `KES ${Number(amount).toLocaleString("en-KE")}`;
}