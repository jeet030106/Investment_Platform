import db from "../database/database.js";

export interface CreateWatchlistData {
    user_id: string;
    name: string;
}

export class WatchlistRepository {
    async getAll(userId: string) {
        return db
            .selectFrom("watchlists")
            .selectAll()
            .where("user_id", "=", userId)
            .orderBy("created_at", "desc")
            .execute();
    }

    async getById(watchlistId: string, userId: string) {
        return db
            .selectFrom("watchlists")
            .selectAll()
            .where("watchlist_id", "=", watchlistId)
            .where("user_id", "=", userId)
            .executeTakeFirst();
    }

    async create(data: CreateWatchlistData) {
        return db
            .insertInto("watchlists")
            .values(data)
            .returningAll()
            .executeTakeFirstOrThrow();
    }

    async update(
        watchlistId: string,
        userId: string,
        name: string
    ) {
        return db
            .updateTable("watchlists")
            .set({ name })
            .where("watchlist_id", "=", watchlistId)
            .where("user_id", "=", userId)
            .returningAll()
            .executeTakeFirst();
    }

    async delete(watchlistId: string, userId: string) {
        return db
            .deleteFrom("watchlists")
            .where("watchlist_id", "=", watchlistId)
            .where("user_id", "=", userId)
            .returningAll()
            .executeTakeFirst();
    }
}