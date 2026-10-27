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


export interface StockSeed {
    symbol: string;
    companyName: string;
    exchange: string;
}

export interface HistoricalPriceInput {
    stock_id: string;
    price: string;
    recorded_at: Date;
    source: string;
}

export interface StockIngestionResult {
    symbol: string;
    exchange: string;
    fetched: number;
    inserted: number;
    skipped: number;
}
