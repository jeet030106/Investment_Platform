
import { UserRepository } from "../repository/index.js";
import type { UpdateUserInput } from "../repository/user-repository.js";


// -- Step 8 --
// Create a Service class, this will contain the business logic of the function.
// From here we call out the functions written in the repositories
const repository = new UserRepository();

function createError(message: string, statusCode: number) {
    return Object.assign(new Error(message), { statusCode });
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class UserService {
    async getUser(userId: string) {
        const user = await repository.getUser(userId);

        if (!user) {
            throw createError("User not found", 404);
        }

        return user;
    }

    async create(input: {
        user_name: string;
        email: string;
        password: string;
    }) {
        const email = input.email.trim().toLowerCase();

        const existingUser =
            await repository.getUserByEmail(email);

        if (existingUser) {
            const error = new Error("Email is already registered.");
            Object.assign(error, { statusCode: 409 });
            throw error;
        }

        return repository.create({
            ...input,
            email,
            user_name: input.user_name.trim(),
        });
    }

    async updateUser(userId: string, input: UpdateUserInput) {
            const updates: UpdateUserInput = {};

            if (input.user_name !== undefined) {
                const name = input.user_name.trim();

                if (!name) {
                    throw createError("Name cannot be empty", 400);
                }

                updates.user_name = name;
            }

            if (input.email !== undefined) {
                const email = input.email.trim().toLowerCase();

                if (!EMAIL_REGEX.test(email)) {
                    throw createError("Invalid email address", 400);
                }

                const existing = await repository.getUserByEmail(email);

                if (existing && existing.user_id !== userId) {
                    throw createError("Email is already registered", 409);
                }

                updates.email = email;
            }

            if (Object.keys(updates).length === 0) {
                throw createError("Provide at least one field to update", 400);
            }

            try {
                const updatedUser = await repository.updateUser(
                    userId,
                    updates,
                );

                if (!updatedUser) {
                    throw createError("User not found", 404);
                }

                return updatedUser;
            } catch (error) {
                if (
                    typeof error === "object" &&
                    error !== null &&
                    "code" in error &&
                    error.code === "23505"
                ) {
                    throw createError("Email is already registered", 409);
                }

                throw error;
            }
        }

    async deleteUser(userId: string) {
            const deletedUser = await repository.deleteUser(userId);

            if (!deletedUser) {
                throw createError("User not found", 404);
            }

            return { message: "Account deleted successfully" };
        }
    }

export default UserService;