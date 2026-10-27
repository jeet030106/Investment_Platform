
import db from "../database/database.js";
import type { HistoricalPriceInput } from "../model/stock-model.js";

export interface CreateStockPriceInput {
    stock_id: string;
    price: number | string;
    recorded_at?: Date | string;
    source: string;
};

class StockPriceRepository {
    async create(input: CreateStockPriceInput) {
        return db
            .insertInto("stock_prices")
            .values({
                stock_id: input.stock_id,
                price: input.price,
                recorded_at: input.recorded_at,
                source: input.source,
            })
            .returningAll()
            .executeTakeFirstOrThrow();
    }

    async getLatestByStockId(stockId: string) {
        return db
            .selectFrom("stock_prices")
            .selectAll()
            .where("stock_id", "=", stockId)
            .orderBy("recorded_at", "desc")
            .orderBy("price_id", "desc")
            .limit(1)
            .executeTakeFirst();
    }

    async getLatestForStockIds(stockIds: string[]) {
        if (stockIds.length === 0) {
            return [];
        }

        return db
            .selectFrom("stock_prices")
            .selectAll()
            .distinctOn("stock_id")
            .where("stock_id", "in", stockIds)
            .orderBy("stock_id")
            .orderBy("recorded_at", "desc")
            .orderBy("price_id", "desc")
            .execute();
    }

    async getHistory(
        stockId: string,
        from: Date,
        to: Date,
        limit = 500
    ) {
        const safeLimit = Math.min(
            Math.max(limit, 1),
            5000
        );

        return db
            .selectFrom("stock_prices")
            .selectAll()
            .where("stock_id", "=", stockId)
            .where("recorded_at", ">=", from)
            .where("recorded_at", "<=", to)
            .orderBy("recorded_at", "asc")
            .orderBy("price_id", "asc")
            .limit(safeLimit)
            .execute();
    }

    async insertManyIgnoreDuplicates(inputs: HistoricalPriceInput[]) {
        if (inputs.length === 0) {
            return [];
        }

        return db
            .insertInto("stock_prices")
            .values(
                inputs.map((input) => ({
                    stock_id: input.stock_id,
                    price: input.price,
                    recorded_at: input.recorded_at,
                    source: input.source,
                }))
            )
            .onConflict((oc) =>
                oc.columns(["stock_id", "recorded_at"]).doNothing()
            )
            .returning("price_id")
            .execute();
    }

}

export default StockPriceRepository;
