import { Router } from "express";

import {
    createWatchList,
    updateWatchList,
    deleteWatchList,
    removeStockFromWatchlist
} from "../../../controllers/index.js";

import { authMiddleware } from "../../../middleware/auth-middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createWatchList);
router.put("/:watchlistId", updateWatchList);
router.delete("/:watchlistId", deleteWatchList);
router.delete("/:watchlistId/stocks/:watchlistStockId", removeStockFromWatchlist);

export default router;