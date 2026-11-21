import db from "../database/database.js";

export class WatchlistStocksRepository {
    async getStocksByWatchlistId(watchlistId: string) {
        return db
            .selectFrom("watchlist_stocks")
            .innerJoin(
                "stocks",
                "stocks.stock_id",
                "watchlist_stocks.stock_id"
            )
            .selectAll("stocks")
            .where("watchlist_stocks.watchlist_id", "=", watchlistId)
            .execute();
    }

    async addMultiple(watchlistId: string, stockIds: string[]) {
        if (stockIds.length === 0) {
            return [];
        }

        const entries = stockIds.map((stockId) => ({
            watchlist_id: watchlistId,
            stock_id: stockId,
        }));

        return db
            .insertInto("watchlist_stocks")
            .values(entries)
            .returningAll()
            .execute();
    }

    async deleteMultiple(watchlistId: string, stockIds: string[]) {
        if (stockIds.length === 0) {
            return [];
        }

        return db
            .deleteFrom("watchlist_stocks")
            .where("watchlist_id", "=", watchlistId)
            .where("stock_id", "in", stockIds)
            .returningAll()
            .execute();
    }
}