
import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";

let io: Server | null = null;

/**
 * Initializes the Socket.IO server.
 */
// server is an HttpServer with which the ws will build the connection
export function initializeSocket(server: HttpServer): Server {

    if (io) {
        return io;
    }

    io = new Server(server);

    // Triggered whenever a client establishes a connection.
    io.on("connection", (socket) => {

        console.log(`[Socket.IO] Client connected: ${socket.id}`);

        // Triggered whenever a client disconnects.
        socket.on("disconnect", (reason) => {
            console.log(
                `[Socket.IO] Client disconnected: ${socket.id}`,
                reason
            );
        });

    });

    console.log("[Socket.IO] Server initialized successfully");

    return io;
}

/**
 * Returns the initialized Socket.IO instance.
 */
// Rather than creating a new server for different application we use the initialised server
export function getIO(): Server {

    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
}
