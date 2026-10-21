import { Router } from "express";
import { login, register } from "../../../controllers/auth-controller.js";
import { AuthenticatedRequest, authMiddleware } from "../../../middleware/auth-middleware.js";

const router = Router()

router.post("/register", register)
router.post("/login", login)

router.get("/protected-test", authMiddleware, (req, res) => {
    const authenticatedReq = req as AuthenticatedRequest;

    res.status(200).json({
        success: true,
        message: "Authentication successful",
        userId: authenticatedReq.userId,
    });
});

export default router