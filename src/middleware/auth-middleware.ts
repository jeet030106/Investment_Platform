import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_ISSUER = process.env.JWT_ISSUER ?? "stockify-api";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE ?? "stockify-client";

if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
}

export interface AuthenticatedRequest extends Request {
    userId?: string;
}

export function authMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const authorization = req.headers.authorization

    if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({
            success: false,
            message: "Authentication token is required"
        })
        return
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
        res.status(401).json({
            success: false,
            message: "Authentication token is required",
        });
        return;
    }

    try {

        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
            algorithms: ["HS256"],
        });

        if (
            typeof decoded === "string" ||
            typeof decoded.sub !== "string" ||
            decoded.sub.length === 0
        ) {
            res.status(401).json({
                success: false,
                message: "Invalid authentication token",
            });
            return;
        }

        req.userId = decoded.sub;

        next();
    } catch {
        res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token",
        });
    }
}
