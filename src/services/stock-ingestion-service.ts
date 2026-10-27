
import StockPriceProvider from "../provider/stock-price-provider.js";
import {
    StockRepository,
    StockPriceRepository,
} from "../repository/index.js";

import type {
    HistoricalPriceInput,
    StockSeed,
    StockIngestionResult,
    MarketSnapshotIngestionResult,
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

    async ingestMarketSnapshot(
        exchange: "NSE" | "BSE",
        date: string
    ): Promise<MarketSnapshotIngestionResult> {
        // 1. Fetch the full-market snapshot.
        const snapshot = await this.provider.getMarketSnapshot(
            exchange,
            date
        );

        // 2. Only import ordinary equity series with usable data.
        const eligibleRows = snapshot.data.filter((row) =>
            row.series === "EQ" &&
            typeof row.symbol === "string" &&
            /^[A-Z0-9][A-Z0-9&-]{0,29}$/i.test(row.symbol) &&
            typeof row.name === "string" &&
            row.name.trim().length > 0 &&
            Number.isFinite(row.close) &&
            row.close > 0
        );

        // Remove duplicate symbols within the provider response.
        const uniqueRows = [
            ...new Map(
                eligibleRows.map((row) => [
                    row.symbol.toUpperCase(),
                    row,
                ])
            ).values(),
        ];

        // 3. Upsert all stock metadata in bulk.
        const stockInputs: StockSeed[] = uniqueRows.map((row) => ({
            symbol: row.symbol.toUpperCase(),
            companyName: row.name.trim(),
            exchange,
        }));

        const savedStocks =
            await this.stockRepository.upsertMany(stockInputs);

        // 4. Map symbols to the DB-generated stock IDs.
        const stockIdBySymbol = new Map(
            savedStocks.map((stock) => [
                stock.symbol.toUpperCase(),
                stock.stock_id,
            ])
        );

        const recordedAt = new Date(`${date}T00:00:00.000Z`);

        if (
            Number.isNaN(recordedAt.getTime()) ||
            recordedAt.toISOString().slice(0, 10) !== date
        ) {
            throw new Error(`Invalid snapshot date: ${date}`);
        }

        const priceInputs: HistoricalPriceInput[] = uniqueRows.flatMap(
            (row) => {
                const stockId = stockIdBySymbol.get(
                    row.symbol.toUpperCase()
                );

                if (!stockId) {
                    return [];
                }

                return [{
                    stock_id: stockId,
                    price: row.close.toFixed(4),
                    recorded_at: recordedAt,
                    source: "tejhq",
                }];
            }
        );

        // 5. Insert in batches to keep SQL statements manageable.
        let pricesInserted = 0;
        const batchSize = 500;

        for (let i = 0; i < priceInputs.length; i += batchSize) {
            const batch = priceInputs.slice(i, i + batchSize);

            const inserted =
                await this.stockPriceRepository
                    .insertManyIgnoreDuplicates(batch);

            pricesInserted += inserted.length;
        }

        return {
            exchange,
            date,
            received: snapshot.data.length,
            eligible: uniqueRows.length,
            stocksProcessed: savedStocks.length,
            pricesInserted,
            pricesSkipped: priceInputs.length - pricesInserted,
        };
    }
}

export default StockIngestionService;
