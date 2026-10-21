
import db from "../database/database.js";
import type { Users } from "../database/types.js";

// This picks the columns from the Users having the name as "user_name"
export type CreateUserInput = Pick<
    Users,
    "user_name" | "email" | "password"
>;

export type UpdateUserInput = Partial<
    Pick<Users, "user_name" | "email">
>;

// -- Step 7 --
// Create a Repository class which will help to carry out operations with the dd
class UserRepository {
    // Fetch a user's public profile.
    async getUser(userId: string) {
        return db
            .selectFrom("users")
            .select([
                "user_id",
                "user_name",
                "email",
                "created_at",
                "updated_at",
            ])
            .where("user_id", "=", userId)
            .executeTakeFirst();
    }

    // Fetch credentials for login and duplicate-email checks.
    // Never return this result directly from a controller.
    async getUserByEmail(email: string) {
        return db
            .selectFrom("users")
            .select([
                "user_id",
                "user_name",
                "email",
                "password",
                "created_at",
                "updated_at",
            ])
            .where("email", "=", email)
            .executeTakeFirst();
    }

    async create(input: CreateUserInput) {
        return db
            .insertInto("users")
            .values(input)
            .returning([
                "user_id",
                "user_name",
                "email",
                "created_at",
                "updated_at",
            ])
            .executeTakeFirstOrThrow();
    }

    async updateUser(
        userId: string,
        input: UpdateUserInput,
    ) {
        return db
            .updateTable("users")
            .set({
                ...input,
                updated_at: new Date(),
            })
            .where("user_id", "=", userId)
            .returning([
                "user_id",
                "user_name",
                "email",
                "created_at",
                "updated_at",
            ])
            .executeTakeFirst();
    }

    async deleteUser(userId: string) {
        return db
            .deleteFrom("users")
            .where("user_id", "=", userId)
            .returning("user_id")
            .executeTakeFirst();
    }
}

export default UserRepository;