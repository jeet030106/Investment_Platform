import type {
    Request,
    Response,
    NextFunction,
} from "express";

import AuthService from "../services/auth-service.js";

const authService = new AuthService();

export async function register(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const { user_name, email, password } = req.body;

        const response = await authService.register({
            user_name,
            email,
            password,
        });

        res.status(201).json({
            data: response,
            message: "Registered Successfully",
            success: true,
        });
    } catch (error) {
        next(error);
    }
}