import { sql, type Kysely } from "kysely";

export const walletTransactionStatuses = [
    "pending",
    "completed",
    "failed",
] as const;

export type WalletTransactionStatus =
    (typeof walletTransactionStatuses)[number];

export const walletTransactionTypes = [
    "deposit",
    "withdrawal",
    "order_reserve",
    "order_release",
    "trade_debit",
    "trade_credit",
] as const;

export type WalletTransactionType =
    (typeof walletTransactionTypes)[number];

export async function up(db: Kysely<unknown>): Promise<void> {
    const statusEnumValues = sql.join(
        walletTransactionStatuses.map((status) => sql.lit(status))
    );

    const typeEnumValues = sql.join(
        walletTransactionTypes.map((type) => sql.lit(type))
    );

    await sql`
        CREATE TYPE wallet_transaction_status AS ENUM (${statusEnumValues});
    `.execute(db);

    await sql`
        CREATE TYPE wallet_transaction_type AS ENUM (${typeEnumValues});
    `.execute(db);

    await sql`
        CREATE TABLE wallets (
            wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            user_id UUID NOT NULL UNIQUE
                REFERENCES users(user_id)
                ON DELETE CASCADE,

            currency CHAR(3) NOT NULL DEFAULT 'INR',

            balance NUMERIC(20, 2) NOT NULL DEFAULT 0
                CHECK (balance >= 0),

            reserved_balance NUMERIC(20, 2) NOT NULL DEFAULT 0
                CHECK (reserved_balance >= 0),

            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT wallet_reserved_balance_check
                CHECK (reserved_balance <= balance)
        );
    `.execute(db);

    await sql`
        CREATE TABLE wallet_transactions (
            wallet_transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

            wallet_id UUID NOT NULL
                REFERENCES wallets(wallet_id)
                ON DELETE RESTRICT,

            type wallet_transaction_type NOT NULL,

            amount NUMERIC(20, 2) NOT NULL
                CHECK (amount > 0),

            status wallet_transaction_status NOT NULL DEFAULT 'pending',

            reference_id UUID,
            description TEXT,

            created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `.execute(db);

    await sql`
        CREATE INDEX wallet_transactions_wallet_id_created_at_idx
        ON wallet_transactions (wallet_id, created_at DESC);
    `.execute(db);
}

export async function down(db: Kysely<unknown>): Promise<void> {
    await sql`DROP TABLE IF EXISTS wallet_transactions;`.execute(db);
    await sql`DROP TABLE IF EXISTS wallets;`.execute(db);

    await sql`DROP TYPE IF EXISTS wallet_transaction_type;`.execute(db);
    await sql`DROP TYPE IF EXISTS wallet_transaction_status;`.execute(db);
}