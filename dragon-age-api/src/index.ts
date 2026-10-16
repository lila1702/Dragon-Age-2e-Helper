import { createServer } from "node:http";

import { createApp } from "./app.js";
import { config } from "./config.js";
import { closeMongo, connectMongo } from "./db/mongo.js";
import { attachRealtime } from "./realtime/socket.js";

const app = createApp();
const httpServer = createServer(app);

attachRealtime(httpServer);

await connectMongo();

httpServer.listen(config.port, () => {
    console.log(`dragon-age-api listening on http://localhost:${config.port}`);
    console.log("WebSocket (Socket.IO) enabled on the same port.");
});

async function shutdown(signal: string) {
    console.log(`Received ${signal}, shutting down...`);
    httpServer.close();
    await closeMongo();
    process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
