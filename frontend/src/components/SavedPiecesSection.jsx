import { Heart } from "lucide-react";
import { useWishlist, useToggleLike } from "../queries/useWishlist";
import { useUserStore } from "../stores/useUserStore";
import { useAddToCart } from "../queries/useCart";
import { mapApiProductToCard } from "../lib/MapApiProductToCard";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";

export default function SavedPiecesSection() {
  const { user } = useUserStore();
  const { data: wishlist = [], isLoading } = useWishlist(!!user);
  const addToCartMutation = useAddToCart();
  const toggleLikeMutation = useToggleLike();

  const handleAddToBag = (productId, colorName, size) => {
    addToCartMutation.mutate({ productId, color: colorName, size });
  };

  const handleToggleWishlist = (productId) => {
    const product = wishlist.find((p) => p._id === productId);
    if (product) toggleLikeMutation.mutate(product);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2
            className="text-3xl text-[#1E1E1E] mb-1"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Saved Pieces
          </h2>
          <p className="text-sm text-[#8a8375]">Your curated Zamawear collection.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2
            className="text-3xl text-[#1E1E1E] mb-1"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Saved Pieces
          </h2>
          <p className="text-sm text-[#8a8375]">Your curated Zamawear collection.</p>
        </div>

        <div className="bg-white border border-[#E7DED1] rounded-2xl py-20 px-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#F8F6F2] flex items-center justify-center mb-5">
            <Heart size={28} className="text-[#c9c3b6]" />
          </div>
          <h3 className="text-lg font-semibold text-[#1E1E1E] mb-2">No saved pieces yet</h3>
          <p className="text-sm text-[#8a8375] max-w-sm mx-auto">
            Save pieces you love and they'll appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-3xl text-[#1E1E1E] mb-1"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Saved Pieces
        </h2>
        <p className="text-sm text-[#8a8375]">
          {wishlist.length} saved item{wishlist.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {wishlist.map((product) => (
          <ProductCard
            key={product._id}
            product={mapApiProductToCard(product)}
            isWishlisted
            onAddToBag={handleAddToBag}
            onToggleWishlist={handleToggleWishlist}
          />
        ))}
      </div>
    </div>
  );
}