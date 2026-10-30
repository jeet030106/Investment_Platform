
import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";

import { SOCKET_EVENTS } from "../events/socket-events.js";
import { getStockRoom, getMarketRoom } from "../utils/socket-room.js";

let io: Server | null = null;

export function initializeSocket(server: HttpServer): Server {

    if (io) {
        return io;
    }

    io = new Server(server);
    // The socket variable reperesent a particluar connection
    io.on("connection", (socket) => {

        console.log(`[Socket.IO] Connected: ${socket.id}`);

        // Subscribe to a particular stock.
        socket.on(SOCKET_EVENTS.STOCK_SUBSCRIBE, (symbol: unknown) => {

            if (typeof symbol !== "string" || !symbol.trim()) {
                socket.emit(SOCKET_EVENTS.SOCKET_ERROR, {
                    message: "Invalid stock symbol",
                });
                return;
            }

            const room = getStockRoom(symbol);

            socket.join(room);

            console.log(
                `[Socket.IO] ${socket.id} joined ${room}`
            );
        });

        // Unsubscribe from a particular stock.
        socket.on(SOCKET_EVENTS.STOCK_UNSUBSCRIBE, (symbol: unknown) => {

            if (typeof symbol !== "string" || !symbol.trim()) {
                socket.emit(SOCKET_EVENTS.SOCKET_ERROR, {
                    message: "Invalid stock symbol",
                });
                return;
            }

            const room = getStockRoom(symbol);

            socket.leave(room);

            console.log(
                `[Socket.IO] ${socket.id} left ${room}`
            );
        });

        socket.on("disconnect", (reason) => {
            console.log(
                `[Socket.IO] Disconnected: ${socket.id}`,
                reason
            );
        });

    });

    console.log("[Socket.IO] Initialized successfully");

    return io;
}

export function getIO(): Server {

    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
}
