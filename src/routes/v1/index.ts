import { Router } from "express";
import { createUser, getUser } from "../../controllers/user-controller.js";

const router = Router();


// -- Step 10 --
// Now we define the routes of the API, when we hit /users - then createUser will be called with passed params
// And same for the /userId/:id will return the user with userId = id
router.post("/users", createUser);
router.get("/users/:id", getUser);

export default router;