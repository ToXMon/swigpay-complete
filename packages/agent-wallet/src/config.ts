import { clusterApiUrl } from "@solana/web3.js";
import { SOLANA_DEVNET_CAIP2, USDC_DEVNET_ADDRESS } from "@x402/svm";
import { z } from "zod";

const env = z.object({
  FACILITATOR_URL: z.string().url().default("https://x402.org/facilitator"),
  MCP_SERVER_URL: z.string().url().default("http://localhost:4022/mcp"),
  SOLANA_EXPLORER_BASE_URL: z.string().url().default("https://explorer.solana.com"),
  SOLANA_NETWORK: z.literal("devnet").default("devnet"),
  SOLANA_RPC_URL: z.string().url().optional(),
}).parse(process.env);

export const FACILITATOR_URL = env.FACILITATOR_URL;
export const DEFAULT_MCP_SERVER_URL = env.MCP_SERVER_URL;
export const EXPLORER_BASE_URL = env.SOLANA_EXPLORER_BASE_URL;
export const SOLANA_NETWORK = env.SOLANA_NETWORK;
export const SOLANA_NETWORK_CAIP2 = SOLANA_DEVNET_CAIP2;
export const SOLANA_RPC_URL = env.SOLANA_RPC_URL ?? clusterApiUrl(SOLANA_NETWORK);
export const USDC_MINT_ADDRESS = USDC_DEVNET_ADDRESS;
export const USDC_DECIMALS = 6;
export const USDC_RAW_MULTIPLIER = 10 ** USDC_DECIMALS;

export function buildExplorerAddressUrl(address: string): string {
  return `${EXPLORER_BASE_URL}/address/${address}?cluster=${SOLANA_NETWORK}`;
}

export function buildExplorerTransactionUrl(signature: string): string {
  return `${EXPLORER_BASE_URL}/tx/${signature}?cluster=${SOLANA_NETWORK}`;
}

export function loadEnv() {
  return {
    AGENT_PRIVATE_KEY_BASE58: process.env.AGENT_PRIVATE_KEY_BASE58,
    AGENT_ADDRESS: process.env.AGENT_ADDRESS,
    SQUADS_VAULT_PDA: process.env.SQUADS_VAULT_PDA,
  };
}
