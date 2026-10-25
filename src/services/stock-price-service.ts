
import {
    StockRepository,
    StockPriceRepository,
} from "../repository/index.js";

import {
    isValidUuid,
    parseDateOnly,
} from "../utils/validators.js";

class StockPriceService {
    private readonly stockRepository = new StockRepository();
    private readonly stockPriceRepository = new StockPriceRepository();


    async getPriceHistory(
        stockId: string,
        fromInput: string,
        toInput: string
    ) {
        if (!isValidUuid(stockId)) {
            throw Object.assign(new Error("Invalid stock ID"), {
                statusCode: 400,
            });
        }

        const from = parseDateOnly(fromInput);
        const to = parseDateOnly(toInput);

        if (!from || !to) {
            throw Object.assign(
                new Error("Dates must be valid and use YYYY-MM-DD format"),
                { statusCode: 400 }
            );
        }

        if (from.getTime() > to.getTime()) {
            throw Object.assign(
                new Error("'from' must be before or equal to 'to'"),
                { statusCode: 400 }
            );
        }

        const stock = await this.stockRepository.getById(stockId);

        if (!stock || !stock.is_active) {
            throw Object.assign(new Error("Stock not found"), {
                statusCode: 404,
            });
        }

        // Include the complete final UTC day.
        to.setUTCHours(23, 59, 59, 999);

        const history = await this.stockPriceRepository.getHistory(
            stockId,
            from,
            to
        );

        return {
            stock: {
                stock_id: stock.stock_id,
                symbol: stock.symbol,
                company_name: stock.company_name,
                exchange: stock.exchange,
            },
            from: from.toISOString(),
            to: to.toISOString(),
            count: history.length,
            history,
        };
    }


    private parseDate(value: string): Date {
        // Accept date-only inputs in YYYY-MM-DD format.
        const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);

        if (!isDateOnly) {
            throw Object.assign(
                new Error("Dates must use YYYY-MM-DD format"),
                { statusCode: 400 }
            );
        }

        const date = new Date(`${value}T00:00:00.000Z`);

        // Reject invalid dates such as 2026-02-30.
        if (
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== value
        ) {
            throw Object.assign(
                new Error(`Invalid date: ${value}`),
                { statusCode: 400 }
            );
        }

        return date;
    }
}

export default StockPriceService;
