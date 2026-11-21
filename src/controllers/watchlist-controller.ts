// controllers/watchlist-controller.ts
import type { NextFunction, Request, Response } from "express";
import { WatchlistService } from "../services/watchlist-service.js";

interface AuthenticatedRequest extends Request {
    user: {
        user_id: string;
    };
}

const watchlistService = new WatchlistService();

export const getAllWatchlists = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.user.user_id;
        const watchlists = await watchlistService.getAllWatchlists(userId);

        res.status(200).json({ watchlists });
    } catch (error) {
        next(error);
    }
};

export const getWatchlistById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { watchlistId } = req.params;
        const userId = req.user.user_id;

        if (typeof watchlistId !== "string" || !watchlistId.trim()) {
            res.status(400).json({ message: "A valid watchlistId is required" });
            return;
        }

        const watchlist = await watchlistService.getWatchlistById(
            watchlistId,
            userId
        );

        if (!watchlist) {
            res.status(404).json({ message: "Watchlist not found" });
            return;
        }

        res.status(200).json({ watchlist });
    } catch (error) {
        next(error);
    }
};

export const createWatchlist = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { name } = req.body;
        const userId = req.user.user_id;

        if (typeof name !== "string" || !name.trim()) {
            res.status(400).json({ message: "A valid name is required" });
            return;
        }

        const watchlist = await watchlistService.createWatchlist(
            userId,
            name.trim()
        );

        res.status(201).json({ watchlist });
    } catch (error) {
        next(error);
    }
};

export const updateWatchlist = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { watchlistId } = req.params;
        const { name } = req.body;
        const userId = req.user.user_id;

        if (typeof watchlistId !== "string" || !watchlistId.trim()) {
            res.status(400).json({ message: "A valid watchlistId is required" });
            return;
        }

        if (typeof name !== "string" || !name.trim()) {
            res.status(400).json({ message: "A valid name is required" });
            return;
        }

        const watchlist = await watchlistService.updateWatchlist(
            watchlistId,
            userId,
            name.trim()
        );

        if (!watchlist) {
            res.status(404).json({ message: "Watchlist not found" });
            return;
        }

        res.status(200).json({ watchlist });
    } catch (error) {
        next(error);
    }
};

export const deleteWatchlist = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { watchlistId } = req.params;
        const userId = req.user.user_id;

        if (typeof watchlistId !== "string" || !watchlistId.trim()) {
            res.status(400).json({ message: "A valid watchlistId is required" });
            return;
        }

        const watchlist = await watchlistService.deleteWatchlist(
            watchlistId,
            userId
        );

        if (!watchlist) {
            res.status(404).json({ message: "Watchlist not found" });
            return;
        }

        res.status(200).json({
            message: "Watchlist deleted successfully",
            watchlist,
        });
    } catch (error) {
        next(error);
    }
};

export const addStocksToWatchlist = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { watchlistId } = req.params;
        const { stockIds } = req.body;
        const userId = req.user.user_id;

        if (typeof watchlistId !== "string" || !watchlistId.trim()) {
            res.status(400).json({ message: "A valid watchlistId is required" });
            return;
        }

        if (
            !Array.isArray(stockIds) ||
            !stockIds.every(
                (id: unknown) => typeof id === "string" && id.trim().length > 0
            )
        ) {
            res.status(400).json({
                message: "stockIds must be an array of non-empty strings",
            });
            return;
        }

        const entries = await watchlistService.addStocksToWatchlist(
            watchlistId,
            userId,
            stockIds
        );

        if (!entries) {
            res.status(404).json({ message: "Watchlist not found" });
            return;
        }

        res.status(201).json({ entries });
    } catch (error) {
        next(error);
    }
};

export const removeStocksFromWatchlist = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { watchlistId } = req.params;
        const { stockIds } = req.body;
        const userId = req.user.user_id;

        if (typeof watchlistId !== "string" || !watchlistId.trim()) {
            res.status(400).json({ message: "A valid watchlistId is required" });
            return;
        }

        if (
            !Array.isArray(stockIds) ||
            !stockIds.every(
                (id: unknown) => typeof id === "string" && id.trim().length > 0
            )
        ) {
            res.status(400).json({
                message: "stockIds must be an array of non-empty strings",
            });
            return;
        }

        const entries = await watchlistService.removeStocksFromWatchlist(
            watchlistId,
            userId,
            stockIds
        );

        if (!entries) {
            res.status(404).json({ message: "Watchlist not found" });
            return;
        }

        res.status(200).json({
            message: "Stocks removed from watchlist",
            entries,
        });
    } catch (error) {
        next(error);
    }
};