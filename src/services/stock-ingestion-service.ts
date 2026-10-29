
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

        // 2. Fetch and validate provider data.
        const response = await this.provider.getDailyPrices(
            symbol,
            from,
            to
        );

        // Checking whether the desired response is received or not
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

        // 3. Validate the complete batch before modifying the database.
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

        // 4. Upsert stock metadata only after validation succeeds.
        const stock = await this.stockRepository.upsert({
            symbol,
            company_name: stockInput.companyName.trim(),
            exchange,
        });

        // 5. Convert validated data to database input.
        const prices: HistoricalPriceInput[] = validatedRows.map((item) => ({
            stock_id: stock.stock_id,
            price: item.close.toFixed(4),
            recorded_at: new Date(`${item.date}T00:00:00.000Z`),
            source: "tejhq",
        }));

        // 6. Insert prices, skipping existing stock/date combinations.
        const insertedRows =
            await this.stockPriceRepository.insertManyIgnoreDuplicates(prices);

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
            throw new Error("Snapshot date must be a valid YYYY-MM-DD date");
        }

        // 2. Fetch the market snapshot.
        const snapshot = await this.provider.getMarketSnapshot(exchange, date);

        // 3. Filter ordinary equity rows with valid symbols and usable prices.
        const eligibleRows = snapshot.data.filter((row) =>
            row.series === "EQ" &&
            isValidStockSymbol(row.symbol) &&
            typeof row.name === "string" &&
            row.name.trim().length > 0 &&
            Number.isFinite(row.close) &&
            row.close > 0
        );

        // 4. Deduplicate symbols within the response.
        const uniqueRows = [
            ...new Map(
                eligibleRows.map((row) => [row.symbol.trim().toUpperCase(), row])
            ).values(),
        ];

        // Validate all remaining price rows before writing.
        for (const row of uniqueRows) {
            if (
                !Number.isFinite(row.open) ||
                !Number.isFinite(row.high) ||
                !Number.isFinite(row.low) ||
                !Number.isFinite(row.last) ||
                !Number.isFinite(row.prev_close) ||
                row.open <= 0 ||
                row.high <= 0 ||
                row.low <= 0 ||
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

        // 5. Prepare stock metadata.
        const stockInputs: StockSeed[] = uniqueRows.map((row) => ({
            symbol: row.symbol.trim().toUpperCase(),
            companyName: row.name.trim(),
            exchange,
        }));

        // 6. Upsert stocks in bulk.
        const savedStocks = await this.stockRepository.upsertMany(stockInputs);

        const stockIdBySymbol = new Map(
            savedStocks.map((stock) => [
                stock.symbol.toUpperCase(),
                stock.stock_id,
            ])
        );

        const recordedAt = new Date(`${date}T00:00:00.000Z`);

        // 7. Convert snapshot prices to database input.
        const priceInputs: HistoricalPriceInput[] = uniqueRows.flatMap((row) => {
            const stockId = stockIdBySymbol.get(row.symbol.toUpperCase());

            if (!stockId) {
                return [];
            }

            return [{
                stock_id: stockId,
                price: row.close.toFixed(4),
                recorded_at: recordedAt,
                source: "tejhq",
            }];
        });

        // 8. Insert in batches to keep SQL statements manageable.
        let pricesInserted = 0;
        const batchSize = 500;

        for (let i = 0; i < priceInputs.length; i += batchSize) {
            const batch = priceInputs.slice(i, i + batchSize);

            const inserted =
                await this.stockPriceRepository.insertManyIgnoreDuplicates(batch);

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
