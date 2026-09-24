// Central category + subcategory data used by CategoryGrid and CategoryPage.
// Add/edit subcategories here — both components read from this file.

export const categories = [
  {
    name: "Women",
    slug: "women",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=530&fit=crop",
    subcategories: ["Dresses", "Skirts", "Shoes", "Trousers", "Shirts", "Sweaters"],
  },
  {
    name: "Men",
    slug: "men",
    image: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=400&h=530&fit=crop",
    subcategories: ["Shirts", "Hats"],
  },
  {
    name: "Kids",
    slug: "kids",
    image: "https://images.unsplash.com/photo-1519457851430-e6c2fb5c3e17?w=400&h=530&fit=crop",
    subcategories: ["Dresses", "Tops", "T-Shirts", "Shorts", "Jackets", "Sweaters"],
  },
  {
    name: "Thrift Finds",
    slug: "thrift-finds",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=530&fit=crop",
    subcategories: [],
  },
  {
    name: "Creams",
    slug: "creams",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=530&fit=crop",
    subcategories: [],
  },
];

export function getCategoryBySlug(slug) {
  return categories.find((cat) => cat.slug === slug);
}