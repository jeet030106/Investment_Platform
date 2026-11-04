import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
    // Add a name to each watchlist.
    await db.schema
        .alterTable("watchlists")
        .addColumn("name", "varchar(100)", (col) =>
            col.notNull().defaultTo("My Watchlist")
        )
        .execute();

    // Create the mapping table between watchlists and stocks.
    await db.schema
        .createTable("watchlist_stocks")
        .addColumn("watchlist_stock_id", "uuid", (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn("watchlist_id", "uuid", (col) =>
            col.notNull()
                .references("watchlists.watchlist_id")
                .onDelete("cascade")
        )
        .addColumn("stock_id", "uuid", (col) =>
            col.notNull()
                .references("stocks.stock_id")
                .onDelete("cascade")
        )
        .addColumn("created_at", "timestamptz", (col) =>
            col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
        )
        .addUniqueConstraint("watchlist_stocks_unique", [
            "watchlist_id",
            "stock_id",
        ])
        .execute();

    // Remove the old constraint from the previous table design.
    await db.schema
        .alterTable("watchlists")
        .dropConstraint("unique_user_stock")
        .execute();

    // Remove the old stock_id column.
    await db.schema
        .alterTable("watchlists")
        .dropColumn("stock_id")
        .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
    // Restore the old stock_id column.
    await db.schema
        .alterTable("watchlists")
        .addColumn("stock_id", "uuid", (col) =>
            col.references("stocks.stock_id").onDelete("cascade")
        )
        .execute();

    // Restore the previous uniqueness constraint.
    await db.schema
        .alterTable("watchlists")
        .addUniqueConstraint("unique_user_stock", [
            "user_id",
            "stock_id",
        ])
        .execute();

    // Remove the mapping table.
    await db.schema
        .dropTable("watchlist_stocks")
        .execute();

    // Remove the watchlist name.
    await db.schema
        .alterTable("watchlists")
        .dropColumn("name")
        .execute();
}