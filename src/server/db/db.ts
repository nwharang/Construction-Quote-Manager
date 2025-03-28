import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

// Check if we're in a production environment
const isProduction = process.env.NODE_ENV === "production";

// For logging in development
if (!isProduction) {
  console.log("Database URL:", process.env.DATABASE_URL?.slice(0, 20) + "...");
}

// Database connection with connection pooling
export const client = postgres(process.env.DATABASE_URL!, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});

export const db = drizzle(client, { schema }); 