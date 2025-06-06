import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


export const byUserId = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.query("goals").filter(q => q.eq(q.field("userId"), args.userId)).collect();
    },
});

export const getGoal = query({
    args: {
        id: v.id("goals"),
    },
    handler: async (ctx, args) => {
        return await ctx.db.query("goals").filter(q => q.eq(q.field("_id"), args.id)).first();
    },
});

export const create = mutation({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("goals", {
            backgroundColor: "#000000",
            indicatorColor: "#000000",
            textColor: "#000000",
            userId: args.userId,
        });
    },
});

export const update = mutation({
    args: {
        id: v.id("goals"),
        backgroundColor: v.string(),
        indicatorColor: v.string(),
        textColor: v.string(),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            backgroundColor: args.backgroundColor,
            indicatorColor: args.indicatorColor,
            textColor: args.textColor,
            userId: args.userId,
        });
    },
});

export const remove = mutation({
    args: {
        id: v.id("goals"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
