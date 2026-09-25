import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Settings } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useUserOrders, useCancelOrder } from "../queries/useOrder";

import Sidebar from "../components/Sidebar";
import ProfileSection from "../components/ProfileSection";
import OrdersSection from "../components/OrdersSection";
import SavedPiecesSection from "../components/SavedPiecesSection";
import SettingsSection from "../components/SettingsSection";

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Poppins:wght@300;400;500;600&display=swap";

const UserProfilePage = () => {
  const { user, logout } = useUserStore();
  const { data: orders = [], isLoading: loading } = useUserOrders(!!user);
  const cancelOrderMutation = useCancelOrder();

  const navigate = useNavigate();
  const { hash } = useLocation();

  const [active, setActive] = useState("profile");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (hash === "#orders") setActive("orders");
    else if (hash === "#saved") setActive("saved");
    else if (hash === "#addresses") setActive("addresses");
    else if (hash === "#settings") setActive("settings");
  }, [hash]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleCancelOrder = (orderId) => {
    cancelOrderMutation.mutate(orderId);
  };

  const renderContent = () => {
    switch (active) {
      case "profile":
        return <ProfileSection user={user} />;
      case "orders":
        return (
          <OrdersSection orders={orders} loading={loading} cancelOrder={handleCancelOrder} />
        );
      case "saved":
        return <SavedPiecesSection />;
      case "settings":
        return <SettingsSection user={user} />;
      // "addresses" falls through to the default view below — no
      // dedicated section built for it yet.
      default:
        return <ProfileSection user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <link rel="stylesheet" href={FONT_LINK} />

      <Sidebar
        active={active}
        setActive={setActive}
        user={user}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex-1 lg:ml-72 min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-[#E7DED1] px-5 h-16 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="text-[#1E1E1E]">
            <Menu size={22} />
          </button>
          <span className="text-xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Zamawear
          </span>
          <button onClick={() => setMobileOpen(true)} className="text-[#8a8375]">
            <Settings size={20} />
          </button>
        </div>

        <main className="max-w-4xl mx-auto px-5 md:px-10 py-10 md:py-14">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default UserProfilePage;