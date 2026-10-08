import { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface Users {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    created_at: Generated<Timestamp>;
    updated_at: Generated<Timestamp>;
};

// -- Step 3 -- 
// Create an interface that will be representing the structure of the DB
export interface Database {
    "users" : Users
}