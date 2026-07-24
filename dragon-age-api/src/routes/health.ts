import { Router } from "express";

import { getPool } from "../db/pool.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
    try {
        const pool = getPool();
        await pool.query("SELECT 1");
        res.json({ status: "ok", database: "connected" });
    } catch (error) {
        console.error("Health check failed:", error);
        res.status(503).json({ status: "error", database: "disconnected" });
    }
});
