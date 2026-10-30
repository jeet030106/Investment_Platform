
// Centralized event handlers as it may happen that
// I use "stock:subscride" at one place and "stocks:sub" at another
export const SOCKET_EVENTS = {
    // Client -> Server
    STOCK_SUBSCRIBE: "stock:subscribe",
    STOCK_UNSUBSCRIBE: "stock:unsubscribe",

    // Server -> Client
    STOCK_PRICE_UPDATED: "stock:price_updated",

    // Connection / Error
    SOCKET_ERROR: "socket:error",
} as const;
