/**
 * SwigPay — Single-Command Demo Flow
 *
 * Runs the entire SwigPay demo with timed narration and auto-retry polling.
 *
 * Usage: pnpm demo-flow
 */
import "dotenv/config";
import { execSync, spawn } from "node:child_process";
import http from "node:http";
import { PublicKey } from "@solana/web3.js";
import {
  buildExplorerTransactionUrl,
  createSwigPayClient,
  DEFAULT_MCP_SERVER_URL,
  enforceSpendPolicy,
  ensureUsdcAssociatedTokenAccount,
  getConnection,
  getPaymentById,
  getPendingApproval,
  insertPayment,
  loadKeypairFromBase58,
  USDC_RAW_MULTIPLIER,
} from "@swigpay/agent-wallet";
import type { AgentConfig, SpendPolicy } from "@swigpay/agent-wallet";

const TOOL_PRICES_USDC: Record<string, number> = {
  expensive_tool: 0.50,
};

const START = Date.now();

function elapsed(): string {
  const s = ((Date.now() - START) / 1000).toFixed(1);
  return `[${s}s]`;
}

function stepHeader(n: number, title: string) {
}

function loadAgentConfigFromEnv(): AgentConfig {
  const agentKey = process.env.AGENT_PRIVATE_KEY_BASE58;
  const agentAddress = process.env.AGENT_ADDRESS;
  const humanAddress = process.env.HUMAN_ADDRESS;
  const multisigPda = process.env.SQUADS_MULTISIG_PDA;
  const vaultPda = process.env.SQUADS_VAULT_PDA;
  const spendingLimitPda = process.env.SQUADS_SPENDING_LIMIT_PDA;

  if (!agentKey || !agentAddress || !humanAddress || !multisigPda || !vaultPda || !spendingLimitPda) {
    throw new Error(
      "Missing required env vars. Required: " +
        "AGENT_PRIVATE_KEY_BASE58, AGENT_ADDRESS, HUMAN_ADDRESS, " +
        "SQUADS_MULTISIG_PDA, SQUADS_VAULT_PDA, SQUADS_SPENDING_LIMIT_PDA"
    );
  }

  return {
    name: "demo-flow-agent",
    agentAddress,
    humanAddress,
    multisigPda,
    vaultPda,
    spendingLimitPda,
    dailyLimitUsdc: Number(process.env.SQUADS_DAILY_LIMIT_USDC ?? "1.0"),
    perTxLimitUsdc: Number(process.env.SQUADS_PER_TX_LIMIT_USDC ?? "0.01"),
    approvalThresholdUsdc: 0.5,
    whitelistedEndpoints: [],
    createdAt: new Date().toISOString(),
  };
}

function buildSpendPolicyFromEnv(): SpendPolicy {
  const approvalThreshold = Number(process.env.SQUADS_APPROVAL_THRESHOLD_USDC ?? "0.5");
  const perTxEnv = Number(process.env.SQUADS_PER_TX_LIMIT_USDC ?? "0.01");
  return {
    dailyLimitUsdc: Number(process.env.SQUADS_DAILY_LIMIT_USDC ?? "1.0"),
    perTxLimitUsdc: Math.max(perTxEnv, approvalThreshold),
    approvalThresholdUsdc: approvalThreshold,
    whitelistedEndpoints: [],
  };
}

async function step1_walletStatus() {
  stepHeader(1, "Wallet Status");

  const agentAddress = process.env.AGENT_ADDRESS ?? null;
  const humanAddress = process.env.HUMAN_ADDRESS ?? null;
  const multisigPda = process.env.SQUADS_MULTISIG_PDA ?? null;
  const vaultPda = process.env.SQUADS_VAULT_PDA ?? null;
  const spendingLimitPda = process.env.SQUADS_SPENDING_LIMIT_PDA ?? null;


  if (!vaultPda) {
    process.exit(1);
  }

  const connection = getConnection();
  const agentKeypair = loadKeypairFromBase58(process.env.AGENT_PRIVATE_KEY_BASE58!);

  try {
    const agentUsdcAccount = await ensureUsdcAssociatedTokenAccount({
      connection,
      payer: agentKeypair,
      owner: agentKeypair.publicKey,
    });
    const agentBal = await connection.getTokenAccountBalance(agentUsdcAccount);
  } catch {
  }

  try {
    const vaultUsdcAta = await ensureUsdcAssociatedTokenAccount({
      connection,
      payer: agentKeypair,
      owner: new PublicKey(vaultPda),
    });
    const vaultBal = await connection.getTokenAccountBalance(vaultUsdcAta);
  } catch {
  }

}

