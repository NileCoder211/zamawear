// Run once with: node models/seedCategoriesModel.js
// Safe to re-run — uses find-or-create logic so it won't create duplicates.

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Category from "../models/categoryModel.js";
import Subcategory from "../models/subCategoryModel.js";

// .env lives in the project root (zamawear/), one level above backend/,
// so we can't rely on dotenv finding it from the current working directory.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const CATEGORY_STRUCTURE = [
  {
    name: "Women",
    subcategories: [
      "Dresses",
      "Shirts",
      "Shoes",
      "Trousers",
      "Skirts",
      "Sweaters",
    ],
  },
  {
    name: "Men",
    subcategories: ["Shirts", "Hats"],
  },
  {
    name: "Kids",
    subcategories: [
      "Dresses",
      "Tops",
      "T-Shirts",
      "Shorts",
      "Jackets",
      "Sweaters",
    ],
  },
  {
    name: "Thrift Finds",
    subcategories: ["Thrift Finds"],
  },
  {
    name: "Creams",
    subcategories: ["Creams"],
  },
];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  for (const cat of CATEGORY_STRUCTURE) {
    let category = await Category.findOne({ name: cat.name });
    if (!category) {
      category = await Category.create({ name: cat.name });
      console.log(`Created category: ${cat.name}`);
    }

    for (const subName of cat.subcategories) {
      const exists = await Subcategory.findOne({
        name: subName,
        category: category._id,
      });
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
