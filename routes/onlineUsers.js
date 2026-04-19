import express from "express";

export default (redis) => {
    const router = express.Router();
    const KEY = "onlineUsers";

    // ── CREATE ──────────────────────────────────────────────────
    // POST /onlineUsers/:email
    // Marks a user as online (e.g. on login).
    router.post("/:email", async (req, res) => {
        try {
            await redis.sAdd(KEY, req.params.email);
            res.status(201).json({ message: `${req.params.email} is now online` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── READ ALL ────────────────────────────────────────────────
    // GET /onlineUsers
    // Returns all currently online users.
    router.get("/", async (req, res) => {
        try {
            const members = await redis.sMembers(KEY);
            res.json({ onlineUsers: members });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── READ ONE ────────────────────────────────────────────────
    // GET /onlineUsers/:email
    // Checks whether a specific user is currently online.
    router.get("/:email", async (req, res) => {
        try {
            const isOnline = await redis.sIsMember(KEY, req.params.email);
            res.json({ email: req.params.email, online: isOnline });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── DELETE ONE ──────────────────────────────────────────────
    // DELETE /onlineUsers/:email
    // Marks a user as offline (e.g. on logout).
    router.delete("/:email", async (req, res) => {
        try {
            const removed = await redis.sRem(KEY, req.params.email);
            if (removed === 0) {
                return res.status(404).json({ error: "User not currently online" });
            }
            res.json({ message: `${req.params.email} is now offline` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── DELETE ALL ──────────────────────────────────────────────
    // DELETE /onlineUsers
    // Clears all online users (e.g. on server restart).
    router.delete("/", async (req, res) => {
        try {
            await redis.del(KEY);
            res.json({ message: "Online users list cleared" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
