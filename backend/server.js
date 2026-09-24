import express from "express";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors"
import { fileURLToPath } from "url";




import authRoutes from "./routes/authRouter.js";
import verificationRoutes from "./routes/verificationRouter.js"
import productRoutes from "./routes/productRouter.js";
import cartRoutes from "./routes/cartRouter.js";
import couponRoutes from "./routes/couponRouter.js";
import couponRuleRoutes from "./routes/couponRuleRouter.js";
import analyticsRoutes from "./routes/analyticsRouter.js";
import mpesaRoutes from "./routes/mpesaRouter.js";
import orderRoutes from "./routes/orderRouter.js"
import wishlistRoutes from "./routes/wishlistRouter.js";
import viewerRoutes from "./routes/viewerRouter.js";
import categoryRoutes from "./routes/categoryRouter.js";
import subcategoryRoutes from "./routes/subcategoryRouter.js";
import whatsappRoutes from "./routes/whatsappRouter.js";






import { connectDB}  from "./lib/db.js";
dotenv.config();
const PORT = process.env.PORT || 5000;


const app = express();
app.use(express.json({limit: "10mb"}))
app.use(cookieParser());
app.use(cors({
  origin:"http://localhost:5173",
  credentials: true
}))


app.use("/api/auth", authRoutes);
app.use("/api", verificationRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/couponrules", couponRuleRoutes);
app.use("/api/mpesa", mpesaRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/viewer", viewerRoutes)
app.use("/api/categories", categoryRoutes);
app.use("/api/subcategories", subcategoryRoutes);
app.use("/api/whatsapp", whatsappRoutes);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendPath = path.join(__dirname, "../frontend/dist");

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.stack);
  res.status(500).json({
    message: err.message || "Internal Server Error",
  });
});
if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "frontend/dist");

  app.use(express.static(frontendPath));

  // ✅ Catch-all WITHOUT using path-to-regexp
  app.use((req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
} 



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
})
