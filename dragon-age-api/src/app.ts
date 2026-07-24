import cors from "cors";
import express from "express";

import { config } from "./config.js";
import { charactersRouter } from "./routes/characters.js";
import { healthRouter } from "./routes/health.js";

export function createApp() {
    const app = express();

    app.use(
        cors({
            origin:
                config.corsOrigins.length > 0
                    ? config.corsOrigins
                    : config.nodeEnv === "development"
                      ? true
                      : false,
        })
    );
    app.use(express.json({ limit: "2mb" }));

    app.get("/", (_req, res) => {
        res.json({
            name: "dragon-age-api",
            version: "0.1.0",
            endpoints: ["/health", "/characters/:id"],
        });
    });

    app.use("/health", healthRouter);
    app.use("/characters", charactersRouter);

    return app;
}
