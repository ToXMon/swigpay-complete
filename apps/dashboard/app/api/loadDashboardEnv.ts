import { fileURLToPath } from "node:url";
import { dirname, isAbsolute, resolve } from "node:path";
import { config as loadEnv } from "dotenv";

const moduleDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(moduleDir, "../../../..");
const workspaceRootEnvPath = resolve(workspaceRoot, ".env");
const workspaceRootDbPath = resolve(workspaceRoot, "swigpay.db");

loadEnv({ path: workspaceRootEnvPath });
if (process.env.DB_PATH) {
  process.env.DB_PATH = isAbsolute(process.env.DB_PATH)
    ? process.env.DB_PATH
    : resolve(workspaceRoot, process.env.DB_PATH);
} else {
  process.env.DB_PATH = workspaceRootDbPath;
}
