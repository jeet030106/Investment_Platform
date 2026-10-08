import { Kysely, sql } from "kysely";


// -- Step 4 --
// Write down the migration file for the changes required, both when run and when reversed
export async function up(db : Kysely<any>) : Promise<void> {
    await db.schema
    .createTable("users")
    .addColumn("user_id", "uuid" , (col) => col.primaryKey())
    .addColumn("user_name", "text", (col) => col.notNull())
    .addColumn("email", "text", (col) => col.notNull())
    .addColumn("password", "text", (col) => col.notNull())
    .addColumn("created_at", sql`timestamptz`, (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("updated_at", sql`timestamptz`, (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()
}

export async function down(db : Kysely<any>) : Promise<void> {
    await db.schema
    .dropTable("users")
    .execute()
}