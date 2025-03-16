import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/database/schemas",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
