import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder";

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "test") {
  console.warn("DATABASE_URL is not set; database calls will fail.");
}

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
