import { Router } from "express";
import v1Router from "./v1/index.js";

const router = Router();

// -- Step 11 --
// We have created a v1 route means now when you want to hit /users, you actually go for v1/users/
// The reason behind using this is, we can generate some future endpoints but without disturbing the old versions
router.use("/v1", v1Router);

export default router;