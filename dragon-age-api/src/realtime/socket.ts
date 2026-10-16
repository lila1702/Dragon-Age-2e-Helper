import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import { corsOriginPolicy } from "../config.js";
import { characterRoom, roomChannel, setRealtimeServer } from "./broadcast.js";

export function attachRealtime(httpServer: HttpServer): Server {
    const io = new Server(httpServer, {
        cors: {
            origin: corsOriginPolicy(),
            methods: ["GET", "POST"],
        },
    });

    setRealtimeServer(io);

    io.on("connection", (socket) => {
        socket.on("subscribe:character", (payload: { characterId?: string }) => {
            const characterId = payload?.characterId?.trim();
            if (!characterId) return;
            void socket.join(characterRoom(characterId));
        });

        socket.on("unsubscribe:character", (payload: { characterId?: string }) => {
            const characterId = payload?.characterId?.trim();
            if (!characterId) return;
            void socket.leave(characterRoom(characterId));
        });

        socket.on("subscribe:room", (payload: { roomId?: string }) => {
            const roomId = payload?.roomId?.trim();
            if (!roomId) return;
            void socket.join(roomChannel(roomId));
        });

        socket.on("unsubscribe:room", (payload: { roomId?: string }) => {
            const roomId = payload?.roomId?.trim();
            if (!roomId) return;
            void socket.leave(roomChannel(roomId));
        });
    });

    return io;
}
