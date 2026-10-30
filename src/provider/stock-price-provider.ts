
import {
    StockProviderResponse,
    TejHqSnapshotResponse,
} from "../model/stock-model.js";

import {
    isValidStockProviderResponse,
    isValidTejHqSnapshotResponse,
    isValidDateOnly,
} from "../utils/validators.js";

class StockPricesProvider {
    private readonly baseUrl = "https://api.tejhq.dev";

    async getDailyPrices(
        symbol: string,
        from: string,
        to: string
    ): Promise<StockProviderResponse> {
        if (
            !symbol.trim() ||
            !isValidDateOnly(from) ||
            !isValidDateOnly(to) ||
            from > to
        ) {
            throw new Error("Invalid symbol or daily-price date range");
        }

        const url = new URL(
            `/v1/ohlcv/nse/${encodeURIComponent(symbol.trim().toUpperCase())}`,
            this.baseUrl
        );

        url.searchParams.set("from", from);
        url.searchParams.set("to", to);

        const response = await fetch(url, {
            signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
            throw new Error(
                `TejHQ daily-price request failed: HTTP ${response.status} ${response.statusText}`
            );
        }

        let result: unknown;

        try {
            result = await response.json();
        } catch {
            throw new Error("TejHQ returned invalid JSON for daily prices");
        }

        if (!isValidStockProviderResponse(result)) {
            throw new Error("Invalid daily-price response received from TejHQ");
        }

        if (
            result.meta.symbol.toUpperCase() !== symbol.trim().toUpperCase() ||
            result.meta.exchange.toUpperCase() !== "NSE" ||
            result.meta.from !== from ||
            result.meta.to !== to
        ) {
            throw new Error(
                "TejHQ daily-price response does not match the requested symbol, exchange, or date range"
            );
        }

        return result;
    }

    async getMarketSnapshot(
        exchange: "NSE" | "BSE",
        date: string
    ): Promise<TejHqSnapshotResponse> {
        if (!isValidDateOnly(date)) {
            throw new Error("Snapshot date must be a valid YYYY-MM-DD date");
        }

        const url = new URL(
            `/v1/snapshot/${exchange.toLowerCase()}`,
            this.baseUrl
        );

        url.searchParams.set("date", date);

        const response = await fetch(url, {
            signal: AbortSignal.timeout(30_000),
        });

        if (!response.ok) {
            throw new Error(
                `TejHQ snapshot request failed: HTTP ${response.status} ${response.statusText}`
            );
        }

        let result: unknown;

        try {
            result = await response.json();
        } catch {
            throw new Error("TejHQ returned invalid JSON for market snapshot");
        }

        if (!isValidTejHqSnapshotResponse(result)) {
            throw new Error("Invalid market snapshot response received from TejHQ");
        }

        return result;
    }
}

export default StockPricesProvider;
