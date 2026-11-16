import { sql } from "drizzle-orm";

export const databaseNow = sql<Date>`clock_timestamp()`;
export const leaseExpiry = sql<Date>`clock_timestamp() + interval '120 seconds'`;
