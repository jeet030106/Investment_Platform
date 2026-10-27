
import {
    StockRepository,
    StockPriceRepository,
} from "../repository/index.js";

import {
    isValidUuid,
    parseDateInput,
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

        const parsedFrom = parseDateInput(fromInput);
        const parsedTo = parseDateInput(toInput);

        if (!parsedFrom || !parsedTo) {
            throw Object.assign(
                new Error(
                    "Dates must be YYYY-MM-DD or UTC timestamps in ISO 8601 format, e.g. 2026-10-25T02:49:24.768Z"
                ),
                { statusCode: 400 }
            );
        }

        const from = parsedFrom.date;
        const to = parsedTo.date;

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

        // For date-only 'to' inputs, include the complete UTC day.
        // For timestamps, preserve the exact requested instant.
        if (parsedTo.dateOnly) {
            to.setUTCHours(23, 59, 59, 999);
        }

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
}

export default StockPriceService;
