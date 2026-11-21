import { WatchlistRepository } from "../repository/index.js";
import { WatchlistStocksRepository } from "../repository/index.js";

export class WatchlistService {
    private watchlistRepository = new WatchlistRepository();
    private watchlistStocksRepository = new WatchlistStocksRepository();

    // Return all of a user's watchlists, each with its stocks.
    async getAllWatchlists(userId: string) {
        const watchlists = await this.watchlistRepository.getAll(userId);

        return Promise.all(
            watchlists.map(async (watchlist) => {
                const stocks =
                    await this.watchlistStocksRepository.getStocksByWatchlistId(
                        watchlist.watchlist_id
                    );

                return {
                    ...watchlist,
                    stocks,
                };
            })
        );
    }

    // Return one watchlist with its stocks.
    async getWatchlistById(watchlistId: string, userId: string) {
        const watchlist = await this.watchlistRepository.getById(
            watchlistId,
            userId
        );

        if (!watchlist) {
            return null;
        }

        const stocks =
            await this.watchlistStocksRepository.getStocksByWatchlistId(
                watchlist.watchlist_id
            );

        return {
            ...watchlist,
            stocks,
        };
    }

    // Create a watchlist without stocks.
    async createWatchlist(userId: string, name: string) {
        return this.watchlistRepository.create({
            user_id: userId,
            name,
        });
    }

    // Update a watchlist's name.
    async updateWatchlist(
        watchlistId: string,
        userId: string,
        name: string
    ) {
        return this.watchlistRepository.update(watchlistId, userId, name);
    }

    // Delete a watchlist.
    async deleteWatchlist(watchlistId: string, userId: string) {
        return this.watchlistRepository.delete(watchlistId, userId);
    }

    // Add multiple stocks to a user's watchlist.
    async addStocksToWatchlist(
        watchlistId: string,
        userId: string,
        stockIds: string[]
    ) {
        const watchlist = await this.watchlistRepository.getById(
            watchlistId,
            userId
        );

        if (!watchlist) {
            return null;
        }

        return this.watchlistStocksRepository.addMultiple(
            watchlistId,
            stockIds
        );
    }

    // Remove multiple stocks from a user's watchlist.
    async removeStocksFromWatchlist(
        watchlistId: string,
        userId: string,
        stockIds: string[]
    ) {
        const watchlist = await this.watchlistRepository.getById(
            watchlistId,
            userId
        );

        if (!watchlist) {
            return null;
        }

        return this.watchlistStocksRepository.deleteMultiple(
            watchlistId,
            stockIds
        );
    }
}