// Run once with: node scripts/seedCategories.js
// Safe to re-run — uses upsert-style logic so it won't create duplicates.

import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/categoryModel.js";
import Subcategory from "../models/subcategoryModel.js";

dotenv.config();

const CATEGORY_STRUCTURE = [
  {
    name: "Male",
    subcategories: ["Shirts", "T-Shirts", "Trousers", "Jackets", "Suits", "Shoes"],
  },
  {
    name: "Female",
    subcategories: ["Dresses", "Tops", "Skirts", "Trousers", "Bags", "Shoes"],
  },
  {
    name: "Children",
    subcategories: ["Boys Wear", "Girls Wear", "Baby Wear", "Shoes"],
  },
  {
    name: "Body Lotions & Creams",
    subcategories: ["Body Lotion", "Body Cream", "Face Cream", "Sunscreen", "Body Oil"],
  },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  for (const cat of CATEGORY_STRUCTURE) {
    let category = await Category.findOne({ name: cat.name });
    if (!category) {
      category = await Category.create({ name: cat.name });
      console.log(`Created category: ${cat.name}`);
    }

    for (const subName of cat.subcategories) {
      const exists = await Subcategory.findOne({ name: subName, category: category._id });
      if (!exists) {
        await Subcategory.create({ name: subName, category: category._id });
        console.log(`  Created subcategory: ${subName} (under ${cat.name})`);
      }
    }
  }

  console.log("Seeding complete");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});