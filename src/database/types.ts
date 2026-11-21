import { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Users {
    user_id: Generated<string>;
    user_name: string;
    email: string;
    password: string;
    created_at: Generated<Timestamp>;
    updated_at: Generated<Timestamp>;
};

export interface Stocks {
    stock_id: Generated<string>;
    symbol: string;
    company_name: string;
    exchange: string;
    is_active: Generated<boolean>;
    created_at: Generated<Timestamp>;
    updated_at: Generated<Timestamp>;
}

export interface StockPrices {
    price_id: Generated<string>;
    stock_id: string;
    price: ColumnType<string, number | string, number | string>;
    recorded_at: Generated<Timestamp>;
    source: string;
    created_at: Generated<Timestamp>;
}

// -- Step 3 -- 
// Create an interface that will be representing the structure of the DB
export interface Database {
    "users": Users,
    "stocks": Stocks,
    "stock_prices": StockPrices
}