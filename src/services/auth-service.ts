import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Users } from "../database/types.js";
import {UserRepository} from "../repository/index.js";

export type CreateUserInput = Pick<
    Users,
    "user_name" | "email" | "password"
>;

const userRepository = new UserRepository();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "15m";
const JWT_ISSUER = process.env.JWT_ISSUER ?? "stockify-api";
const JWT_AUDIENCE =
    process.env.JWT_AUDIENCE ?? "stockify-client";

if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error(
        "JWT_SECRET must be configured with at least 32 characters",
    );
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createError(message: string, statusCode: number) {
    return Object.assign(new Error(message), { statusCode });
}

function createAccessToken(userId: string): string {
    return jwt.sign({}, JWT_SECRET!, {
        subject: userId,
        expiresIn: "15m",
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    });
}

// -- Step 13 -- Write down the service for auth user
// Check whether the input is correct by running few steps
// - Whether the inputs are passed. Checking the email and password format
class AuthService {

    // Check whether the input is correct by running few steps
    // - Whether the inputs are passed. Checking the email and password format
    // - Checks if the user with the email is present or not, if yes then it sends an error showing such user already present else create a new one
    async register(input: CreateUserInput) {
        const userName = input.user_name?.trim();
        const email = input.email?.trim().toLowerCase();
        const password = input.password;

        if (!userName || !email || !password) {
            throw createError(
                "Name, email and password are required",
                400,
            );
        }

        if (!EMAIL_REGEX.test(email)) {
            throw createError("Invalid email address", 400);
        }

        if (
            password.length < 8 ||
            !/[A-Z]/.test(password) ||
            !/[0-9]/.test(password) ||
            !/[^A-Za-z0-9\s]/.test(password)
        ) {
            throw createError(
                "Password must be at least 8 characters and include an uppercase letter, a number and a special character",
                400,
            );
        }

        const existingUser =
            await userRepository.getUserByEmail(email);

        if (existingUser) {
            throw createError(
                "Email is already registered",
                409,
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const userInput: CreateUserInput = {
            user_name: userName,
            email,
            password: passwordHash,
        };

        try {
            const user = await userRepository.create(userInput);

            const accessToken = createAccessToken(user.user_id);

            return {
                user,
                accessToken,
                tokenType: "Bearer",
                expiresIn: JWT_EXPIRES_IN,
            };
        } catch (error) {
            // PostgreSQL unique-constraint violation.
            // This also handles two simultaneous signup requests.
            if (
                typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === "23505"
            ) {
                throw createError(
                    "Email is already registered",
                    409,
                );
            }

            throw error;
        }
    }

    // Login business logic
    async login(email : string, password: string) {
        const emailInput = email?.trim().toLowerCase();

        if(!email || !password){
            throw createError(
                "Email and Password are Required",
                400
            )
        }

        const user = await userRepository.getUserByEmail(emailInput)
        if(!user){
            throw createError(
                "Kindly create an account",
                401
            )
        }

        const isPassword = await bcrypt.compare(
            password,
            user.password
        )

        if(!isPassword){
            throw createError(
                "Invalid Password",
                400
            )
        }
        const { password: _password, ...safeUser } = user;

        const accessToken = createAccessToken(user.user_id)
        return {
            user: safeUser,
            accessToken,
            tokenType: "Bearer",
            expiresIn: JWT_EXPIRES_IN
        }
    }
}

export default AuthService;