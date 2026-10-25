
import type { Request, Response, NextFunction } from "express";
import StockPriceService from "../services/stock-price-service.js";

const stockPriceService = new StockPriceService();

export async function getPriceHistory(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const { stockId } = req.params;
        const { from, to } = req.query;

        if (
            typeof from !== "string" ||
            typeof to !== "string" ||
            !from ||
            !to
        ) {
            res.status(400).json({
                success: false,
                message: "Both 'from' and 'to' query parameters are required",
            });
            return;
        }

        if (typeof stockId !== "string" || !stockId.trim()) {
            res.status(400).json({
                success: false,
                message: "A valid stock ID is required",
            });
            return;
        }

        const data = await stockPriceService.getPriceHistory(
            stockId,
            from,
            to
        );

        res.status(200).json({
            success: true,
            message: "Stock price history fetched successfully",
            data,
        });
    } catch (error) {
        next(error);
    }
}
