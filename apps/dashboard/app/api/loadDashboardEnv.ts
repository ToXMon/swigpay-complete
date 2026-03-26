import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

// Resolve workspace root from this file's location:
// apps/dashboard/app/api/loadDashboardEnv.ts → 4 levels up = monorepo root
const _thisDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(_thisDir, "../../../..");

loadEnv({ path: resolve(workspaceRoot, ".env") });
process.env.DB_PATH ??= resolve(workspaceRoot, "swigpay.db");
