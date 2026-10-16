import { Router } from "express";

import { getDb } from "../db/mongo.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
    try {
        await getDb().command({ ping: 1 });
        res.json({ status: "ok", database: "mongodb" });
    } catch (error) {
        console.error("Health check failed:", error);
        res.status(503).json({ status: "error", database: "disconnected" });
    }
});
