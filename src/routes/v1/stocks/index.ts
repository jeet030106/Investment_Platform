import { Router } from "express";
import{
    searchStocks,
    listStocks,
    getStockDetails,
    getPriceHistory
} from "../../../controllers/index.js"
import { stockEventPublisher } from "../../../events/stock-event-publisher.js";

const router = Router()

router.get("/search", searchStocks);
router.get("/", listStocks);
router.get("/:stockId", getStockDetails);
router.get("/:stockId/prices", getPriceHistory);

router.post("/test-socket/:stockId", (req, res) => {
    const { stockId } = req.params;

    stockEventPublisher.publishPriceUpdate({
        stockId,
        symbol: "RELIANCE",
        exchange: "NSE",
        price: "1500.00",
        recordedAt: new Date().toISOString(),
    });

    res.status(200).json({
        message: "Test price update published",
        stockId,
    });
});

export default router