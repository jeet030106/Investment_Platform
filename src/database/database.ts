import "dotenv/config"

import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { Database } from "./types.js";

const { Pool } = pg

// -- Step 1 --
// What does pool do - instead of creating DB connection repeatedly for every query,
// Pool gives the connection to query
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

// -- Step 2 --
// This tells Kysely to use the PostgreSQL as db dialect
// and use this pg pool to communicate with db
const db = new Kysely<Database>({
    dialect: new PostgresDialect({
        pool
    })
})

//PostgreSQL is the kitchen, pg is the communication mechanism, the Pool manages reusable connections, 
// Kysely prepares type-safe SQL orders, and our Node.js application decides what data/business operation it actually needs.

export default db;