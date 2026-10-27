
import StockPriceProvider from "../provider/stock-price-provider.js";
import {
    StockRepository,
    StockPriceRepository,
} from "../repository/index.js";
import type {
    HistoricalPriceInput,
    StockSeed,
    StockIngestionResult,
} from "../model/stock-model.js";

class StockIngestionService {
    private readonly provider = new StockPriceProvider();
    private readonly stockRepository = new StockRepository();
    private readonly stockPriceRepository = new StockPriceRepository();

    async ingestDailyPrices(
        stockInput: StockSeed,
        from: string,
        to: string
    ): Promise<StockIngestionResult> {
        const symbol = stockInput.symbol.trim().toUpperCase();
        const exchange = stockInput.exchange.trim().toUpperCase();

        if (exchange !== "NSE") {
            throw new Error("This TejHQ ingestion currently supports NSE only");
        }

        // 1. Fetch market data before modifying the database.
        const response = await this.provider.getDailyPrices(
            symbol,
            from,
            to
        );

        // Ensure the response corresponds to the requested stock.
        if (
            response.meta.symbol.toUpperCase() !== symbol ||
            response.meta.exchange.toUpperCase() !== exchange
        ) {
            throw new Error(
                `TejHQ returned unexpected stock data for ${symbol}`
            );
        }

        // 2. Upsert stock metadata.
        const stock = await this.stockRepository.upsert({
            symbol,
            company_name: stockInput.companyName,
            exchange,
        });

        // 3. Validate and normalize daily closing prices.
        const prices: HistoricalPriceInput[] = response.data.map((item) => {
            if (
                !Number.isFinite(item.close) ||
                item.close <= 0 ||
                !/^\d{4}-\d{2}-\d{2}$/.test(item.date)
            ) {
                throw new Error(
                    `Invalid price record received for ${symbol}`
                );
            }

            const recordedAt = new Date(
                `${item.date}T00:00:00.000Z`
            );

            if (
                Number.isNaN(recordedAt.getTime()) ||
                recordedAt.toISOString().slice(0, 10) !== item.date
            ) {
                throw new Error(
                    `Invalid trading date received for ${symbol}: ${item.date}`
                );
            }

            return {
                stock_id: stock.stock_id,
                price: item.close.toFixed(4),
                recorded_at: recordedAt,
                source: "tejhq",
            };
        });

        // 4. Save observations, skipping existing stock/date pairs.
        const insertedRows =
            await this.stockPriceRepository.insertManyIgnoreDuplicates(
                prices
            );

        return {
            symbol,
            exchange,
            fetched: prices.length,
            inserted: insertedRows.length,
            skipped: prices.length - insertedRows.length,
        };
    }
}

export default StockIngestionService;
