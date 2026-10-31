
export interface StockPriceUpdateEvent {
    stockId: string;
    symbol: string;
    exchange: string;
    price: string;
    recordedAt: string;
}