
// Naming Conventions for room name
// Using the stock id to decide the room
export function getStockRoom(stockId: string): string {
    return `stock:${stockId}`;
}

// Gives the room for exchange (NSE/BSE)
export function getMarketRoom(exchange: string): string {
    return `market:${exchange.trim().toUpperCase()}`;
}
