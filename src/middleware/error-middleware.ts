import type {
    Request,
    Response,
    NextFunction,
} from "express";

export function errorMiddleware(
    error: Error & { statusCode?: number },
    _req: Request,
    res: Response,
    _next: NextFunction,
) {
    const statusCode = error.statusCode ?? 500;

    if (statusCode === 500) {
        console.error(error);
    }

    res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? "Internal server error"
                : error.message,
    });
}
