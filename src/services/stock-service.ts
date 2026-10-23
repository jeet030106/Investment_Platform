
import {
    StockRepository,
    StockPriceRepository,
    type ListStocksOptions,
} from "../repository/index.js";

const DEFAULT_STALE_AFTER_MS = 60_000;

class StockService {
    private readonly stockRepository = new StockRepository();
    private readonly stockPriceRepository = new StockPriceRepository();

    private getPriceStatus(
        recordedAt: Date | string | undefined
    ): "available" | "stale" | "unavailable" {
        if (!recordedAt) {
            return "unavailable";
        }

        const timestamp = new Date(recordedAt).getTime();

        if (!Number.isFinite(timestamp)) {
            return "unavailable";
        }

        return Date.now() - timestamp > DEFAULT_STALE_AFTER_MS
            ? "stale"
            : "available";
    }

    // Get the List of active stocks along with their latest price and price status
    async listStocks(options: ListStocksOptions = {}) {
        const stocks = await this.stockRepository.listActive(options);

        if (stocks.length === 0) {
            return [];
        }

        const latestPrices =
            await this.stockPriceRepository.getLatestForStockIds(
                stocks.map((stock) => stock.stock_id)
            );

        const pricesByStockId = new Map(
            latestPrices.map((price) => [
                price.stock_id,
                price,
            ])
        );

        return stocks.map((stock) => {
            const latestPrice = pricesByStockId.get(stock.stock_id);

            return {
                ...stock,
                latestPrice: latestPrice?.price ?? null,
                priceRecordedAt: latestPrice?.recorded_at ?? null,
                priceStatus: this.getPriceStatus(
                    latestPrice?.recorded_at
                ),
            };
        });
    }

    //Get details of a stock along with its latest price and price status
    async getStockDetails(stockId: string) {
        const stock = await this.stockRepository.getById(stockId);

        if (!stock || !stock.is_active) {
            throw Object.assign(new Error("Stock not found"), {
                statusCode: 404,
            });
        }

        const latestPrice =
            await this.stockPriceRepository.getLatestByStockId(
                stock.stock_id
            );

        return {
            ...stock,
            latestPrice: latestPrice?.price ?? null,
            priceRecordedAt: latestPrice?.recorded_at ?? null,
            priceStatus: this.getPriceStatus(
                latestPrice?.recorded_at
            ),
        };
    }

    async searchStocks(
        search: string,
        options: Omit<ListStocksOptions, "search"> = {}
    ) {
        const normalizedSearch = search.trim();

        if (!normalizedSearch) {
            return [];
        }

        return this.listStocks({
            ...options,
            search: normalizedSearch,
        });
    }
}

export default StockService;
