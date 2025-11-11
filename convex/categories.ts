import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("categories", args);
  },
});

// Seed categories
export const seedCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const existingCategories = await ctx.db.query("categories").collect();
    if (existingCategories.length > 0) return;

    const categories = [
      { name: "Mobile Phones", slug: "phones", icon: "📱", description: "Smartphones and accessories" },
      { name: "Vehicles", slug: "vehicles", icon: "🚗", description: "Cars, motorcycles, and auto parts" },
      { name: "Electronics", slug: "electronics", icon: "💻", description: "Computers, TVs, and gadgets" },
      { name: "Real Estate", slug: "real-estate", icon: "🏠", description: "Houses, apartments, and land" },
      { name: "Fashion", slug: "fashion", icon: "👕", description: "Clothing, shoes, and accessories" },
      { name: "Home & Garden", slug: "home-garden", icon: "🏡", description: "Furniture and home decor" },
      { name: "Services", slug: "services", icon: "🔧", description: "Professional and personal services" },
      { name: "Jobs", slug: "jobs", icon: "💼", description: "Job opportunities and career" },
    ];

    for (const category of categories) {
      await ctx.db.insert("categories", category);
    }
  },
});
