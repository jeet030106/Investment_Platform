
// Naming Conventions for room name
// Gives a room name for a stock ("Reliance, TCS")
export function getStockRoom(symbol: string): string {
    return `stock:${symbol.trim().toUpperCase()}`;
}

// Gives the room for exchange (NSE/BSE)
export function getMarketRoom(exchange: string): string {
    return `market:${exchange.trim().toUpperCase()}`;
}
