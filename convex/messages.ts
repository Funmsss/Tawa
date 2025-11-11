import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const sendMessage = mutation({
  args: {
    listingId: v.id("listings"),
    receiverId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Must be logged in to send message");
    }

    return await ctx.db.insert("messages", {
      listingId: args.listingId,
      senderId: userId,
      receiverId: args.receiverId,
      content: args.content,
      read: false,
    });
  },
});

export const getConversation = query({
  args: {
    listingId: v.id("listings"),
    otherUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
      .filter((q) =>
        q.or(
          q.and(q.eq(q.field("senderId"), userId), q.eq(q.field("receiverId"), args.otherUserId)),
          q.and(q.eq(q.field("senderId"), args.otherUserId), q.eq(q.field("receiverId"), userId))
        )
      )
      .order("asc")
      .collect();

    return Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return {
          ...message,
          sender: sender ? { name: sender.name, email: sender.email } : null,
        };
      })
    );
  },
});

export const getUserConversations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const messages = await ctx.db
      .query("messages")
      .filter((q) =>
        q.or(q.eq(q.field("senderId"), userId), q.eq(q.field("receiverId"), userId))
      )
      .order("desc")
      .collect();

    // Group by listing and other user
    const conversationMap = new Map();
    
    for (const message of messages) {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      const key = `${message.listingId}-${otherUserId}`;
      
      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          listingId: message.listingId,
          otherUserId,
          lastMessage: message,
          unreadCount: 0,
        });
      }
      
      if (!message.read && message.receiverId === userId) {
        conversationMap.get(key).unreadCount++;
      }
    }

    const conversations = Array.from(conversationMap.values());

    return Promise.all(
      conversations.map(async (conv) => {
        const listing = await ctx.db.get(conv.listingId);
        const otherUser = await ctx.db.get(conv.otherUserId);
        
        return {
          ...conv,
          listing: listing && 'title' in listing ? { title: listing.title, _id: listing._id } : null,
          otherUser: otherUser && 'name' in otherUser && 'email' in otherUser ? { name: otherUser.name, email: otherUser.email } : null,
        };
      })
    );
  },
});
