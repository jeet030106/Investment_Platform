import db from "../database/database.js";

export class WatchlistRepository {
    async create(
        userId: string,
        name: string,
        stockIds: string[]
    ) {
        return db.transaction().execute(async (trx) => {
            const watchlist = await trx
                .insertInto("watchlists")
                .values({
                    user_id: userId,
                    name: name.trim(),
                })
                .returningAll()
                .executeTakeFirst();

            if (!watchlist?.watchlist_id) {
                throw new Error("Failed to create watchlist");
            }

            const watchlistId = watchlist.watchlist_id;
            const uniqueStockIds = [...new Set(stockIds)];

            if (uniqueStockIds.length > 0) {
                await trx
                    .insertInto("watchlist_stocks")
                    .values(
                        uniqueStockIds.map((stockId) => ({
                            watchlist_id: watchlistId,
                            stock_id: stockId,
                        }))
                    )
                    .execute();
            }

            return watchlist;
        });
    }

    async update(
        watchlistId: string,
        userId: string,
        name: string,
        stockIds: string[]
    ) {
        return db.transaction().execute(async (trx) => {
            const watchlist = await trx
                .updateTable("watchlists")
                .set({
                    name: name.trim(),
                })
                .where("watchlist_id", "=", watchlistId)
                .where("user_id", "=", userId)
                .returningAll()
                .executeTakeFirst();

            if (!watchlist) {
                return undefined;
            }

            await trx
                .deleteFrom("watchlist_stocks")
                .where("watchlist_id", "=", watchlistId)
                .execute();

            const uniqueStockIds = [...new Set(stockIds)];

            if (uniqueStockIds.length > 0) {
                await trx
                    .insertInto("watchlist_stocks")
                    .values(
                        uniqueStockIds.map((stockId) => ({
                            watchlist_id: watchlistId,
                            stock_id: stockId,
                        }))
                    )
                    .execute();
            }

            return watchlist;
        });
    }

    async delete(watchlistId: string, userId: string) {
        return db
            .deleteFrom("watchlists")
            .where("watchlist_id", "=", watchlistId)
            .where("user_id", "=", userId)
            .returning("watchlist_id")
            .executeTakeFirst();
    }
}

export default WatchlistRepository;