import { WatchlistRepository } from "../repository/index.js";

const watchlistRepository = new WatchlistRepository();

export class WatchlistService {
    async createWatchlist(
        userId: string,
        name: string,
        stockIds: string[]
    ) {
        return watchlistRepository.create(
            userId,
            name,
            stockIds
        );
    }

    async updateWatchlist(
        watchlistId: string,
        userId: string,
        name: string,
        stockIds: string[]
    ) {
        const watchlist = await watchlistRepository.update(
            watchlistId,
            userId,
            name,
            stockIds
        );

        if (!watchlist) {
            throw Object.assign(
                new Error("Watchlist not found"),
                { statusCode: 404 }
            );
        }

        return watchlist;
    }

    async deleteWatchlist(
        watchlistId: string,
        userId: string
    ) {
        const deleted = await watchlistRepository.delete(
            watchlistId,
            userId
        );

        if (!deleted) {
            throw Object.assign(
                new Error("Watchlist not found"),
                { statusCode: 404 }
            );
        }

        return deleted;
    }

    async removeStockFromWatchlist(
        watchlistStockId: string,
        userId: string,
    ) {
        const deleted = await watchlistRepository.removeStock(
            watchlistStockId,
            userId,
        );

        if (!deleted) {
            throw new Error("Watchlist stock not found");
        }

        return deleted;
    }
}

export default WatchlistService;