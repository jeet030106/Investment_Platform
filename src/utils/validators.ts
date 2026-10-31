import {StockProviderResponse, TejHqDailyPrice} from "../model/stock-model.js"
import type { TejHqSnapshotResponse } from "../model/stock-model.js";


const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const ISO_TIMESTAMP_REGEX =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidUuid(value: string): boolean {
    return UUID_REGEX.test(value);
}

export function isValidEmail(value: string): boolean {
    return EMAIL_REGEX.test(value);
}

export interface ParsedDateInput {
    date: Date;
    dateOnly: boolean;
}

export function parseDateInput(value: string): ParsedDateInput | null {
    // Accept YYYY-MM-DD.
    if (DATE_REGEX.test(value)) {
        const date = new Date(`${value}T00:00:00.000Z`);

        if (
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== value
        ) {
            return null;
        }

        return { date, dateOnly: true };
    }

    // Accept UTC timestamps such as 2026-10-25T02:49:24.768Z.
    if (ISO_TIMESTAMP_REGEX.test(value)) {
        const date = new Date(value);

        if (
            Number.isNaN(date.getTime()) ||
            date.toISOString() !== value
        ) {
            return null;
        }

        return { date, dateOnly: false };
    }

    return null;
}


// Validates a real calendar date in YYYY-MM-DD format.
export function isValidDateOnly(value: unknown): value is string {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
}



// Validates a finite numeric value.
export function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

// Validates one daily price record from TejHQ.
export function isValidTejHqDailyPrice(
    value: unknown
): value is TejHqDailyPrice {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }

    const row = value as Record<string, unknown>;

    if (
        !isValidDateOnly(row.date) ||
        !isFiniteNumber(row.open) ||
        !isFiniteNumber(row.high) ||
        !isFiniteNumber(row.low) ||
        !isFiniteNumber(row.close) ||
        !isFiniteNumber(row.last) ||
        !isFiniteNumber(row.prev_close) ||
        !isFiniteNumber(row.volume) ||
        !isFiniteNumber(row.turnover) ||
        !isFiniteNumber(row.trades)
    ) {
        return false;
    }

    const prices = [
        row.open,
        row.high,
        row.low,
        row.close,
        row.last,
        row.prev_close,
    ];

    if (prices.some((price) => price <= 0)) {
        return false;
    }

    if (
        row.low > row.high ||
        row.open < row.low ||
        row.open > row.high ||
        row.close < row.low ||
        row.close > row.high ||
        row.last < row.low ||
        row.last > row.high
    ) {
        return false;
    }

    return (
        Number.isSafeInteger(row.volume) &&
        row.volume >= 0 &&
        row.turnover >= 0 &&
        Number.isSafeInteger(row.trades) &&
        row.trades >= 0
    );
}

// Validates the complete daily-price response from TejHQ.
export function isValidStockProviderResponse(
    value: unknown
): value is StockProviderResponse {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }

    const response = value as Record<string, unknown>;

    if (
        !Array.isArray(response.data) ||
        typeof response.meta !== "object" ||
        response.meta === null ||
        Array.isArray(response.meta)
    ) {
        return false;
    }

    const meta = response.meta as Record<string, unknown>;

    if (
        !isFiniteNumber(meta.count) ||
        !Number.isSafeInteger(meta.count) ||
        meta.count < 0 ||
        typeof meta.exchange !== "string" ||
        typeof meta.symbol !== "string" ||
        !isValidDateOnly(meta.from) ||
        !isValidDateOnly(meta.to) ||
        meta.from > meta.to ||
        meta.count !== response.data.length
    ) {
        return false;
    }

    return response.data.every(isValidTejHqDailyPrice);
}

// Validates stock symbol format used by ingestion.
export function isValidStockSymbol(value: unknown): value is string {
    return (
        typeof value === "string" &&
        /^[A-Z0-9][A-Z0-9&-]{0,29}$/i.test(value.trim())
    );
}

// Validates a complete daily-price ingestion request.
export function isValidDailyPriceRequest(
    symbol: unknown,
    companyName: unknown,
    exchange: unknown,
    from: unknown,
    to: unknown
): boolean {
    return (
        isValidStockSymbol(symbol) &&
        typeof companyName === "string" &&
        companyName.trim().length > 0 &&
        typeof exchange === "string" &&
        exchange.trim().toUpperCase() === "NSE" &&
        isValidDateOnly(from) &&
        isValidDateOnly(to) &&
        (from as string) <= (to as string)
    );
}

export function isValidTejHqSnapshotResponse(
    value: unknown
): value is TejHqSnapshotResponse {
    if (
        typeof value !== "object" ||
        value === null ||
        Array.isArray(value)
    ) {
        return false;
    }

    const response = value as Record<string, unknown>;

    if (
        !Array.isArray(response.data) ||
        typeof response.meta !== "object" ||
        response.meta === null ||
        Array.isArray(response.meta)
    ) {
        return false;
    }

    return response.data.every((item: unknown) => {
        if (
            typeof item !== "object" ||
            item === null ||
            Array.isArray(item)
        ) {
            return false;
        }

        const row = item as Record<string, unknown>;

        return (
            // Basic field validation
            typeof row.symbol === "string" &&
            typeof row.series === "string" &&
            typeof row.isin === "string" &&
            typeof row.name === "string" &&

            // All prices must be finite and positive
            isFiniteNumber(row.open) &&
            isFiniteNumber(row.high) &&
            isFiniteNumber(row.low) &&
            isFiniteNumber(row.close) &&
            isFiniteNumber(row.last) &&
            isFiniteNumber(row.prev_close) &&
            row.open > 0 &&
            row.high > 0 &&
            row.low > 0 &&
            row.close > 0 &&
            row.last > 0 &&
            row.prev_close > 0 &&

            // OHLC values must be within the daily range
            row.low <= row.high &&
            row.open >= row.low &&
            row.open <= row.high &&
            row.close >= row.low &&
            row.close <= row.high &&
            row.last >= row.low &&
            row.last <= row.high
        );
    });
}