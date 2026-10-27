
const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const ISO_TIMESTAMP_REGEX =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidUuid(value: string): boolean {
    return UUID_REGEX.test(value);
}

export function isValidEmail(value: string): boolean {
    return EMAIL_REGEX.test(value);
}

export interface ParsedDateInput {
    date: Date;
    dateOnly: boolean;
}

export function parseDateInput(value: string): ParsedDateInput | null {
    // Accept YYYY-MM-DD.
    if (DATE_REGEX.test(value)) {
        const date = new Date(`${value}T00:00:00.000Z`);

        if (
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== value
        ) {
            return null;
        }

        return { date, dateOnly: true };
    }

    // Accept UTC timestamps such as 2026-10-25T02:49:24.768Z.
    if (ISO_TIMESTAMP_REGEX.test(value)) {
        const date = new Date(value);

        if (
            Number.isNaN(date.getTime()) ||
            date.toISOString() !== value
        ) {
            return null;
        }

        return { date, dateOnly: false };
    }

    return null;
}