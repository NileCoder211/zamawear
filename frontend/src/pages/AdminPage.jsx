import {
  BarChart,
  PlusCircle,
  ShoppingBasket,
  PackageCheck,
  Menu,
  X,
} from "lucide-react";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import AnalyticsTab from "../components/AnalyticsTab";
import CreateProductForm from "../components/CreateProductForm";
import ProductsList from "../components/ProductsList";
import OrdersTab from "../components/OrdersTab";

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Poppins:wght@300;400;500&display=swap";

const tabs = [
  {
    id: "create",
    label: "Create Product",
    icon: PlusCircle,
  },
  {
    id: "products",
    label: "Products",
    icon: ShoppingBasket,
  },
  {
    id: "orders",
    label: "Orders",
    icon: PackageCheck,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart,
  },
];

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // No global product store — ProductsList fetches its own data via
  // the useAllProducts react-query hook, so there's nothing to
  // pre-fetch or coordinate here.

  const renderContent = () => {
    switch (activeTab) {
      case "create":
        return <CreateProductForm />;

      case "products":
        return <ProductsList />;

      case "orders":
        return <OrdersTab />;

      case "analytics":
        return <AnalyticsTab />;

      default:
        return <CreateProductForm />;
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F8F6F2] flex overflow-hidden"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <link rel="stylesheet" href={FONT_LINK} />

      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-16 z-50 flex h-[95vh] w-72 flex-col bg-white px-6 py-8 shadow-2xl border-r border-[#E7DED1] transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* LOGO */}
        <div className="h-20 px-6 border-b border-[#E7DED1] flex items-center justify-between">
          <div>
            <h1
              className="text-2xl text-[#1E1E1E] tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Zamawear Admin
            </h1>

            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8375] mt-1">
              Dashboard Panel
            </p>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#8a8375]"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-[#1E1E1E] text-white shadow-sm"
                    : "text-[#5c564c] hover:bg-[#F8F6F2] hover:text-[#1E1E1E]"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="p-5 border-t border-[#E7DED1]">
          <div className="rounded-xl bg-[#F8F6F2] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#8a8375] mb-2">
              Admin Access
            </p>

            <h3
              className="text-[#1E1E1E]"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
            >
              Apparel & Body Care Management
            </h3>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-72">
        {/* MOBILE TOPBAR */}
        <div className="lg:hidden h-16 bg-white border-b border-[#E7DED1] px-5 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-[#1E1E1E]">
            <Menu size={22} />
          </button>

          <h1
            className="text-xl text-[#1E1E1E]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Admin Dashboard
          </h1>

          <div className="w-6" />
        </div>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-5 md:px-8 py-8 md:py-3">
            {/* HEADER */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-8"
            >
              <p className="text-[10px] uppercase text-center tracking-[0.2em] text-[#8a8375] mb-2">
                Admin Panel
              </p>

              <h1
                className="text-center text-4xl text-[#1E1E1E]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {tabs.find((t) => t.id === activeTab)?.label}
              </h1>
            </motion.div>

            {/* TAB CONTENT */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {renderContent()}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPage;