import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useSearchSuggestions } from "../queries/useSearch";
import { useAddToCart } from "../queries/useCart";
import { mapApiProductToCard } from "../lib/MapApiProductToCard";
import ProductDetailPage from "../pages/ProductDetailPage";

const PRODUCTS_API = "/api/products";

function SearchBox({ className = "" }) {
  const [raw, setRaw] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // --- modal state: fetched-and-mapped product currently shown ---
  const [modalProduct, setModalProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingId, setLoadingId] = useState(null); // shows a subtle pending state on the clicked row

  const addToCartMutation = useAddToCart();

  // --- debounce 300ms ---
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(raw), 300);
    return () => clearTimeout(handle);
  }, [raw]);

  const { data: suggestions = [], isFetching } = useSearchSuggestions(debounced, open);

  // close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const goToSearch = useCallback(
    (term) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      setOpen(false);
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [navigate]
  );

  // Suggestions only carry name/price/image (kept small for typeahead
  // speed) — the modal needs the full product (colors, sizes,
  // description...), so fetch it by id before opening.
  const openProductModal = useCallback(async (productId) => {
    setLoadingId(productId);
    try {
      const res = await fetch(`${PRODUCTS_API}/${productId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load product");
      const data = await res.json();
      setModalProduct(mapApiProductToCard(data.product ?? data));
      setModalOpen(true);
      setOpen(false);
    } catch (err) {
      console.error("Failed to open product from search:", err);
    } finally {
      setLoadingId(null);
    }
  }, []);

  const handleAddToBag = (productId, colorName, size) => {
    addToCartMutation.mutate({ productId, color: colorName, size });
  };

  const handleBuyNow = (productId, colorName, size) => {
    addToCartMutation.mutate(
      { productId, color: colorName, size },
      { onSuccess: () => { window.location.href = "/cart"; } }
    );
  };

  function handleChange(e) {
    setRaw(e.target.value);
    setOpen(true);
    setActiveIndex(-1);
  }

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") goToSearch(raw);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) {
        openProductModal(suggestions[activeIndex].id);
      } else {
        goToSearch(raw);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && raw.trim().length >= 2;

  return (
    <>
      <div ref={containerRef} className={`relative w-full ${className}`}>
        <div className="flex items-center bg-white border border-[#E7DED1] rounded-full px-4 py-2">
          <input
            type="text"
            value={raw}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => raw.trim().length >= 2 && setOpen(true)}
            placeholder="Find product"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#8a8375]"
            aria-label="Search products"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            autoComplete="off"
          />
          <Search size={16} className="text-[#8a8375]" />
        </div>

        {showDropdown && (
          <ul
            role="listbox"
            className="absolute left-0 top-full mt-2 w-full bg-white border border-[#E7DED1] rounded-xl shadow-lg py-2 max-h-96 overflow-y-auto z-50"
          >
            {isFetching && suggestions.length === 0 && (
              <li className="px-4 py-2 text-[13px] text-[#8a8375]">Searching...</li>
            )}

            {!isFetching && suggestions.length === 0 && (
              <li className="px-4 py-2 text-[13px] text-[#8a8375]">No matches for "{raw}"</li>
            )}

            {suggestions.map((s, i) => (
              <li
                key={s.id}
                role="option"
                aria-selected={i === activeIndex}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  // fires before the outside-click handler's blur logic
                  e.preventDefault();
                  openProductModal(s.id);
                }}
                className={`flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors ${
                  i === activeIndex ? "bg-[#F8F6F2]" : "hover:bg-[#F8F6F2]"
                } ${loadingId === s.id ? "opacity-50" : ""}`}
              >
                <div className="w-10 h-10 rounded-md overflow-hidden bg-[#E7DED1] flex-shrink-0">
                  {s.image && <img src={s.image} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-heading text-[15px] text-[#1E1E1E] truncate">{s.name}</span>
                  <span className="text-[11px] text-[#8a8375]">
                    KES {s.price?.toLocaleString?.() ?? s.price}
                  </span>
                </div>
              </li>
            ))}

            {suggestions.length > 0 && (
              <li
                onMouseDown={(e) => {
                  e.preventDefault();
                  goToSearch(raw);
                }}
                className="px-4 py-2 text-[12px] text-[#C9A55C] text-center border-t border-[#E7DED1] mt-1 cursor-pointer hover:underline"
              >
                See all results for "{raw}"
              </li>
            )}
          </ul>
        )}
      </div>

      <ProductDetailPage
        product={modalProduct}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAddToBag={handleAddToBag}
        onBuyNow={handleBuyNow}
      />
    </>
  );
}

export default SearchBox;