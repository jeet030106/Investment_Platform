
import {
    StockProviderResponse,
    TejHqSnapshotResponse,
} from "../model/stock-model.js";

class StockPricesProvider {
    private readonly baseUrl = "https://api.tejhq.dev";

    async getDailyPrices(
        symbol: string,
        from: string,
        to: string
    ): Promise<StockProviderResponse> {
        const url = new URL(
            `/v1/ohlcv/nse/${encodeURIComponent(symbol)}`,
            this.baseUrl
        );

        url.searchParams.set("from", from);
        url.searchParams.set("to", to);

        const response = await fetch(url, {
            signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
            throw new Error(
                `TejHQ API error: ${response.status} ${response.statusText}`
            );
        }

        const result: unknown = await response.json();

        if (
            typeof result !== "object" ||
            result === null ||
            !("data" in result) ||
            !Array.isArray(result.data) ||
            !("meta" in result)
        ) {
            throw new Error("Invalid response received from TejHQ");
        }

        return result as StockProviderResponse;
    }

    async getMarketSnapshot(
        exchange: "NSE" | "BSE",
        date: string
    ): Promise<TejHqSnapshotResponse> {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error("Date must use YYYY-MM-DD format");
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
                `TejHQ snapshot failed: ${response.status} ${response.statusText}`
            );
        }

        const result: unknown = await response.json();

        if (
            typeof result !== "object" ||
            result === null ||
            !("data" in result) ||
            !Array.isArray(result.data) ||
            !("meta" in result)
        ) {
            throw new Error("Invalid snapshot response from TejHQ");
        }

        return result as TejHqSnapshotResponse;
    }
}

export default StockPricesProvider;
