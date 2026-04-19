import express from "express";

export default (redis) => {
    const router = express.Router();

    // Key pattern: friendRequests:<receiverEmail>
    const key = (email) => `friendRequests:${email}`;

    // ── CREATE ──────────────────────────────────────────────────
    // POST /friendRequests/:receiverEmail
    // Sends a friend request to the receiver.
    // Body: { senderEmail }
    router.post("/:receiverEmail", async (req, res) => {
        try {
            const { senderEmail } = req.body;
            if (!senderEmail) {
                return res.status(400).json({ error: "senderEmail is required" });
            }
            await redis.rPush(key(req.params.receiverEmail), senderEmail);
            res.status(201).json({
                message: `Friend request sent from ${senderEmail} to ${req.params.receiverEmail}`
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── READ ────────────────────────────────────────────────────
    // GET /friendRequests/:receiverEmail
    // Returns all pending friend requests for the given user.
    router.get("/:receiverEmail", async (req, res) => {
        try {
            const requests = await redis.lRange(key(req.params.receiverEmail), 0, -1);
            res.json({ receiver: req.params.receiverEmail, pendingRequests: requests });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── DELETE ONE ──────────────────────────────────────────────
    // DELETE /friendRequests/:receiverEmail/:senderEmail
    // Removes a specific friend request (e.g. on accept or decline).
    router.delete("/:receiverEmail/:senderEmail", async (req, res) => {
        try {
            const removed = await redis.lRem(
                key(req.params.receiverEmail),
                1,
                req.params.senderEmail
            );
            if (removed === 0) {
                return res.status(404).json({ error: "Friend request not found" });
            }
            res.json({
                message: `Friend request from ${req.params.senderEmail} removed`
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── DELETE ALL ──────────────────────────────────────────────
    // DELETE /friendRequests/:receiverEmail
    // Clears all pending requests for a user (e.g. account deletion).
    router.delete("/:receiverEmail", async (req, res) => {
        try {
            await redis.del(key(req.params.receiverEmail));
            res.json({ message: `All friend requests for ${req.params.receiverEmail} cleared` });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
