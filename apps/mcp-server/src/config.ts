import { clusterApiUrl } from "@solana/web3.js";
import { z } from "zod";

const env = z.object({
  FACILITATOR_URL: z.string().url().default("https://x402.org/facilitator"),
  MCP_PRICE_PER_CALL_USD: z.string().default("0.001"),
  MCP_SERVER_PORT: z.string().default("4022"),
  SOLANA_RPC_URL: z.string().url().optional(),
}).parse(process.env);

export const FACILITATOR_URL = env.FACILITATOR_URL;
export const MCP_PRICE_PER_CALL_USD = env.MCP_PRICE_PER_CALL_USD;
export const MCP_SERVER_PORT = env.MCP_SERVER_PORT;
export const SOLANA_RPC_URL = env.SOLANA_RPC_URL ?? clusterApiUrl("devnet");
