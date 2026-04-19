import express from "express";

export default (redis) => {
    const router = express.Router();
    const KEY = "profileViews";

    // ── CREATE / UPDATE ─────────────────────────────────────────
    // POST /profileViews/:email
    // Records one profile view for the given email.
    // Uses ZINCRBY so it creates the entry if it doesn't exist yet,
    // or increments the score by 1 if it does.
    router.post("/:email", async (req, res) => {
        try {
            const { email } = req.params;
            const newScore = await redis.zIncrBy(KEY, 1, email);
            res.status(201).json({ email, views: newScore });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── READ ALL ────────────────────────────────────────────────
    // GET /profileViews
    // Returns all users ranked by view count, highest first.
    router.get("/", async (req, res) => {
        try {
            const results = await redis.zRangeWithScores(KEY, 0, -1, { REV: true });
            res.json(results.map(({ value, score }) => ({ email: value, views: score })));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── READ ONE ────────────────────────────────────────────────
    // GET /profileViews/:email
    // Returns the view count for a specific user.
    router.get("/:email", async (req, res) => {
        try {
            const score = await redis.zScore(KEY, req.params.email);
            if (score === null) {
                return res.status(404).json({ error: "User not found in leaderboard" });
            }
            res.json({ email: req.params.email, views: score });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── DELETE ONE ──────────────────────────────────────────────
    // DELETE /profileViews/:email
    // Removes a specific user from the leaderboard.
    router.delete("/:email", async (req, res) => {
        try {
            const removed = await redis.zRem(KEY, req.params.email);
            if (removed === 0) {
                return res.status(404).json({ error: "User not found in leaderboard" });
            }
            res.json({ message: `${req.params.email} removed from leaderboard` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── DELETE ALL ──────────────────────────────────────────────
    // DELETE /profileViews
    // Clears the entire leaderboard.
    router.delete("/", async (req, res) => {
        try {
            await redis.del(KEY);
            res.json({ message: "Leaderboard cleared" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