async function step2_listTools() {
  stepHeader(2, "List MCP Tools");

  const agentConfig = loadAgentConfigFromEnv();
  const agentKey = process.env.AGENT_PRIVATE_KEY_BASE58!;

  const { listTools: listMcpTools, close } = await createSwigPayClient({
    agentConfig,
    agentPrivateKeyBase58: agentKey,
  });

  try {
    const { tools } = await listMcpTools();
    for (const t of tools) {
    }
  } finally {
    await close();
  }

}

async function step3_callPing() {
  stepHeader(3, "Call 'ping' (free tool)");

  const agentConfig = loadAgentConfigFromEnv();
  const agentKey = process.env.AGENT_PRIVATE_KEY_BASE58!;

  const { callTool: callMcpTool, close } = await createSwigPayClient({
    agentConfig,
    agentPrivateKeyBase58: agentKey,
  });

  try {
    const result = await callMcpTool("ping", {});
    const text = (result.content as Array<{ text?: string }>)[0]?.text ?? "";
  } finally {
    await close();
  }

}

async function step4_callSolanaPrice() {
  stepHeader(4, "Call 'solana_price' (paid $0.001)");

  const agentConfig = loadAgentConfigFromEnv();
  const agentKey = process.env.AGENT_PRIVATE_KEY_BASE58!;

  const { callTool: callMcpTool, close } = await createSwigPayClient({
    agentConfig,
    agentPrivateKeyBase58: agentKey,
  });

  try {
    const result = await callMcpTool("solana_price", {});
    const text = (result.content as Array<{ text?: string }>)[0]?.text ?? "";

    if (result.paymentMade && result.paymentResponse) {
      const pr = result.paymentResponse as {
        transaction?: string;
        amount?: number;
        extensions?: { amountRaw?: number };
      };
      const txHash = pr.transaction ?? "";
      const amountRaw = Number(pr.extensions?.amountRaw ?? 0);
    }
  } finally {
    await close();
  }

}

async function step5_callExpensiveTool(): Promise<number | null> {
  stepHeader(5, "Call 'expensive_tool' ($0.50 — triggers approval)");

  const agentConfig = loadAgentConfigFromEnv();
  const toolPriceUsdc = TOOL_PRICES_USDC["expensive_tool"];
  const policy = buildSpendPolicyFromEnv();
  const policyResult = enforceSpendPolicy({
    agentId: agentConfig.agentAddress,
    amountUsdc: toolPriceUsdc,
    endpoint: DEFAULT_MCP_SERVER_URL,
    policy,
  });


  if (!policyResult.approved && policyResult.requiresHumanApproval) {
    const amountRaw = Math.round(toolPriceUsdc * USDC_RAW_MULTIPLIER);
    const paymentId = insertPayment({
      agentId: agentConfig.agentAddress,
      tool: "expensive_tool",
      endpoint: DEFAULT_MCP_SERVER_URL,
      amountUsdc: toolPriceUsdc,
      amountRaw,
      txHash: "",
      status: "pending_approval",
      createdAt: new Date().toISOString(),
      explorerUrl: "",
      toolArgs: JSON.stringify({}),
    });


    return paymentId;
  }

  return null;
}

