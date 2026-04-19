import express from "express";
import { createClient } from "redis";
import "dotenv/config";

import profileViewsRouter from "./routes/profileViews.js";
import onlineUsersRouter from "./routes/onlineUsers.js";
import friendRequestsRouter from "./routes/friendRequests.js";

const app = express();
app.use(express.json());

// Connect to Redis
const redis = createClient({ url: process.env.REDIS_URL });

redis.on("error", (err) => console.error("Redis error:", err));

await redis.connect();
console.log("Connected to Redis");

// Pass redis client into routers
app.use("/profileViews", profileViewsRouter(redis));
app.use("/onlineUsers", onlineUsersRouter(redis));
app.use("/friendRequests", friendRequestsRouter(redis));

// Root route
app.get("/", (req, res) => {
    res.json({ message: "ClassFriends Redis API is running" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
