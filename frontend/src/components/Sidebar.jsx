import { Package, Heart, MapPin, LogOut, User, Settings, X } from "lucide-react";

const NAV_ITEMS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "orders", label: "My Orders", icon: Package },
  { id: "saved", label: "Saved Pieces", icon: Heart },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "settings", label: "Account Settings", icon: Settings },
];

const Sidebar = ({ active, setActive, user, onLogout, mobileOpen, setMobileOpen })=>{
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-16 left-0 z-50 w-72 bg-white border-r border-[#E7DED1] flex flex-col transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{ height: "calc(100vh - 4rem)" }}
      >
        <div className="p-8 border-b border-[#E7DED1]">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-2xl text-[#1E1E1E] tracking-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Zamawear
              </h1>
              <p className="text-[10px] text-[#8a8375] tracking-[0.2em] uppercase mt-1">
                Member Account
              </p>
            </div>

            <button className="lg:hidden text-[#8a8375]" onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* User */}
        <div className="px-6 py-5 border-b border-[#E7DED1]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full bg-[#1E1E1E] flex items-center justify-center text-white text-sm shrink-0"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1E1E1E] truncate">
                {user?.name || "Member"}
              </p>
              <p className="text-xs text-[#8a8375] truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActive(id);
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all text-sm ${
                active === id
                  ? "bg-[#1E1E1E] text-white"
                  : "text-[#5c564c] hover:bg-[#F8F6F2] hover:text-[#1E1E1E]"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#E7DED1]">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#8a8375] hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;