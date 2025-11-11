import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    icon: v.string(),
    description: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  listings: defineTable({
    title: v.string(),
    description: v.string(),
    price: v.number(),
    categoryId: v.id("categories"),
    condition: v.union(v.literal("new"), v.literal("used")),
    location: v.string(),
    sellerId: v.id("users"),
    images: v.array(v.id("_storage")),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("sold")
    ),
    featured: v.optional(v.boolean()),
    views: v.optional(v.number()),
  })
    .index("by_seller", ["sellerId"])
    .index("by_category", ["categoryId"])
    .index("by_status", ["status"])
    .index("by_location", ["location"])
    .searchIndex("search_listings", {
      searchField: "title",
      filterFields: ["categoryId", "status", "location"],
    }),

  messages: defineTable({
    listingId: v.id("listings"),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    read: v.boolean(),
  })
    .index("by_listing", ["listingId"])
    .index("by_conversation", ["listingId", "senderId", "receiverId"]),

  savedListings: defineTable({
    userId: v.id("users"),
    listingId: v.id("listings"),
  })
    .index("by_user", ["userId"])
    .index("by_listing", ["listingId"]),

  userProfiles: defineTable({
    userId: v.id("users"),
    bio: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    verified: v.optional(v.boolean()),
    avatar: v.optional(v.id("_storage")),
  }).index("by_user", ["userId"]),

  // NEW: Proper admin roles table
  adminRoles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("super_admin"), v.literal("moderator")),
    grantedBy: v.id("users"),
    grantedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["role"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
