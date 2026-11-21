import type { Request, Response, NextFunction } from "express";
import { WatchlistService } from "../services/index.js";

const watchlistService = new WatchlistService();

function getWatchlistId(value: unknown): string | undefined {
    return typeof value === "string" && value.trim()
        ? value
        : undefined;
}

export async function getAllWatchlists(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = req.user.user_id;
        const data = await watchlistService.getAllWatchlists(userId);

        res.status(200).json({
            success: true,
            message: "Watchlists fetched successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
}

export async function getWatchlistById(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const watchlistId = getWatchlistId(req.params.watchlistId);

        if (!watchlistId) {
            res.status(400).json({
                success: false,
                message: "A valid watchlist ID is required",
            });
            return;
        }

        const userId = req.user.user_id;
        const data = await watchlistService.getWatchlistById(
            watchlistId,
            userId
        );

        if (!data) {
            res.status(404).json({
                success: false,
                message: "Watchlist not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Watchlist fetched successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
}

export async function createWatchlist(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { name } = req.body;

        if (typeof name !== "string" || !name.trim()) {
            res.status(400).json({
                success: false,
                message: "A valid watchlist name is required",
            });
            return;
        }

        const userId = req.user.user_id;
        const data = await watchlistService.createWatchlist(
            userId,
            name.trim()
        );

        res.status(201).json({
            success: true,
            message: "Watchlist created successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateWatchlist(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const watchlistId = getWatchlistId(req.params.watchlistId);
        const { name } = req.body;

        if (!watchlistId) {
            res.status(400).json({
                success: false,
                message: "A valid watchlist ID is required",
            });
            return;
        }

        if (typeof name !== "string" || !name.trim()) {
            res.status(400).json({
                success: false,
                message: "A valid watchlist name is required",
            });
            return;
        }

        const userId = req.user.user_id;
        const data = await watchlistService.updateWatchlist(
            watchlistId,
            userId,
            name.trim()
        );

        if (!data) {
            res.status(404).json({
                success: false,
                message: "Watchlist not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Watchlist updated successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteWatchlist(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const watchlistId = getWatchlistId(req.params.watchlistId);

        if (!watchlistId) {
            res.status(400).json({
                success: false,
                message: "A valid watchlist ID is required",
            });
            return;
        }

        const userId = req.user.user_id;
        const data = await watchlistService.deleteWatchlist(
            watchlistId,
            userId
        );

        if (!data) {
            res.status(404).json({
                success: false,
                message: "Watchlist not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Watchlist deleted successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
}

export async function addStocksToWatchlist(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const watchlistId = getWatchlistId(req.params.watchlistId);
        const { stockIds } = req.body;

        if (!watchlistId) {
            res.status(400).json({
                success: false,
                message: "A valid watchlist ID is required",
            });
            return;
        }

        if (
            !Array.isArray(stockIds) ||
            !stockIds.every(
                (id: unknown) => typeof id === "string" && id.trim().length > 0
            )
        ) {
            res.status(400).json({
                success: false,
                message: "stockIds must be an array of non-empty strings",
            });
            return;
        }

        const userId = req.user.user_id;
        const data = await watchlistService.addStocksToWatchlist(
            watchlistId,
            userId,
            stockIds
        );

        if (!data) {
            res.status(404).json({
                success: false,
                message: "Watchlist not found",
            });
            return;
        }

        res.status(201).json({
            success: true,
            message: "Stocks added to watchlist successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
}

export async function removeStocksFromWatchlist(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const watchlistId = getWatchlistId(req.params.watchlistId);
        const { stockIds } = req.body;

        if (!watchlistId) {
            res.status(400).json({
                success: false,
                message: "A valid watchlist ID is required",
            });
            return;
        }

        if (
            !Array.isArray(stockIds) ||
            !stockIds.every(
                (id: unknown) => typeof id === "string" && id.trim().length > 0
            )
        ) {
            res.status(400).json({
                success: false,
                message: "stockIds must be an array of non-empty strings",
            });
            return;
        }

        const userId = req.user.user_id;
        const data = await watchlistService.removeStocksFromWatchlist(
            watchlistId,
            userId,
            stockIds
        );

        if (!data) {
            res.status(404).json({
                success: false,
                message: "Watchlist not found",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Stocks removed from watchlist successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
}