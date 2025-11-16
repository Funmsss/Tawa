import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

// Check if user has admin privileges
async function checkAdminRole(ctx: any, requiredRole: "super_admin" | "moderator" = "moderator") {
  const userId = await getAuthUserId(ctx);
  if (!userId) return { isAdmin: false, userId: null };
  
  const adminRole = await ctx.db
    .query("adminRoles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .first();
  
  if (!adminRole) return { isAdmin: false, userId };
  
  // Super admin can do everything, moderator has limited access
  const hasPermission = adminRole.role === "super_admin" || 
    (adminRole.role === "moderator" && requiredRole === "moderator");
  
  return { isAdmin: hasPermission, userId, role: adminRole.role };
}

// Initialize first super admin (run this once)
export const initializeSuperAdmin = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // Check if any super admin exists
    const existingSuperAdmin = await ctx.db
      .query("adminRoles")
      .withIndex("by_role", (q) => q.eq("role", "super_admin"))
      .first();
    
    if (existingSuperAdmin) {
      throw new Error("Super admin already exists");
    }
    
    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
    
    if (!user) {
      throw new Error("User with this email not found");
    }
    
    // Create super admin role
    await ctx.db.insert("adminRoles", {
      userId: user._id,
      role: "super_admin",
      grantedBy: user._id, // Self-granted for first admin
      grantedAt: Date.now(),
    });
    
    return { success: true, message: "Super admin initialized successfully" };
  },
});

// Grant admin role (only super admins can do this)
export const grantAdminRole = mutation({
  args: {
    userEmail: v.string(),
    role: v.union(v.literal("super_admin"), v.literal("moderator")),
  },
  handler: async (ctx, args) => {
    const { isAdmin, userId, role } = await checkAdminRole(ctx, "super_admin");
    
    if (!isAdmin || role !== "super_admin") {
      throw new Error("Only super admins can grant admin roles");
    }
    
    // Find target user
    const targetUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.userEmail))
      .first();
    
    if (!targetUser) {
      throw new Error("User not found");
    }
    
    // Check if user already has admin role
    const existingRole = await ctx.db
      .query("adminRoles")
      .withIndex("by_user", (q) => q.eq("userId", targetUser._id))
      .first();
    
    if (existingRole) {
      // Update existing role
      await ctx.db.patch(existingRole._id, {
        role: args.role,
        grantedBy: userId!,
        grantedAt: Date.now(),
      });
    } else {
      // Create new role
      await ctx.db.insert("adminRoles", {
        userId: targetUser._id,
        role: args.role,
        grantedBy: userId!,
        grantedAt: Date.now(),
      });
    }
    
    return { success: true, message: `${args.role} role granted to ${args.userEmail}` };
  },
});

// Revoke admin role (only super admins can do this)
export const revokeAdminRole = mutation({
  args: { userEmail: v.string() },
  handler: async (ctx, args) => {
    const { isAdmin, role } = await checkAdminRole(ctx, "super_admin");
    
    if (!isAdmin || role !== "super_admin") {
      throw new Error("Only super admins can revoke admin roles");
    }
    
    // Find target user
    const targetUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.userEmail))
      .first();
    
    if (!targetUser) {
      throw new Error("User not found");
    }
    
    // Find and delete admin role
    const adminRole = await ctx.db
      .query("adminRoles")
      .withIndex("by_user", (q) => q.eq("userId", targetUser._id))
      .first();
    
    if (adminRole) {
      await ctx.db.delete(adminRole._id);
    }
    
    return { success: true, message: `Admin role revoked from ${args.userEmail}` };
  },
});

// Get current user's admin status
export const getMyAdminStatus = query({
  args: {},
  handler: async (ctx) => {
    const { isAdmin, role } = await checkAdminRole(ctx);
    return { isAdmin, role: role || null };
  },
});

// Get all admins (super admin only)
export const getAllAdmins = query({
  args: {},
  handler: async (ctx) => {
    const { isAdmin, role } = await checkAdminRole(ctx, "super_admin");
    
    if (!isAdmin || role !== "super_admin") {
      throw new Error("Only super admins can view all admins");
    }
    
    const adminRoles = await ctx.db.query("adminRoles").collect();
    
    return Promise.all(
      adminRoles.map(async (adminRole) => {
        const user = await ctx.db.get(adminRole.userId);
        const grantedByUser = await ctx.db.get(adminRole.grantedBy);
        
        return {
          ...adminRole,
          user: user ? { name: user.name, email: user.email } : null,
          grantedBy: grantedByUser ? { name: grantedByUser.name, email: grantedByUser.email } : null,
        };
      })
    );
  },
});

export const getPendingListings = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const { isAdmin } = await checkAdminRole(ctx);
    
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const result = await ctx.db
      .query("listings")
      .withIndex("by_status", (q: any) => q.eq("status", "pending"))
      .order("desc")
      .paginate(args.paginationOpts);

    const listingsWithDetails = await Promise.all(
      result.page.map(async (listing) => {
        const Lister = await ctx.db.get(listing.ListerId);
        const category = await ctx.db.get(listing.categoryId);
        const imageUrls = await Promise.all(
          listing.images.slice(0, 1).map(async (imageId) => {
            const url = await ctx.storage.getUrl(imageId);
            return url;
          })
        );

        return {
          ...listing,
          Lister: Lister && 'name' in Lister ? { name: Lister.name, email: Lister.email } : null,
          category: category && 'name' in category ? category.name : "Unknown",
          imageUrls: imageUrls.filter(Boolean),
        };
      })
    );

    return {
      ...result,
      page: listingsWithDetails,
    };
  },
});

export const approveListing = mutation({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const { isAdmin } = await checkAdminRole(ctx);
    
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    return await ctx.db.patch(args.id, { status: "approved" });
  },
});

export const rejectListing = mutation({
  args: { id: v.id("listings") },
  handler: async (ctx, args) => {
    const { isAdmin } = await checkAdminRole(ctx);
    
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    return await ctx.db.patch(args.id, { status: "rejected" });
  },
});

export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const { isAdmin } = await checkAdminRole(ctx);
    
    if (!isAdmin) {
      throw new Error("Admin access required");
    }

    const [totalListings, pendingListings, approvedListings, totalUsers, totalAdmins] = await Promise.all([
      ctx.db.query("listings").collect().then(l => l.length),
      ctx.db.query("listings").withIndex("by_status", q => q.eq("status", "pending")).collect().then(l => l.length),
      ctx.db.query("listings").withIndex("by_status", q => q.eq("status", "approved")).collect().then(l => l.length),
      ctx.db.query("users").collect().then(u => u.length),
      ctx.db.query("adminRoles").collect().then(a => a.length),
    ]);

    return {
      totalListings,
      pendingListings,
      approvedListings,
      totalUsers,
      totalAdmins,
    };
  },
});
