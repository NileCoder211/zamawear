import { useRef, useState } from "react";
import { Eye, Heart, ShoppingBag, Share2 } from "lucide-react";
import { useViewerCount } from "../queries/useViewerCount";

/**
 * VideoCard
 *
 * A shoppable-video variant of ProductCard — same footprint, autoplaying
 * muted video instead of a static image carousel, with floating action
 * icons (wishlist / add-to-bag / share) instead of the swatch + button rail.
 *
 * Props:
 *  - video: {
 *      id: string,          // used as the "product" id for viewer tracking
 *      src: string,         // video url (mp4/webm)
 *      poster?: string,     // fallback poster image
 *    }
 *  - isWishlisted?: boolean
 *  - onToggleWishlist?: (id: string) => void
 *  - onAddToBag?: (id: string) => void
 *  - onShare?: (id: string) => void
 */
export default function VideoCard({
  video,
  isWishlisted = false,
  onToggleWishlist,
  onAddToBag,
  onShare,
}) {
  const { id, src, poster } = video;
  const videoRef = useRef(null);
  const [wishlisted, setWishlisted] = useState(isWishlisted);

  const { count: viewerCount } = useViewerCount(id);

  const handleWishlistClick = () => {
    setWishlisted((w) => !w);
    onToggleWishlist?.(id);
  };

  const handleShareClick = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url: window.location.href });
      } catch {
        // user cancelled share sheet — no-op
      }
    }
    onShare?.(id);
  };

  return (
    <div className="relative w-full max-w-[280px] overflow-hidden rounded-2xl bg-neutral-900 shadow-sm ring-1 ring-black/5">
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
        />

        {/* Viewer count badge */}
        {viewerCount > 0 && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Eye className="h-3.5 w-3.5" />
            <span>{viewerCount} viewing</span>
          </div>
        )}

        {/* Floating action rail */}
        <div className="absolute bottom-3 right-3 flex flex-col items-center gap-2.5">
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-pressed={wishlisted}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow transition hover:scale-105"
          >
            <Heart className="h-4 w-4" fill={wishlisted ? "currentColor" : "none"} />
          </button>

          <button
            type="button"
            onClick={() => onAddToBag?.(id)}
            aria-label="Add to bag"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow transition hover:scale-105"
          >
            <ShoppingBag className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleShareClick}
            aria-label="Share"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow transition hover:scale-105"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}