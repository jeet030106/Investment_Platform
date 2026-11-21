// routes/watchlist-routes.ts
import { Router } from "express";
import {
    getAllWatchlists,
    getWatchlistById,
    createWatchlist,
    updateWatchlist,
    deleteWatchlist,
    addStocksToWatchlist,
    removeStocksFromWatchlist,
} from "../../../controllers/index.js";
import { authMiddleware } from "../../../middleware/auth-middleware.js";
const router = Router();

router.use(authMiddleware);


router.get("/", getAllWatchlists);
router.get("/:watchlistId", getWatchlistById);
router.post("/", createWatchlist);
router.patch("/:watchlistId", updateWatchlist);
router.delete("/:watchlistId", deleteWatchlist);

router.post("/:watchlistId/stocks", addStocksToWatchlist);
router.delete("/:watchlistId/stocks", removeStocksFromWatchlist);

export default router;