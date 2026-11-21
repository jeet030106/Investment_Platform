import type { Response, NextFunction } from "express";
import { WatchlistService } from "../services/index.js";
import { isValidUuid } from "../utils/validators.js";
import type { AuthenticatedRequest } from "../middleware/auth-middleware.js";

const watchlistService = new WatchlistService();

export async function createWatchList(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { name, stockIds } = req.body;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({
                message: "User ID is missing in the request",
            });
            return;
        }

        if (
            typeof name !== "string" ||
            !name.trim() ||
            name.trim().length > 100
        ) {
            res.status(400).json({
                message: "Watchlist name must be between 1 and 100 characters",
            });
            return;
        }

        if (
            !Array.isArray(stockIds) ||
            !stockIds.every(
                (stockId) =>
                    typeof stockId === "string" &&
                    isValidUuid(stockId)
            )
        ) {
            res.status(400).json({
                message: "Stock IDs must be an array of valid UUIDs",
            });
            return;
        }

        const watchlist = await watchlistService.createWatchlist(
            userId,
            name,
            stockIds
        );

        res.status(201).json({
            message: "Watchlist created successfully",
            data: watchlist,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateWatchList(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { watchlistId } = req.params;
        const { name, stockIds } = req.body;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({
                message: "User ID is missing in the request",
            });
            return;
        }

        if (
            typeof watchlistId !== "string" ||
            !isValidUuid(watchlistId)
        ) {
            res.status(400).json({
                message: "Invalid watchlist ID",
            });
            return;
        }

        if (
            typeof name !== "string" ||
            !name.trim() ||
            name.trim().length > 100
        ) {
            res.status(400).json({
                message: "Watchlist name must be between 1 and 100 characters",
            });
            return;
        }

        if (
            !Array.isArray(stockIds) ||
            !stockIds.every(
                (stockId) =>
                    typeof stockId === "string" &&
                    isValidUuid(stockId)
            )
        ) {
            res.status(400).json({
                message: "Stock IDs must be an array of valid UUIDs",
            });
            return;
        }

        const watchlist = await watchlistService.updateWatchlist(
            watchlistId,
            userId,
            name,
            stockIds
        );

        res.status(200).json({
            message: "Watchlist updated successfully",
            data: watchlist,
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteWatchList(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { watchlistId } = req.params;
        const userId = req.userId;

        if (!userId) {
            res.status(401).json({
                message: "User ID is missing in the request",
            });
            return;
        }

        if (
            typeof watchlistId !== "string" ||
            !isValidUuid(watchlistId)
        ) {
            res.status(400).json({
                message: "Invalid watchlist ID",
            });
            return;
        }

        await watchlistService.deleteWatchlist(
            watchlistId,
            userId
        );

        res.status(200).json({
            message: "Watchlist deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}