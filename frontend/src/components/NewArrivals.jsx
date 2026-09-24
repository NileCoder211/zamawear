
const newArrivals = [
  { id: "sofia-dress", name: "The Sofia Dress", price: 4500, image: "https://images.unsplash.com/photo-1495385794356-15371f348c31?q=80&w=500&auto=format&fit=crop" },
  { id: "amara-set", name: "The Amara Set", price: 3800, image: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?q=80&w=500&auto=format&fit=crop" },
  { id: "layla-blouse", name: "The Layla Blouse", price: 2900, image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=500&auto=format&fit=crop" },
  { id: "baby-milan-set", name: "Baby Milan Set", price: 2500, image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?q=80&w=500&auto=format&fit=crop" },
];




function NewArrivals() {
  return (
    <section id="new-arrivals" className="bg-[#E7DED1]/40 py-14 md:py-20">
      <div className="max-w-7xl mx-auto px-5 md:px-10">
        <h2 className="text-3xl text-center text-[#1E1E1E] mb-1" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          New Arrivals
        </h2>
        <p className="text-center text-[#1E1E1E]/60 text-sm mb-10">New pieces, timeless feeling.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {newArrivals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="text-center mt-10">
          <a href="#" className="inline-block border border-[#1E1E1E] text-[#1E1E1E] px-8 py-3 text-[13px] tracking-[0.25em] uppercase hover:bg-[#1E1E1E] hover:text-[#F8F6F2] transition-colors">
            View All Arrivals
          </a>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- ProductCard -------------------------------- */
function ProductCard({ product }) {
  return (
    <div className="group">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#E7DED1]/50 mb-3">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <button aria-label="Add to wishlist" className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#F8F6F2]/90 flex items-center justify-center text-[#1E1E1E]/70 hover:text-[#C9A55C]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 20s-7-4.35-9.5-8.5C.7 8 2.3 4.5 6 4.5c2 0 3.5 1.2 6 3.7 2.5-2.5 4-3.7 6-3.7 3.7 0 5.3 3.5 3.5 7C19 15.65 12 20 12 20Z" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>
      <h3 className="text-sm text-[#1E1E1E] mb-1">{product.name}</h3>
      <p className="text-sm text-[#1E1E1E]/60">KSh {product.price.toLocaleString()}</p>
    </div>
  );
}


export default NewArrivals;