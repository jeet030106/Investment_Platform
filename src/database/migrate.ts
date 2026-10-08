import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { FileMigrationProvider, Migrator } from "kysely/migration";
import db from "./database.js";

// -- Step 5 --
// Creating a migrator to run the migration files

// Finding the migration directory
const currentDirectory = path.dirname(
    fileURLToPath(import.meta.url)
);

// db tells which database to use
// provider tells where and how to discover migration files
//  migrationFolder resolves to src/database/migrations
const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder: path.join(
            currentDirectory,
            "migrations"
        ),

        // Convert Windows paths to valid ESM file URLs.
        import: (filePath) =>
            import(pathToFileURL(filePath).href),
    }),
});

// Checks the migration history and run only those that are pending 
async function migrateToLatest() {
    const { error, results } = await migrator.migrateToLatest();

    results?.forEach((result) => {
        console.log(
            `${result.status}: ${result.migrationName}`
        );
    });

    if (error) {
        console.error("Migration failed:", error);
        // Tells the OS script failed and marks the task as unsuccessfull
        process.exitCode = 1;
    } else {
        console.log("Migrations completed.");
    }

    await db.destroy();
}

migrateToLatest().catch(async (error: unknown) => {
    console.error("Unexpected migration error:", error);
    await db.destroy();
    process.exitCode = 1;
});

// -- Step 6 --
// Now run the migration and verify the results using npm db:migrate