import { createServer } from "node:http";
import app from "./app.js";
import { initializeSocket } from "./config/socket.js";

const PORT = process.env.PORT || 3001;

// Create the HTTP server using Express.
const server = createServer(app);

// Attach Socket.IO to the same HTTP server.
initializeSocket(server);

// Start the HTTP server.
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});