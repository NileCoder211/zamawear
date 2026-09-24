import { useFeaturedProducts } from "../queries/useProduct";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import Faq from "../components/Faq";
import Newsletter from "../components/NewsLetter";
import NewArrivals from "../components/NewArrivals";
import CategoryGrid from "../components/CategoryGrid";
import FeaturedProducts from "../components/FeaturedProducts";

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Poppins:wght@300;400;500;600&display=swap";

/* ------------------------------- TrustStrip -------------------------------- */
function TrustStrip() {
  return (
    <div className="border-y border-[#B9A58E]/20 bg-[#F8F6F2]">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 px-5 md:px-10 py-6 text-center">
        <div className="flex flex-col items-center gap-2 text-[#1E1E1E]/70">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" /><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.4" /></svg>
          <span className="text-[11px] tracking-[0.25em] uppercase">Secure Payments</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-[#1E1E1E]/70">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="8" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" /><path d="M14 11h4l3 3v2h-7v-5Z" stroke="currentColor" strokeWidth="1.4" /><circle cx="6.5" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.4" /><circle cx="17" cy="18" r="1.6" stroke="currentColor" strokeWidth="1.4" /></svg>
          <span className="text-[11px] tracking-[0.25em] uppercase">Fast Delivery</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-[#1E1E1E]/70">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0 1 13.7-5.7L20 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M20 12a8 8 0 0 1-13.7 5.7L4 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /><path d="M20 4v4h-4M4 20v-4h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
          <span className="text-[11px] tracking-[0.25em] uppercase">Easy Returns</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-[#1E1E1E]/70">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="10" r="6" stroke="currentColor" strokeWidth="1.4" /><path d="M9 15l-1.5 5L12 18l4.5 2L15 15" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
          <span className="text-[11px] tracking-[0.25em] uppercase">Excellent Service</span>
        </div>
      </div>
    </div>
  );
}
export default function HomePage() {
  const { data: featuredProducts = [] } = useFeaturedProducts();

  return (
    <div
      className="min-h-screen bg-[#F8F6F2] pt-[24px]"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <link rel="stylesheet" href={FONT_LINK} />

      <Navbar />
      <HeroSection />
      <TrustStrip />
      <CategoryGrid />
      <FeaturedProducts featuredProducts={featuredProducts} />
      <NewArrivals />
      <Newsletter />
      <Faq />
      <Footer />
    </div>
  );
}