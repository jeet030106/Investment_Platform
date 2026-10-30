
import cron from "node-cron";
import StockIngestionService from "../services/stock-ingestion-service.js";

const stockIngestionService = new StockIngestionService();

let isRunning = false;

/**
 * Returns today's date in YYYY-MM-DD format using Indian Standard Time.
 */
function getCurrentISTDate(): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
}

/**
 * Fetches and ingests the complete NSE market snapshot.
 */
async function ingestMarketSnapshot(): Promise<void> {
    if (isRunning) {
        console.warn("[Stock Ingestion] Previous job is still running. Skipping.");
        return;
    }

    isRunning = true;

    const date = getCurrentISTDate();

    try {
        console.info(
            `[Stock Ingestion] Starting NSE snapshot ingestion for ${date}`
        );

        const result =
            await stockIngestionService.ingestMarketSnapshot("NSE", date);

        console.info("[Stock Ingestion] Completed successfully:", result);
    } catch (error: unknown) {
        console.error("[Stock Ingestion] Failed:", error);
    } finally {
        isRunning = false;
    }
}

/**
 * Run Monday-Friday at 6:00 PM IST.
 */
export function startStockIngestionJob(): void {
    cron.schedule(
        "0 18 * * 1-5",
        () => {
            void ingestMarketSnapshot();
        },
        {
            timezone: "Asia/Kolkata",
        }
    );

    console.info(
        "[Stock Ingestion] Cron scheduled for weekdays at 6:00 PM IST."
    );
}
