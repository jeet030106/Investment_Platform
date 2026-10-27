import type { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .alterTable("stock_prices")
        .addUniqueConstraint(
            "stock_prices_stock_id_recorded_at_unique",
            ["stock_id", "recorded_at"]
        )
        .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .alterTable("stock_prices")
        .dropConstraint(
            "stock_prices_stock_id_recorded_at_unique"
        )
        .execute();
}