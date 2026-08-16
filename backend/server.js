import express from "express";
import dotenv from "dotenv";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors"



import authRoutes from "./routes/authRouter.js";
import verificationRoutes from "./routes/verificationRouter.js"

import { connectDB}  from "./lib/db.js";
dotenv.config();
const PORT = process.env.PORT || 5000;


const app = express();
app.use(express.json())
app.use(cookieParser());
app.use(cors());


app.use("/api/auth", authRoutes);
app.use("/api", verificationRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectDB();
})