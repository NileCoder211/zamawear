import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { categories } from "../components/CategoriesData";

function CategoryGrid() {
  return (
    <section id="shop" className="max-w-7xl mx-auto px-5 md:px-10 py-14 md:py-20">
      <h2
        className="text-3xl text-center text-[#1E1E1E] mb-10"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        Shop by Category
      </h2>

      {/* Bento-style asymmetric grid — every 3rd tile runs tall
          (row-span-2), the rest pack in as a stacked pair beside it.
          auto-flow: dense lets this scale to any number of
          categories without hand-placing each tile. */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-5"
        style={{ gridAutoFlow: "dense", gridAutoRows: "180px" }}
      >
        {categories.map((cat, i) => {
          const isTall = i % 3 === 0;

          return (
            <Link
              key={cat.slug}
              to={`/category/${cat.slug}`}
              className={`group relative block rounded-2xl overflow-hidden bg-[#E7DED1]/50 ${
                isTall ? "row-span-2" : "row-span-1"
              }`}
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Gradient label pill, bottom of the card */}
              <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between bg-gradient-to-r from-white/95 via-white/85 to-white/60 backdrop-blur-sm rounded-full pl-4 pr-1.5 py-1.5">
                <span className="text-[11px] tracking-[0.2em] uppercase text-[#1E1E1E] truncate">
                  {cat.name}
                </span>
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#1E1E1E] flex items-center justify-center text-white group-hover:bg-[#C9A55C] transition-colors">
                  <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default CategoryGrid;