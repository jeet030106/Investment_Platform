
import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
    // 1. Generate UUIDs automatically.
    await sql`
        ALTER TABLE users
        ALTER COLUMN user_id
        SET DEFAULT gen_random_uuid()
    `.execute(db);

    // 2. Validate email format.
    await sql`
        ALTER TABLE users
        ADD CONSTRAINT users_email_format_check
        CHECK (
            email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
        )
    `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
    // 1. Remove the email-format constraint.
    await sql`
        ALTER TABLE users
        DROP CONSTRAINT users_email_format_check
    `.execute(db);

    // 2. Remove the UUID default.
    await sql`
        ALTER TABLE users
        ALTER COLUMN user_id
        DROP DEFAULT
    `.execute(db);
}
