import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .alterTable("users")
        .alterColumn("user_id", (col) =>
            col.setDefault(sql`gen_random_uuid()`)
        )
        .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .alterTable("users")
        .dropConstraint("users_email_format_check")
        .execute();

    await db.schema
        .alterTable("users")
        .alterColumn("user_id", (col) => col.dropDefault())
        .execute();
}
