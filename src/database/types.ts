import { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

// -- Step 4 --
// Write down the migration file for the changes required, both when run and when reversed
export interface Users {
    user_id?: Generated<string>;
    user_name: string;
    email: string;
    password: string;
    created_at: Generated<Timestamp>;
    updated_at: Generated<Timestamp>;
};

// -- Step 3 -- 
// Create an interface that will be representing the structure of the DB
export interface Database {
    "users" : Users
}