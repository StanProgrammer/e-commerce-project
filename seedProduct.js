
const API_URL = "http://localhost:3000/api/products/create-product";

const ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTRjZGJjZDRmMGRiY2Y2OTIwMTc1NDkiLCJ1c2VybmFtZSI6IkF0aWsiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3Njc3ODk0MjQsImV4cCI6MTc2ODM5NDIyNH0.Y_LISeREhOx8IsXHuVefDd2OQfs9MRRjZD0PT-iSnB0";

const products = [
  {
    name: "Leather Handbag",
    category: "accessories",
    description: "Premium leather handbag with spacious compartments.",
    price: 79.99,
    oldPrice: 99.99,
    image: "https://images.unsplash.com/photo-1512201078372-9c6b2a0d528a",
    color: "black",
    rating: 4.5,
    
  },
  {
    name: "Classic Wrist Watch",
    category: "accessories",
    description: "Elegant wrist watch with leather strap.",
    price: 120,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    color: "gold",
    rating: 4.2,
    
  },
  {
    name: "Men's Casual Shirt",
    category: "clothes",
    description: "Comfortable cotton casual shirt for daily wear.",
    price: 45,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    color: "blue",
    rating: 4.1,
    
  },
  {
    name: "Women's Summer Dress",
    category: "clothes",
    description: "Lightweight summer dress perfect for warm weather.",
    price: 65,
    image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956",
    color: "red",
    rating: 4.6,
    
  },
  {
    name: "Gold Plated Necklace",
    category: "jewellery",
    description: "Elegant gold plated necklace for special occasions.",
    price: 150,
    image: "https://images.unsplash.com/photo-1600180758890-6b94519a8ba6",
    color: "gold",
    rating: 4.8,
    
  },
  {
    name: "Silver Stud Earrings",
    category: "jewellery",
    description: "Minimal silver stud earrings for daily use.",
    price: 40,
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a",
    color: "silver",
    rating: 4.0,
    
  },
  {
    name: "Matte Lipstick",
    category: "cosmetics",
    description: "Long-lasting matte lipstick with rich pigment.",
    price: 25,
    image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa",
    color: "red",
    rating: 4.4,
    
  },
  {
    name: "Face Moisturizer",
    category: "cosmetics",
    description: "Hydrating face moisturizer for all skin types.",
    price: 30,
    image: "https://images.unsplash.com/photo-1585238342028-4bbcfc1d0a6a",
    color: "beige",
    rating: 4.3,
    
  },
  {
    name: "Denim Jeans",
    category: "clothes",
    description: "Slim fit denim jeans with stretch fabric.",
    price: 70,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d",
    color: "blue",
    rating: 4.2,
    
  },
  {
    name: "Running Sneakers",
    category: "clothes",
    description: "Lightweight running sneakers with cushioned sole.",
    price: 110,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    color: "black",
    rating: 4.6,
    
  },

  /* ---------- 10 more ---------- */

  {
    name: "Canvas Backpack",
    category: "accessories",
    description: "Durable canvas backpack for everyday use.",
    price: 55,
    image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f",
    color: "beige",
    rating: 4.1,
    
  },
  {
    name: "Silk Scarf",
    category: "accessories",
    description: "Soft silk scarf with elegant pattern.",
    price: 35,
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c",
    color: "red",
    rating: 4.0,
    
  },
  {
    name: "Leather Belt",
    category: "accessories",
    description: "Genuine leather belt with metal buckle.",
    price: 40,
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990",
    color: "black",
    rating: 4.3,
    
  },
  {
    name: "Pearl Bracelet",
    category: "jewellery",
    description: "Elegant pearl bracelet for formal wear.",
    price: 95,
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519",
    color: "silver",
    rating: 4.7,
    
  },
  {
    name: "Eyeliner Pen",
    category: "cosmetics",
    description: "Waterproof eyeliner pen with precise tip.",
    price: 20,
    image: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd",
    color: "black",
    rating: 4.1,
    
  },
  {
    name: "Foundation Cream",
    category: "cosmetics",
    description: "Smooth foundation cream with natural finish.",
    price: 45,
    image: "https://images.unsplash.com/photo-1589782434635-3c3ad30d55b3",
    color: "beige",
    rating: 4.4,
    
  },
  {
    name: "Cotton T-Shirt",
    category: "clothes",
    description: "Breathable cotton t-shirt for everyday comfort.",
    price: 25,
    image: "https://images.unsplash.com/photo-1520974735194-6c8b0a1e5c45",
    color: "green",
    rating: 4.0,
    
  },
  {
    name: "Formal Blazer",
    category: "clothes",
    description: "Tailored formal blazer for professional look.",
    price: 180,
    image: "https://images.unsplash.com/photo-1520974735194-6c8b0a1e5c45",
    color: "black",
    rating: 4.6,
    
  },
  {
    name: "Charm Ring",
    category: "jewellery",
    description: "Stylish charm ring with minimalist design.",
    price: 60,
    image: "https://images.unsplash.com/photo-1602524812218-4b0f41a7db06",
    color: "gold",
    rating: 4.2,
    
  },
  {
    name: "Compact Powder",
    category: "cosmetics",
    description: "Lightweight compact powder for smooth finish.",
    price: 28,
    image: "https://images.unsplash.com/photo-1590159763121-7c9c11c0f7d4",
    color: "beige",
    rating: 4.1,
    
  }
];

const seedProducts = async (count = 20) => {
  try {
    for (let i = 0; i < count; i++) {
        const product = {
        ...products[i % products.length],
        name: `${products[i % products.length].name} ${i + 1}`,
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `token=${ADMIN_TOKEN}`,
        },
        body: JSON.stringify(product),
      });

      if (!res.ok) {
        const err = await res.json();
        throw err;
      }

        const data = await res.json();
        const created = data.savedProduct || data.product || data;
        console.log(`✅ Product ${i + 1} created → ${created._id || created.id}`);
    }

    console.log("🎉 All products created successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating products:", error);
    process.exit(1);
  }
};

seedProducts(20);