async function step6_pollForApproval(paymentId: number): Promise<boolean> {
  stepHeader(6, "Polling for Human Approval");

  const POLL_INTERVAL_MS = 2000;
  const MAX_WAIT_S = 300;
  const deadline = Date.now() + MAX_WAIT_S * 1000;
  let dots = 0;


  while (Date.now() < deadline) {
    const approved = getPendingApproval(paymentId);
    if (approved) {
      return true;
    }

    const record = getPaymentById(paymentId);
    const status = record?.status ?? "unknown";
    dots = (dots + 1) % 4;
    process.stdout.write(`\r${elapsed()}  Status: ${status} ${".".repeat(dots)}${" ".repeat(3 - dots)}`);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  return false;
}

async function step7_retryPayment(paymentId: number): Promise<string | null> {
  stepHeader(7, "Retry Payment (bypassing limits — human already approved)");

  const record = getPaymentById(paymentId);
  if (!record) {
    return null;
  }

  const retryArgs: Record<string, unknown> = record.toolArgs ? JSON.parse(record.toolArgs) : {};

  const agentConfig = loadAgentConfigFromEnv();
  agentConfig.approvalThresholdUsdc = 9999;
  agentConfig.perTxLimitUsdc = 9999;
  agentConfig.dailyLimitUsdc = 9999;

  const agentKey = process.env.AGENT_PRIVATE_KEY_BASE58!;

  const { callTool: callMcpTool, close } = await createSwigPayClient({
    agentConfig,
    agentPrivateKeyBase58: agentKey,
  });

  try {
    const result = await callMcpTool(record.tool, retryArgs);
    const text = (result.content as Array<{ text?: string }>)[0]?.text ?? "";


    if (result.paymentMade && result.paymentResponse) {
      const pr = result.paymentResponse as {
        transaction?: string;
        amount?: number;
        extensions?: { amountRaw?: number };
      };
      const txHash = pr.transaction ?? "";
      const amountRaw = Number(pr.extensions?.amountRaw ?? 0);
      return txHash;
    }

    return null;
  } finally {
    await close();
  }
}

async function killPort(port: number): Promise<void> {
  try {
    execSync(`lsof -ti:${port} 2>/dev/null | xargs kill -9 2>/dev/null`, { stdio: "ignore" });
  } catch { /* no process on port */ }
}

function waitForEndpoint(port: number, path: string, timeoutMs = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      if (Date.now() > deadline) { reject(new Error(`Timeout waiting for :${port}${path}`)); return; }
      const req = http.get(`http://localhost:${port}${path}`, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => setTimeout(check, 1000));
      req.setTimeout(2000, () => { req.destroy(); setTimeout(check, 1000); });
    };
    check();
  });
}

function spawnDetached(cmd: string, args: string[], label: string) {
  const child = spawn(cmd, args, {
    detached: true,
    stdio: "ignore",
    cwd: process.cwd(),
    env: { ...process.env },
  });
  child.unref();
}

async function startServices(): Promise<void> {
  stepHeader(0, "Start MCP Server + Dashboard");

  await killPort(4022);
  await killPort(3000);

  spawnDetached("npx", ["tsx", "apps/mcp-server/src/server.ts"], "MCP Server (:4022)");
  spawnDetached("pnpm", ["dashboard"], "Dashboard (:3000)");

  await waitForEndpoint(4022, "/health");

  await waitForEndpoint(3000, "/", 120000);

}

async function main() {

  await startServices();

  await step1_walletStatus();
  await step2_listTools();
  await step3_callPing();
  await step4_callSolanaPrice();

  const paymentId = await step5_callExpensiveTool();

  const explorerLinks: string[] = [];

  if (paymentId !== null) {
    const approved = await step6_pollForApproval(paymentId);
    if (approved) {
      const txHash = await step7_retryPayment(paymentId);
      if (txHash) {
        explorerLinks.push(buildExplorerTransactionUrl(txHash));
      }
    } else {
    }
  }


  if (explorerLinks.length > 0) {
    for (const url of explorerLinks) {
    }
  }

}

main().catch((err) => {
  console.error(`\n${elapsed()}  FATAL: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
