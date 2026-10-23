
import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .createTable("stocks")
        .addColumn("stock_id", "uuid", (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn("symbol", "text", (col) => col.notNull())
        .addColumn("company_name", "text", (col) => col.notNull())
        .addColumn("exchange", "text", (col) => col.notNull())
        .addColumn("is_active", "boolean", (col) =>
            col.notNull().defaultTo(true)
        )
        .addColumn("created_at", "timestamptz", (col) =>
            col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
        )
        .addColumn("updated_at", "timestamptz", (col) =>
            col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
        )
        .addUniqueConstraint("stocks_exchange_symbol_unique", [
            "exchange",
            "symbol",
        ])
        .execute();


    await db.schema
        .createTable("stock_prices")
        .addColumn("price_id", "uuid", (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn("stock_id", "uuid", (col) =>
            col.notNull().references("stocks.stock_id").onDelete("restrict")
        )
        .addColumn("price", sql`numeric(18,4)`, (col) => col.notNull())
        .addColumn("recorded_at", "timestamptz", (col) =>
            col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
        )
        .addColumn("source", "text", (col) => col.notNull())
        .addColumn("created_at", "timestamptz", (col) =>
            col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
        )
        .addCheckConstraint(
            "stock_prices_price_positive",
            sql`price > 0`
        )
        .execute();

    await db.schema
        .createIndex("stock_prices_stock_recorded_at_idx")
        .on("stock_prices")
        .columns(["stock_id", "recorded_at"])
        .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema.dropTable("stock_prices").execute();
    await db.schema.dropTable("stocks").execute();
}
