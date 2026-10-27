
import db from "../database/database.js";
import type { Stocks } from "../database/types.js";
import {StockSeed} from "../model/stock-model.js"

export type CreateStockInput = Pick<
    Stocks,
    "symbol" | "company_name" | "exchange"
>;

export interface ListStocksOptions {
    limit?: number;
    offset?: number;
    search?: string;
}

class StockRepository {
    async getById(stockId: string) {
        return db
            .selectFrom("stocks")
            .selectAll()
            .where("stock_id", "=", stockId)
            .executeTakeFirst();
    }

    async getBySymbolAndExchange(
        symbol: string,
        exchange: string
    ) {
        return db
            .selectFrom("stocks")
            .selectAll()
            .where("symbol", "=", symbol.toUpperCase())
            .where("exchange", "=", exchange.toUpperCase())
            .executeTakeFirst();
    }

    async listActive(options: ListStocksOptions = {}) {
        const limit = Math.min(
            Math.max(options.limit ?? 20, 1),
            100
        );
        const offset = Math.max(options.offset ?? 0, 0);
        const search = options.search?.trim();

        let query = db
            .selectFrom("stocks")
            .selectAll()
            .where("is_active", "=", true);

        if (search) {
            const pattern = `%${search}%`;

            query = query.where((eb) =>
                eb.or([
                    eb("symbol", "ilike", pattern),
                    eb("company_name", "ilike", pattern),
                ])
            );
        }

        return query
            .orderBy("symbol", "asc")
            .limit(limit)
            .offset(offset)
            .execute();
    }

    async create(input: CreateStockInput) {
        return db
            .insertInto("stocks")
            .values({
                symbol: input.symbol.trim().toUpperCase(),
                company_name: input.company_name.trim(),
                exchange: input.exchange.trim().toUpperCase(),
            })
            .returningAll()
            .executeTakeFirstOrThrow();
    }

    async upsert(input: CreateStockInput) {
        return db
            .insertInto("stocks")
            .values({
                symbol: input.symbol.trim().toUpperCase(),
                company_name: input.company_name.trim(),
                exchange: input.exchange.trim().toUpperCase(),
            })
            .onConflict((oc) =>
                oc.columns(["exchange", "symbol"]).doUpdateSet({
                    company_name: input.company_name.trim(),
                    updated_at: new Date(),
                })
            )
            .returningAll()
            .executeTakeFirstOrThrow();
    }

    async upsertMany(inputs: StockSeed[]) {
        if (inputs.length === 0) {
            return [];
        }

        return db
            .insertInto("stocks")
            .values(
                inputs.map((stock) => ({
                    symbol: stock.symbol.trim().toUpperCase(),
                    company_name: stock.companyName.trim(),
                    exchange: stock.exchange.trim().toUpperCase(),
                }))
            )
            .onConflict((oc) =>
                oc.columns(["exchange", "symbol"]).doUpdateSet((eb) => ({
                    company_name: eb.ref("excluded.company_name"),
                    updated_at: new Date(),
                }))
            )
            .returningAll()
            .execute();
    }


}



export default StockRepository;
