import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Check if user has admin privileges
async function checkAdminRole(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return { isAdmin: false, userId: null };
  
  const adminRole = await ctx.db
    .query("adminRoles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();
  
  return { isAdmin: !!adminRole, userId, role: adminRole?.role || null };
}

export const getListings = query({
  args: {
    categoryId: v.optional(v.id("categories")),
    location: v.optional(v.string()),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let listings;

    if (args.search) {
      listings = await ctx.db
        .query("listings")
        .withSearchIndex("search_listings", (q) => {
          let searchQuery = q.search("title", args.search!);
          if (args.categoryId) {
            searchQuery = searchQuery.eq("categoryId", args.categoryId);
          }
          if (args.location) {
            searchQuery = searchQuery.eq("location", args.location);
          }
          return searchQuery.eq("status", "approved");
        })
        .take(args.limit || 20);
    } else {
      listings = await ctx.db
        .query("listings")
        .withIndex("by_status", (q) => q.eq("status", "approved"))
        .order("desc")
        .take(args.limit || 20);
    }

    // Filter by price range if specified
    if (args.minPrice !== undefined || args.maxPrice !== undefined) {
      listings = listings.filter((listing) => {
        if (args.minPrice !== undefined && listing.price < args.minPrice) return false;
        if (args.maxPrice !== undefined && listing.price > args.maxPrice) return false;
        return true;
      });
    }

    // Get seller info and images for each listing
    const listingsWithDetails = await Promise.all(
      listings.map(async (listing) => {
        const seller = await ctx.db.get(listing.sellerId);
        const category = await ctx.db.get(listing.categoryId);
        const imageUrls = await Promise.all(
          listing.images.map(async (imageId) => {
            const url = await ctx.storage.getUrl(imageId);
            return url;
          })
        );

        return {
          ...listing,
          seller: seller ? { name: seller.name, email: seller.email, _id: seller._id } : null,
          category: category && 'name' in category ? category.name : "Unknown",
          imageUrls: imageUrls.filter(Boolean),
        };
      })
    );

    return listingsWithDetails;
  },
});

export const getFeaturedListings = query({
  args: {},
  handler: async (ctx) => {
    const listings = await ctx.db
      .query("listings")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .filter((q) => q.eq(q.field("featured"), true))
      .order("desc")
      .take(8);

    return Promise.all(
      listings.map(async (listing) => {
        const seller = await ctx.db.get(listing.sellerId);
        const category = await ctx.db.get(listing.categoryId);
        const imageUrls = await Promise.all(
          listing.images.map(async (imageId) => {
            const url = await ctx.storage.getUrl(imageId);
            return url;
          })
        );

        return {
          ...listing,
          seller: seller ? { name: seller.name, email: seller.email, _id: seller._id } : null,
          category: category && 'name' in category ? category.name : "Unknown",
          imageUrls: imageUrls.filter(Boolean),
        };
      })
    );
  },
});

export const getListingById = query({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing) return null;

    const seller = await ctx.db.get(listing.sellerId);
    const category = await ctx.db.get(listing.categoryId);
    const imageUrls = await Promise.all(
      listing.images.map(async (imageId) => {
        const url = await ctx.storage.getUrl(imageId);
        return url;
      })
    );

    return {
      ...listing,
      seller: seller ? { name: seller.name, email: seller.email, _id: seller._id } : null,
      category: category && 'name' in category ? category.name : "Unknown",
      imageUrls: imageUrls.filter(Boolean),
    };
  },
});

export const incrementViews = mutation({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.id);
    if (!listing) return;

    await ctx.db.patch(args.id, {
      views: (listing.views || 0) + 1,
    });
  },
});

export const createListing = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    price: v.number(),
    categoryId: v.id("categories"),
    condition: v.union(v.literal("new"), v.literal("used")),
    location: v.string(),
    images: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to create listing");
    }

    return await ctx.db.insert("listings", {
      ...args,
      sellerId: userId,
      status: "pending",
      views: 0,
    });
  },
});

export const getUserListings = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const listings = await ctx.db
      .query("listings")
      .withIndex("by_seller", (q) => q.eq("sellerId", userId))
      .order("desc")
      .collect();

    return Promise.all(
      listings.map(async (listing) => {
        const category = await ctx.db.get(listing.categoryId);
        const imageUrls = await Promise.all(
          listing.images.slice(0, 1).map(async (imageId) => {
            const url = await ctx.storage.getUrl(imageId);
            return url;
          })
        );

        return {
          ...listing,
          category: category && 'name' in category ? category.name : "Unknown",
          imageUrls: imageUrls.filter(Boolean),
        };
      })
    );
  },
});

export const updateListingStatus = mutation({
  args: {
    id: v.id("listings"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("sold")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in");
    }

    const listing = await ctx.db.get(args.id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    const { isAdmin } = await checkAdminRole(ctx);

    // Business logic for who can change what status:
    if (args.status === "sold") {
      // Only the seller can mark their own listing as sold
      if (listing.sellerId !== userId) {
        throw new Error("Only the seller can mark their listing as sold");
      }
    } else if (args.status === "approved" || args.status === "rejected") {
      // Only admins can approve or reject listings
      if (!isAdmin) {
        throw new Error("Only admins can approve or reject listings");
      }
    } else if (args.status === "pending") {
      // Sellers can resubmit rejected listings, admins can change any status
      if (listing.sellerId !== userId && !isAdmin) {
        throw new Error("Only the seller or admin can change listing to pending");
      }
    }

    return await ctx.db.patch(args.id, { status: args.status });
  },
});

// Admin-only function to feature/unfeature listings
export const toggleFeaturedListing = mutation({
  args: { 
    id: v.id("listings"),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { isAdmin } = await checkAdminRole(ctx);
    
    if (!isAdmin) {
      throw new Error("Only admins can feature listings");
    }

    const listing = await ctx.db.get(args.id);
    if (!listing) {
      throw new Error("Listing not found");
    }

    return await ctx.db.patch(args.id, { featured: args.featured });
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
