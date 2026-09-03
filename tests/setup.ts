import { existsSync } from "node:fs";

// Vitest doesn't read .env (only the Prisma CLI does), so a local `npm test`
// would start with no DATABASE_URL. CI sets it directly, and a real
// environment variable must win over the file.
if (!process.env.DATABASE_URL && existsSync(".env")) {
  process.loadEnvFile(".env");
}
