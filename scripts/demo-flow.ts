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
  console.log(`\n${"━".repeat(50)}`);
  console.log(`${elapsed()}  STEP ${n}: ${title}`);
  console.log(`${"━".repeat(50)}`);
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

  console.log(`${elapsed()}  Agent:    ${agentAddress ?? "NOT SET"}`);
  console.log(`${elapsed()}  Human:    ${humanAddress ?? "NOT SET"}`);
  console.log(`${elapsed()}  Multisig: ${multisigPda ?? "NOT SET"}`);
  console.log(`${elapsed()}  Vault:    ${vaultPda ?? "NOT SET"}`);
  console.log(`${elapsed()}  SpendLim: ${spendingLimitPda ?? "NOT SET"}`);

  if (!vaultPda) {
    console.log(`${elapsed()}  ⚠ No vault PDA — run 'pnpm provision' and 'pnpm tsx scripts/agent-zero-bridge.ts fund' first`);
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
    console.log(`${elapsed()}  Agent USDC balance: ${Number(agentBal.value.amount) / USDC_RAW_MULTIPLIER}`);
  } catch {
    console.log(`${elapsed()}  ⚠ Could not read agent USDC balance`);
  }

  try {
    const vaultUsdcAta = await ensureUsdcAssociatedTokenAccount({
      connection,
      payer: agentKeypair,
      owner: new PublicKey(vaultPda),
    });
    const vaultBal = await connection.getTokenAccountBalance(vaultUsdcAta);
    console.log(`${elapsed()}  Vault USDC balance: ${Number(vaultBal.value.amount) / USDC_RAW_MULTIPLIER}`);
  } catch {
    console.log(`${elapsed()}  ⚠ Could not read vault USDC balance`);
  }

  console.log(`${elapsed()}  ✅ Wallet status complete`);
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
    console.log(`${elapsed()}  Available tools (${tools.length}):`);
    for (const t of tools) {
      console.log(`       • ${t.name} — ${t.description}`);
    }
  } finally {
    await close();
  }

  console.log(`${elapsed()}  ✅ Tool list complete`);
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
    console.log(`${elapsed()}  Calling ping...`);
    const result = await callMcpTool("ping", {});
    const text = (result.content as Array<{ text?: string }>)[0]?.text ?? "";
    console.log(`${elapsed()}  Result: ${text}`);
    console.log(`${elapsed()}  Payment made: ${result.paymentMade ?? false}`);
  } finally {
    await close();
  }

  console.log(`${elapsed()}  ✅ Ping complete`);
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
    console.log(`${elapsed()}  Calling solana_price...`);
    const result = await callMcpTool("solana_price", {});
    const text = (result.content as Array<{ text?: string }>)[0]?.text ?? "";
    console.log(`${elapsed()}  Result: ${text}`);
    console.log(`${elapsed()}  Payment made: ${result.paymentMade ?? false}`);

    if (result.paymentMade && result.paymentResponse) {
      const pr = result.paymentResponse as {
        transaction?: string;
        amount?: number;
        extensions?: { amountRaw?: number };
      };
      const txHash = pr.transaction ?? "";
      const amountRaw = Number(pr.extensions?.amountRaw ?? 0);
      console.log(`${elapsed()}  Amount: ${amountRaw / USDC_RAW_MULTIPLIER} USDC`);
      console.log(`${elapsed()}  TxHash: ${txHash}`);
      console.log(`${elapsed()}  Explorer: ${buildExplorerTransactionUrl(txHash)}`);
    }
  } finally {
    await close();
  }

  console.log(`${elapsed()}  ✅ solana_price complete`);
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

  console.log(`${elapsed()}  Spend policy result: ${policyResult.reason ?? "approved"}`);

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

    console.log(`${elapsed()}  ⏳ Payment status: pending_approval`);
    console.log(`${elapsed()}  Payment ID: ${paymentId}`);
    console.log(`${elapsed()}  Amount: ${toolPriceUsdc} USDC`);
    console.log();
    console.log(`  >> Go to http://localhost:3000 and click "Approve" for payment #${paymentId}`);
    console.log(`  >> Or use: pnpm tsx scripts/agent-zero-bridge.ts retry-approved ${paymentId}`);
    console.log();

    return paymentId;
  }

  console.log(`${elapsed()}  ⚠ Policy did not require approval (threshold may be misconfigured)`);
  return null;
}

