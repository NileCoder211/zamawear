import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { Users, Package, ShoppingCart, DollarSign } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const AnalyticsTab = () => {
  const [analyticsData, setAnalyticsData] = useState({
    users: 0,
    products: 0,
    totalSales: 0,
    totalRevenue: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dailySalesData, setDailySalesData] = useState([]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const response = await axios.get("/analytics");
        setAnalyticsData(response.data.analyticsData);
        setDailySalesData(response.data.dailySalesData);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (isLoading) {
    return (
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-[#8a8375]"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AnalyticsCard
          title="Total Users"
          value={analyticsData.users.toLocaleString()}
          icon={Users}
        />
        <AnalyticsCard
          title="Total Products"
          value={analyticsData.products.toLocaleString()}
          icon={Package}
        />
        <AnalyticsCard
          title="Total Sales"
          value={analyticsData.totalSales.toLocaleString()}
          icon={ShoppingCart}
        />
        <AnalyticsCard
          title="Total Revenue"
          value={`KES ${analyticsData.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
        />
      </div>

      <motion.div
        className="bg-white border border-[#E7DED1] rounded-2xl p-6 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <h3
          className="text-xl text-[#1E1E1E] mb-4"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Sales & Revenue
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={dailySalesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7DED1" />

            <XAxis dataKey="date" stroke="#8a8375" tick={{ fontSize: 12 }} />

            <YAxis yAxisId="left" stroke="#8a8375" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#8a8375"
              tick={{ fontSize: 12 }}
            />

            <Tooltip
              contentStyle={{
                background: "#FFFFFF",
                border: "1px solid #E7DED1",
                borderRadius: "8px",
                fontFamily: "'Poppins', sans-serif",
                fontSize: "0.85rem",
              }}
            />
            <Legend wrapperStyle={{ fontFamily: "'Poppins', sans-serif", fontSize: "0.85rem" }} />

            <Line
              yAxisId="left"
              type="basis"
              dataKey="sales"
              stroke="#C9A55C"
              strokeWidth={3}
              activeDot={{ r: 7 }}
              name="Sales"
            />

            <Line
              yAxisId="right"
              type="basis"
              dataKey="revenue"
              stroke="#1E1E1E"
              strokeWidth={3}
              activeDot={{ r: 7 }}
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default AnalyticsTab;

const AnalyticsCard = ({ title, value, icon: Icon }) => (
  <motion.div
    className="relative overflow-hidden rounded-2xl bg-white border border-[#E7DED1] p-6 shadow-sm"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex justify-between items-center relative z-10">
      <div>
        <p className="text-[#8a8375] text-sm mb-1 tracking-wide uppercase">{title}</p>
        <h3
          className="text-[#1E1E1E] text-3xl font-semibold"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {value}
        </h3>
      </div>
    </div>
    <div className="absolute -bottom-4 -right-4 text-[#E7DED1]">
      <Icon className="h-28 w-28" strokeWidth={1.25} />
    </div>
  </motion.div>
);