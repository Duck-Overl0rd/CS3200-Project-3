import { createClient } from "redis";
import "dotenv/config";

const redis = createClient({ url: process.env.REDIS_URL });
await redis.connect();
console.log("Connected to Redis");

// ── CLEAR EXISTING DATA ─────────────────────────────────────
await redis.flushAll();
console.log("Cleared existing Redis data");

// ── SEED: Most Viewed Profiles (Sorted Set) ─────────────────
await redis.zAdd("profileViews", [
    { score: 42, value: "alice@email.com" },
    { score: 31, value: "bob@email.com" },
    { score: 27, value: "carol@email.com" },
    { score: 15, value: "david@email.com" },
    { score: 9, value: "emma@email.com" },
    { score: 6, value: "frank@email.com" },
    { score: 3, value: "grace@email.com" },
    { score: 1, value: "henry@email.com" },
]);
console.log("Seeded profileViews");

// ── SEED: Online Users (Set) ────────────────────────────────
// Alice, Carol, and Emma are currently online
await redis.sAdd("onlineUsers", [
    "alice@email.com",
    "carol@email.com",
    "emma@email.com",
]);
console.log("Seeded onlineUsers");

// ── SEED: Friend Request Inboxes (Lists) ────────────────────
// Alice has requests from Bob and David
await redis.rPush("friendRequests:alice@email.com", [
    "bob@email.com",
    "david@email.com",
]);

// Grace has a request from Henry
await redis.rPush("friendRequests:grace@email.com", [
    "henry@email.com",
]);

// Emma has requests from Frank and Grace
await redis.rPush("friendRequests:emma@email.com", [
    "frank@email.com",
    "grace@email.com",
]);
console.log("Seeded friendRequests");

// ── DONE ────────────────────────────────────────────────────
await redis.quit();
console.log("Done! Open Redis Insight to explore the data.");