async function step6_pollForApproval(paymentId: number): Promise<boolean> {
  stepHeader(6, "Polling for Human Approval");

  const POLL_INTERVAL_MS = 2000;
  const MAX_WAIT_S = 300;
  const deadline = Date.now() + MAX_WAIT_S * 1000;
  let dots = 0;

  console.log(`${elapsed()}  Waiting for payment #${paymentId} to be approved...`);
  console.log(`${elapsed()}  (Will auto-retry once approved)\n`);

  while (Date.now() < deadline) {
    const approved = getPendingApproval(paymentId);
    if (approved) {
      console.log(`\n${elapsed()}  ✅ Payment #${paymentId} APPROVED!`);
      return true;
    }

    const record = getPaymentById(paymentId);
    const status = record?.status ?? "unknown";
    dots = (dots + 1) % 4;
    process.stdout.write(`\r${elapsed()}  Status: ${status} ${".".repeat(dots)}${" ".repeat(3 - dots)}`);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  console.log(`\n${elapsed()}  ⏰ Timed out after ${MAX_WAIT_S}s waiting for approval`);
  return false;
}

async function step7_retryPayment(paymentId: number): Promise<string | null> {
  stepHeader(7, "Retry Payment (bypassing limits — human already approved)");

  const record = getPaymentById(paymentId);
  if (!record) {
    console.log(`${elapsed()}  ⚠ Payment #${paymentId} not found in database`);
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
    console.log(`${elapsed()}  Calling expensive_tool with bypassed limits...`);
    const result = await callMcpTool(record.tool, retryArgs);
    const text = (result.content as Array<{ text?: string }>)[0]?.text ?? "";

    console.log(`${elapsed()}  Result: ${text}`);
    console.log(`${elapsed()}  Payment made: ${result.paymentMade ?? false}`);

    if (result.paymentMade && result.paymentResponse) {
      const pr = result.paymentResponse as {
        transaction?: string;
        amount?: number;
        extensions?: { amountRaw?: number };
      };
      const txHash = pr.transaction ?? "";
      const amountRaw = Number(pr.extensions?.amountRaw ?? 0);
      console.log(`${elapsed()}  Amount: ${amountRaw / USDC_RAW_MULTIPLIER} USDC`);
      console.log(`${elapsed()}  TxHash: ${txHash}`);
      console.log(`${elapsed()}  Explorer: ${buildExplorerTransactionUrl(txHash)}`);
      return txHash;
    }

    console.log(`${elapsed()}  ⚠ No payment was made (check logs above)`);
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
  console.log(`${elapsed()}  [bg] ${label} started (pid ${child.pid})`);
}

async function startServices(): Promise<void> {
  stepHeader(0, "Start MCP Server + Dashboard");

  await killPort(4022);
  await killPort(3000);
  console.log(`${elapsed()}  Cleared ports 4022 and 3000`);

  spawnDetached("npx", ["tsx", "apps/mcp-server/src/server.ts"], "MCP Server (:4022)");
  spawnDetached("pnpm", ["dashboard"], "Dashboard (:3000)");

  console.log(`${elapsed()}  Waiting for MCP server on :4022 ...`);
  await waitForEndpoint(4022, "/health");
  console.log(`${elapsed()}  MCP server is ready`);

  console.log(`${elapsed()}  Waiting for dashboard on :3000 (may take 30-60s first build) ...`);
  await waitForEndpoint(3000, "/", 120000);
  console.log(`${elapsed()}  Dashboard is ready at http://localhost:3000`);

  console.log(`${elapsed()}  ✅ Both services running`);
}

async function main() {
  console.log("\n" + "═".repeat(50));
  console.log("  SWIGPAY DEMO FLOW — Full End-to-End Walkthrough");
  console.log("═".repeat(50));
  console.log(`${elapsed()}  Started at ${new Date().toISOString()}\n`);

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
      console.log(`\n${elapsed()}  Skipping retry — payment was not approved`);
    }
  }

  console.log(`\n${"═".repeat(50)}`);
  console.log("  DEMO COMPLETE");
  console.log(`${"═".repeat(50)}`);
  console.log(`${elapsed()}  Total time: ${((Date.now() - START) / 1000).toFixed(1)}s`);

  if (explorerLinks.length > 0) {
    console.log(`\n  Explorer links:`);
    for (const url of explorerLinks) {
      console.log(`    🔗 ${url}`);
    }
  }

  console.log(`\n  MCP server still running on :4022`);
  console.log(`  Dashboard still running at http://localhost:3000\n`);
}

main().catch((err) => {
  console.error(`\n${elapsed()}  FATAL: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
