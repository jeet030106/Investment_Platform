import { Router } from "express";
import{
    searchStocks,
    listStocks,
    getStockDetails
} from "../../../controllers/index.js"

const router = Router()

router.get("/search", searchStocks);
router.get("/", listStocks);
router.get("/:stockId", getStockDetails);

export default router