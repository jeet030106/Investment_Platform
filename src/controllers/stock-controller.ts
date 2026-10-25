
import type { Request, Response, NextFunction } from "express";
import { StockService } from "../services/index.js";

const stockService = new StockService();

// The value can be of type unknown and we are passing a default value if required
function parsePagination(value: unknown, defaultValue: number): number {
    if (value === undefined) {
        return defaultValue;
    }

    // Throws error if type is string or having a non digit char
    if (
        typeof value !== "string" ||
        !/^\d+$/.test(value)
    ) {
        throw Object.assign(
            new Error("Invalid pagination parameter"),
            { statusCode: 400 }
        );
    }

    //Converts the value into number
    const parsed = Number(value);

    if (!Number.isSafeInteger(parsed)) {
        throw Object.assign(
            new Error("Invalid pagination parameter"),
            { statusCode: 400 }
        );
    }

    return parsed;
}

export async function listStocks(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Generally receive the limit and the offset in query params like
        // /api/v1/stocks?limit=20&offset=1
        // Query filters out the data/resources
        const limit = parsePagination(req.query.limit, 20);
        const offset = parsePagination(req.query.offset, 0);

        if (limit < 1 || offset < 0) {
            res.status(400).json({
                success: false,
                message: "Limit must be positive and offset cannot be negative",
            });
            return;
        }

        const data = await stockService.listStocks({
            limit,
            offset,
        });

        res.status(200).json({
            success: true,
            message: "Stocks fetched successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
}

export async function searchStocks(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const search = req.query.q;

        if (typeof search !== "string" || !search.trim()) {
            res.status(400).json({
                success: false,
                message: "A non-empty search query 'q' is required",
            });
            return;
        }

        const limit = parsePagination(req.query.limit, 20);
        const offset = parsePagination(req.query.offset, 0);

        if (limit < 1 || offset < 0) {
            res.status(400).json({
                success: false,
                message: "Limit must be positive and offset cannot be negative",
            });
            return;
        }

        const data = await stockService.searchStocks(search, {
            limit,
            offset,
        });

        res.status(200).json({
            success: true,
            message: "Stock search completed successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
}

export async function getStockDetails(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // req.params can hold values string | string[]
        const { stockId } = req.params;

        // Type check to confirm that the stockId passed is String
        // Params identify which resource you want
        if (typeof stockId !== "string" || !stockId.trim()) {
            res.status(400).json({
                success: false,
                message: "A valid stock ID is required",
            });
            return;
        }

        const data = await stockService.getStockDetails(stockId);

        res.status(200).json({
            success: true,
            message: "Stock details fetched successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
}
