export interface TejHqDailyPrice {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    last: number;
    prev_close: number;
    volume: number;
    turnover: number;
    trades: number;
}

export interface StockProviderResponse {
    data: TejHqDailyPrice[];
    meta: {
        count: number;
        exchange: string;
        from: string;
        symbol: string;
        to: string;
    };
}
