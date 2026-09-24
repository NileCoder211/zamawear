import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useWishlist, useToggleLike } from "../queries/useWishlist";
import { useAddToCart } from "../queries/useCart";
import ProductCard from "../components/ProductCard"; // adjust path if different
import { mapApiProductToCard } from "../lib/MapApiProductToCard";

const WishlistPage = () => {
  const { data: wishlist = [], isLoading, isError } = useWishlist();
  const toggleLikeMutation = useToggleLike();
  const addToCartMutation = useAddToCart();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-[#8a8375]">
        Loading your saved pieces...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-[#8a8375]">
        Couldn't load your wishlist. Try refreshing the page.
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Heart className="mx-auto mb-4 h-10 w-10 text-[#E7DED1]" />
        <h2 className="font-heading text-lg font-semibold text-[#1E1E1E]">
          Nothing saved yet
        </h2>
        <p className="mt-1 text-sm text-[#8a8375]">
          Tap the heart on anything you like and it'll show up here.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex items-center justify-center rounded bg-[#1E1E1E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-black transition-colors"
        >
          Keep browsing
        </Link>
      </div>
    );
  }

  const handleToggleWishlist = (productId) => {
    const product = wishlist.find((p) => p._id === productId);
    if (product) toggleLikeMutation.mutate(product);
  };

  const handleAddToBag = (productId, colorName, size) => {
    addToCartMutation.mutate({ productId, color: colorName, size });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 font-heading text-xl font-semibold text-[#1E1E1E]">
        Saved pieces ({wishlist.length})
      </h1>

      <div className="grid grid-cols-1 gap-4 items-start sm:grid-cols-2 lg:grid-cols-4">
  {wishlist.map((product) => (
    <ProductCard
      key={product._id}
      product={mapApiProductToCard(product)}
      isWishlisted={true}
      onToggleWishlist={() => handleToggleWishlist(product._id)}
      onAddToBag={handleAddToBag}
    />
  ))}
</div>
    </div>
  );
};

export default WishlistPage;