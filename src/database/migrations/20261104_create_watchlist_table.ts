import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
    await sql`
        CREATE TABLE IF NOT EXISTS watchlists (
            watchlist_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            user_id UUID NOT NULL
                REFERENCES users(user_id)
                ON DELETE CASCADE,

            stock_id UUID NOT NULL
                REFERENCES stocks(stock_id)
                ON DELETE CASCADE,

            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT unique_user_stock
                UNIQUE (user_id, stock_id)
        );
    `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
    await sql`
        DROP TABLE IF EXISTS watchlists;
    `.execute(db);
}