
import type { Request, Response } from "express";
import { UserService } from "../services/index.js";

const userService = new UserService();

// -- Step 9 --
// Here we create a controller, which is called by the routes when an endpoint is hit by the front end
const createUser = async (req: Request, res: Response) => {
    try {
        const { user_name, email, password } = req.body ?? {};

        if (
            typeof user_name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !user_name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                data: {},
                success: false,
                message: "Name, email and password are required.",
                err: {},
            });
        }

        const user = await userService.create({
            user_name,
            email,
            password,
        });

        return res.status(201).json({
            data: user,
            success: true,
            message: "Successfully created a user",
            err: {},
        });
    } catch (error) {
        console.error("Error in Controller Layer:", error);

        const statusCode =
            (error as { statusCode?: number }).statusCode ?? 500;

        return res.status(statusCode).json({
            data: {},
            success: false,
            message:
                statusCode === 409
                    ? "Email is already registered."
                    : "Error while creating user",
            err: {},
        });
    }
};

const getUser = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;

        if (typeof userId !== "string") {
            return res.status(400).json({
                data: {},
                success: false,
                message: "A valid user ID is required.",
                err: {},
            });
        }

        const user = await userService.getUser(userId);

        if (!user) {
            return res.status(404).json({
                data: {},
                success: false,
                message: "User not found.",
                err: {},
            });
        }

        return res.status(200).json({
            data: user,
            success: true,
            message: "Successfully fetched user",
            err: {},
        });
    } catch (error) {
        console.error("Error in Controller Layer:", error);

        return res.status(500).json({
            data: {},
            success: false,
            message: "Error while fetching user",
            err: {},
        });
    }
};

export { createUser, getUser };
