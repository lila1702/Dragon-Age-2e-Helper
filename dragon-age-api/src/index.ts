import { createApp } from "./app.js";
import { config } from "./config.js";
import { closePool } from "./db/pool.js";

const app = createApp();

const server = app.listen(config.port, () => {
    console.log(`dragon-age-api listening on http://localhost:${config.port}`);
});

async function shutdown(signal: string) {
    console.log(`Received ${signal}, shutting down...`);
    server.close();
    await closePool();
    process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
