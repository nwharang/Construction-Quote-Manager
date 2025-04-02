// Remove the explicit server-only import as it was causing conflicts
// import 'server-only';

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// This is a temporary implementation for build purposes
// Replace with actual database configuration when ready

// Mock connection for build purposes
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/construction_quotes';

// Use a simple connection during build
const client = postgres(connectionString, { 
  max: 1,
  idle_timeout: 10
});

// Initialize Drizzle ORM with the schema
export const db = drizzle(client, { schema });
