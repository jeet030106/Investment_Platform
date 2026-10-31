import { getIO } from "../config/socket.js";
import { SOCKET_EVENTS } from "../events/socket-events.js";
import type { StockPriceUpdateEvent } from "./stock-event-types.js";
import { getStockRoom } from "../utils/socket-room.js";

export class StockEventPublisher {

    // Pass the details of the stock price update event to the clients via event parameter
    publishPriceUpdate(event: StockPriceUpdateEvent): void {
        // Get the Socket.IO instance
        const io = getIO();

        // Create the room accordance to the changes
        const room = getStockRoom(event.stockId);
        const clientsInRoom =
            io.sockets.adapter.rooms.get(room)?.size ?? 0;

        console.log("Publishing stock update:");
        console.log("Room:", room);
        console.log("Clients in room:", clientsInRoom);
        console.log("Event:", event);
        // Emit the event to the clients in the room
        io.to(room).emit(
            SOCKET_EVENTS.STOCK_PRICE_UPDATED,
            event
        );
    }

    // This works the same but for multiple events at once
    publishPriceUpdates(events: StockPriceUpdateEvent[]): void {
        for (const event of events) {
            this.publishPriceUpdate(event);
        }
    }
}

export const stockEventPublisher = new StockEventPublisher();