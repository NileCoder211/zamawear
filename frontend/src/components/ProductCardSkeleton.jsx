// Loading placeholder matching ProductCard's actual layout — same
// aspect-ratio image area, swatch row, price line, and button rows —
// so a grid of skeletons doesn't visibly reflow once real cards load in.

export default function ProductCardSkeleton() {
  return (
    <div className="relative w-full max-w-[320px] overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 animate-pulse">
      {/* Image area */}
      <div className="aspect-[3/4] w-full bg-neutral-200" />

      {/* Info */}
      <div className="space-y-3 p-3">
        <div className="h-4 w-3/4 rounded bg-neutral-200" />

        <div className="h-5 w-1/3 rounded bg-neutral-200" />

        <div className="flex gap-1.5 pt-1">
          <div className="h-6 w-8 rounded bg-neutral-200" />
          <div className="h-6 w-8 rounded bg-neutral-200" />
          <div className="h-6 w-8 rounded bg-neutral-200" />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="h-9 rounded-lg bg-neutral-200" />
          <div className="h-9 rounded-lg bg-neutral-200" />
        </div>

        <div className="h-9 rounded-lg bg-neutral-200" />
      </div>
    </div>
  );
}