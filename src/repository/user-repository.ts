
import db from "../database/database.js";
import type { Users } from "../database/types.js";

// This picks the columns from the Users having the name as "user_name"
export type CreateUserInput = Pick<
    Users,
    "user_name" | "email" | "password"
>;

// -- Step 7 --
// Create a Repository class which will help to carry out operations with the db
class UserRepository {
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

    async getUserByEmail(email: string) {
        return db
            .selectFrom("users")
            .select([
                "user_id",
                "user_name",
                "email",
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
}

export default UserRepository;
