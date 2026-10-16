import cors from "cors";
import express from "express";

import { config, corsOriginPolicy } from "./config.js";
import { charactersRouter } from "./routes/characters.js";
import { healthRouter } from "./routes/health.js";
import { referenceRouter } from "./routes/reference.js";
import { roomsRouter } from "./routes/rooms.js";

export function createApp() {
    const app = express();

    app.use(
        cors({
            origin: corsOriginPolicy(),
        })
    );
    app.use(express.json({ limit: "2mb" }));

    app.get("/", (_req, res) => {
        res.json({
            name: "dragon-age-api",
            version: "0.3.0",
            database: "mongodb",
            realtime: "socket.io",
            endpoints: [
                "/health",
                "/characters/:id",
                "/rooms/:roomId/bindings",
                "/rooms/:roomId/tokens/:tokenId/binding",
                "/reference",
                "/reference/items",
                "/reference/spells",
                "/reference/items/calculate",
            ],
            socketEvents: [
                "subscribe:character",
                "unsubscribe:character",
                "character:updated",
                "subscribe:room",
                "room:binding",
            ],
        });
    });

    app.use("/health", healthRouter);
    app.use("/characters", charactersRouter);
    app.use("/rooms", roomsRouter);
    app.use("/reference", referenceRouter);

    return app;
}
