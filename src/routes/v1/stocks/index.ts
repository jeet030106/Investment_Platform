import { Router } from "express";
import{
    searchStocks,
    listStocks,
    getStockDetails,
    getPriceHistory
} from "../../../controllers/index.js"

const router = Router()

router.get("/search", searchStocks);
router.get("/", listStocks);
router.get("/:stockId", getStockDetails);
router.get("/:stockId/prices", getPriceHistory);

export default router