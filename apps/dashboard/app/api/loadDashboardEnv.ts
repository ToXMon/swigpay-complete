import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

const workspaceRoot = resolve(process.cwd(), "../..");

loadEnv({ path: resolve(workspaceRoot, ".env") });
process.env.DB_PATH ??= resolve(workspaceRoot, "swigpay.db");
