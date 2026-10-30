
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

import {
    isValidDailyPriceRequest,
    isValidDateOnly,
    isValidStockSymbol,
    isValidTejHqDailyPrice,
} from "../utils/validators.js";

class StockIngestionService {
    private readonly provider = new StockPriceProvider();
    private readonly stockRepository = new StockRepository();
    private readonly stockPriceRepository = new StockPriceRepository();

    /**
     * Converts a trading date into a UTC timestamp for the given Indian
     * market-session time.
     *
     * 09:15 IST = 03:45 UTC
     * 15:30 IST = 10:00 UTC
     */
    private getMarketTimestamp(
        date: string,
        session: "open" | "close"
    ): Date {
        const [year, month, day] = date.split("-").map(Number);

        const timestamp =
            session === "open"
                ? Date.UTC(year, month - 1, day, 3, 45, 0, 0)
                : Date.UTC(year, month - 1, day, 10, 0, 0, 0);

        return new Date(timestamp);
    }

    /**
     * Creates two historical observations for one daily provider record:
     * opening price at 09:15 IST and closing price at 15:30 IST.
     */
    private createDailyPriceInputs(
        stockId: string,
        date: string,
        open: number,
        close: number
    ): HistoricalPriceInput[] {
        return [
            {
                stock_id: stockId,
                price: open.toFixed(4),
                recorded_at: this.getMarketTimestamp(date, "open"),
                source: "tejhq",
            },
            {
                stock_id: stockId,
                price: close.toFixed(4),
                recorded_at: this.getMarketTimestamp(date, "close"),
                source: "tejhq",
            },
        ];
    }

    async ingestDailyPrices(
        stockInput: StockSeed,
        from: string,
        to: string
    ): Promise<StockIngestionResult> {
        const symbol = stockInput.symbol.trim().toUpperCase();
        const exchange = stockInput.exchange.trim().toUpperCase();

        // 1. Validate the request before calling the provider.
        if (
            !isValidDailyPriceRequest(
                symbol,
                stockInput.companyName,
                exchange,
                from,
                to
            )
        ) {
            throw new Error("Invalid stock ingestion request");
        }

        // 2. Fetch daily market data.
        const response = await this.provider.getDailyPrices(
            symbol,
            from,
            to
        );

        // 3. Verify that the response matches the requested stock and dates.
        if (
            response.meta.symbol.trim().toUpperCase() !== symbol ||
            response.meta.exchange.trim().toUpperCase() !== exchange ||
            response.meta.from !== from ||
            response.meta.to !== to
        ) {
            throw new Error(
                `TejHQ returned unexpected data for ${symbol} or the requested date range`
            );
        }

        // 4. Validate the entire batch before modifying the database.
        const seenDates = new Set<string>();

        const validatedRows = response.data.map((item) => {
            if (!isValidTejHqDailyPrice(item)) {
                throw new Error(
                    `Invalid price record received for ${symbol}`
                );
            }

            if (item.date < from || item.date > to) {
                throw new Error(
                    `Price date ${item.date} is outside the requested range`
                );
            }

            if (seenDates.has(item.date)) {
                throw new Error(
                    `Duplicate price date ${item.date} received for ${symbol}`
                );
            }

            seenDates.add(item.date);

            return item;
        });

        // 5. Upsert stock metadata after validation succeeds.
        const stock = await this.stockRepository.upsert({
            symbol,
            company_name: stockInput.companyName.trim(),
            exchange,
        });

        // 6. Create opening and closing observations for each trading date.
        const prices: HistoricalPriceInput[] = validatedRows.flatMap(
            (item) =>
                this.createDailyPriceInputs(
                    stock.stock_id,
                    item.date,
                    item.open,
                    item.close
                )
        );

        // 7. Insert observations, skipping existing stock/timestamp pairs.
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
        // 1. Validate the requested snapshot date.
        if (!isValidDateOnly(date)) {
            throw new Error(
                "Snapshot date must be a valid YYYY-MM-DD date"
            );
        }

        // 2. Fetch the full-market snapshot.
        const snapshot = await this.provider.getMarketSnapshot(
            exchange,
            date
        );

        // 3. Keep ordinary equity rows with valid symbols and closing prices.
        const eligibleRows = snapshot.data.filter(
            (row) =>
                row.series === "EQ" &&
                isValidStockSymbol(row.symbol) &&
                typeof row.name === "string" &&
                row.name.trim().length > 0 &&
                Number.isFinite(row.close) &&
                row.close > 0
        );

        // 4. Deduplicate symbols within the provider response.
        const uniqueRows = [
            ...new Map(
                eligibleRows.map((row) => [
                    row.symbol.trim().toUpperCase(),
                    row,
                ])
            ).values(),
        ];

        // 5. Validate all retained market-data rows before database writes.
        for (const row of uniqueRows) {
            if (
                !Number.isFinite(row.open) ||
                !Number.isFinite(row.high) ||
                !Number.isFinite(row.low) ||
                !Number.isFinite(row.close) ||
                !Number.isFinite(row.last) ||
                !Number.isFinite(row.prev_close) ||
                row.open <= 0 ||
                row.high <= 0 ||
                row.low <= 0 ||
                row.close <= 0 ||
                row.last <= 0 ||
                row.prev_close <= 0 ||
                row.low > row.high ||
                row.open < row.low ||
                row.open > row.high ||
                row.close < row.low ||
                row.close > row.high ||
                row.last < row.low ||
                row.last > row.high ||
                !Number.isSafeInteger(row.volume) ||
                row.volume < 0 ||
                !Number.isFinite(row.turnover) ||
                row.turnover < 0 ||
                !Number.isSafeInteger(row.trades) ||
                row.trades < 0
            ) {
                throw new Error(
                    `Invalid market snapshot price data for ${row.symbol}`
                );
            }
        }

        // 6. Prepare stock metadata.
        const stockInputs: StockSeed[] = uniqueRows.map((row) => ({
            symbol: row.symbol.trim().toUpperCase(),
            companyName: row.name.trim(),
            exchange,
        }));

        // 7. Upsert stock metadata in bulk.
        const savedStocks =
            await this.stockRepository.upsertMany(stockInputs);

        // Map each symbol to its database-generated stock ID.
        const stockIdBySymbol = new Map(
            savedStocks.map((stock) => [
                stock.symbol.toUpperCase(),
                stock.stock_id,
            ])
        );

        // 8. Create opening and closing observations for each eligible stock.
        const priceInputs: HistoricalPriceInput[] = uniqueRows.flatMap(
            (row) => {
                const stockId = stockIdBySymbol.get(
                    row.symbol.trim().toUpperCase()
                );

                if (!stockId) {
                    return [];
                }

                return this.createDailyPriceInputs(
                    stockId,
                    date,
                    row.open,
                    row.close
                );
            }
        );

        // 9. Insert observations in batches of 500.
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
