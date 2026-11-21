import { Router } from "express";

import {
    createWatchList,
    updateWatchList,
    deleteWatchList,
} from "../../../controllers/index.js";

import { authMiddleware } from "../../../middleware/auth-middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createWatchList);
router.put("/:watchlistId", updateWatchList);
router.delete("/:watchlistId", deleteWatchList);

export default router;