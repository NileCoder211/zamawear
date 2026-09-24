import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Heart,
  Package,
  Tag,
  Search,
  ChevronDown,
  UserPlus,
  LogIn,
  Lock,
  Menu,
  X,
} from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useCart } from "../queries/useCart";
import { useWishlist } from "../queries/useWishlist";
import { useCategories } from "../queries/useCategories";
import { useSubcategories } from "../queries/useSubcategories";
import SearchBox from "./SearchBox";

function CategoryDropdown({ category, isOpen }) {
  const { data: subcategories, isLoading } = useSubcategories(isOpen ? category.slug : null);

  if (!isOpen) return null;

  return (
    <div className="absolute left-0 top-full pt-2 z-50">
      <div className="bg-white border border-[#E7DED1] rounded-xl shadow-lg py-2 min-w-[180px]">
        {isLoading ? (
          <p className="px-4 py-2 text-xs text-[#8a8375]">Loading...</p>
        ) : subcategories?.length > 0 ? (
          subcategories.map((sub) => (
            <Link
              key={sub._id}
              to={`/category/${category.slug}?sub=${sub.slug}`}
              className="block px-4 py-2 text-[13px] text-[#1E1E1E] hover:bg-[#F8F6F2] hover:text-[#C9A55C] transition-colors"
            >
              {sub.name}
            </Link>
          ))
        ) : (
          <Link
            to={`/category/${category.slug}`}
            className="block px-4 py-2 text-[13px] text-[#1E1E1E] hover:bg-[#F8F6F2] hover:text-[#C9A55C] transition-colors"
          >
            View all
          </Link>
        )}
      </div>
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const [hoveredSlug, setHoveredSlug] = useState(null);
  const navigate = useNavigate();
  const { user, logout } = useUserStore();
  const isAdmin = user?.role === "admin";

  const { data: categories = [] } = useCategories();
  const { data: cart = [] } = useCart(!!user);
  const { data: wishlist = [] } = useWishlist(!!user);

  const handleProfileClick = () => {
    navigate(isAdmin ? "/secret-dashboard" : "/user-profile");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#F8F6F2] border-b border-[#B9A58E]/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 px-5 md:px-10 py-3">
        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-[#1E1E1E]"
          aria-label="Open menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link to="/" aria-label="Zama Wear — home" className="flex items-center gap-2 flex-shrink-0">
            <img src="/zamalogo.png" alt="Zama Wear" className="h-8 w-8" />
            <span className="hidden sm:flex flex-col leading-none">
              <span className="text-base tracking-[0.1em] text-[#1E1E1E] font-heading font-bold">
                ZAMA
              </span>
              <span className="text-[10px] font-bold tracking-[0.4em] text-[#1E1E1E]/70 font-heading">
                wear
              </span>
            </span>
          </Link>

          {/* Divider between logo and categories */}
          <div className="hidden md:block w-px h-6 bg-[#1E1E1E]/20" />

          {/* Category nav with hover dropdowns */}
          <nav className="hidden md:flex items-center gap-6 text-[12px] font-semibold tracking-wide text-[#1E1E1E]">
            {categories.map((category) => (
              <div
                key={category._id}
                className="relative"
                onMouseEnter={() => setHoveredSlug(category.slug)}
                onMouseLeave={() => setHoveredSlug(null)}
              >
                <Link
                  to={`/category/${category.slug}`}
                  className="flex items-center gap-1 py-2 hover:text-[#C9A55C] transition-colors"
                >
                  {category.name}
                  <ChevronDown size={13} />
                </Link>
                <CategoryDropdown category={category} isOpen={hoveredSlug === category.slug} />
              </div>
            ))}

            <Link to="/offers" className="flex items-center gap-1 hover:text-[#C9A55C] transition-colors">
              <Tag size={13} />
              Offers
            </Link>
          </nav>
        </div>

        {/* Search */}
<div className="hidden md:flex items-center flex-1 max-w-xs">
  <SearchBox />
</div>

        {/* Icon row */}
        <div className="flex items-center gap-4 sm:gap-5 text-[#1E1E1E]">
          {/* Orders — replaces the old notification bell */}
          {user && (
            <Link
              to="/orders"
              title="My Orders"
              className="hidden sm:flex flex-col items-center gap-0.5 hover:text-[#C9A55C] transition-colors"
            >
              <Package size={19} />
              <span className="text-[10px] font-semibold">Orders</span>
            </Link>
          )}

          {/* Wishlist — now with a count badge, same treatment as cart */}
          <Link
            to="/wishlist"
            title="Wishlist"
            className="relative hidden sm:flex flex-col items-center gap-0.5 hover:text-[#C9A55C] transition-colors"
          >
            <span className="relative">
              <Heart size={19} />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#1E1E1E] text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px]">
                  {wishlist.length}
                </span>
              )}
            </span>
            <span className="text-[10px] font-semibold">Saved</span>
          </Link>
          

          {/* Cart */}
          {user && (
            <Link to="/cart" className="relative flex items-center hover:text-[#C9A55C] transition-colors">
              <ShoppingCart size={19} />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#1E1E1E] text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px]">
                  {cart.length}
                </span>
              )}
            </Link>
          )}

          {/* Admin dashboard shortcut */}
          {isAdmin && (
            <Link
              to="/secret-dashboard"
              className="flex items-center gap-1 bg-[#1E1E1E] hover:bg-black text-white px-2.5 py-1.5 rounded text-xs font-semibold transition-colors"
            >
              <Lock size={14} />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}

          {/* Auth — user icon + logout kept as-is */}
          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleProfileClick}
                title={isAdmin ? "Admin Dashboard" : "My Profile"}
                className="w-8 h-8 rounded-full bg-[#1E1E1E] text-white flex items-center justify-center text-sm font-semibold hover:bg-black transition-colors"
              >
                {user.name?.[0]?.toUpperCase() || "U"}
              </button>
              <button
                onClick={handleLogout}
                className="hidden sm:inline text-xs font-semibold text-[#8a8375] hover:text-red-600 transition-colors"
              >
                Log out
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/signup"
                className="flex items-center gap-1 bg-[#1E1E1E] hover:bg-black text-white px-2.5 py-1.5 rounded text-xs font-semibold transition-colors"
              >
                <UserPlus size={14} />
                Sign Up
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-1 border border-[#1E1E1E] text-[#1E1E1E] px-2.5 py-1.5 rounded text-xs font-semibold hover:bg-[#1E1E1E] hover:text-white transition-colors"
              >
                <LogIn size={14} />
                Login
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden flex flex-col gap-1 px-6 pb-6 text-sm font-semibold text-[#1E1E1E]">
           <div className="py-3">
    <SearchBox />
  </div>
          {categories.map((category) => (
            <Link
              key={category._id}
              to={`/category/${category.slug}`}
              onClick={() => setOpen(false)}
              className="py-2 border-b border-[#E7DED1]/60"
            >
              {category.name}
            </Link>
          ))}
          <Link to="/offers" onClick={() => setOpen(false)} className="py-2 border-b border-[#E7DED1]/60">
            Offers
          </Link>
          <Link to="/wishlist" onClick={() => setOpen(false)} className="flex items-center justify-between py-2 border-b border-[#E7DED1]/60">
            Wishlist
            {wishlist.length > 0 && (
              <span className="bg-[#1E1E1E] text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px]">
                {wishlist.length}
              </span>
            )}
          </Link>

          {!user && (
            <div className="flex flex-col gap-2 pt-4">
              <Link
                to="/signup"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 bg-[#1E1E1E] text-white px-3 py-2 rounded text-sm"
              >
                <UserPlus size={16} />
                Sign Up
              </Link>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 border border-[#1E1E1E] text-[#1E1E1E] px-3 py-2 rounded text-sm"
              >
                <LogIn size={16} />
                Login
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}

export default Navbar;