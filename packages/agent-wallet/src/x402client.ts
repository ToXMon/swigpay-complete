/**
 * SwigPay — x402 MCP Client with Squads v4 Spend Policy
 * Wraps createx402MCPClient from @x402/mcp
 * Before paying, enforces off-chain spend policy + logs to SQLite
 */
import "dotenv/config";
import { createx402MCPClient } from "@x402/mcp";
import { SOLANA_DEVNET_CAIP2 } from "@x402/svm";
import { base58 } from "@scure/base";
import { StreamableHTTPClientTransport } from "./mcpTransport";
import {
  buildExplorerTransactionUrl,
  DEFAULT_MCP_SERVER_URL,
  USDC_RAW_MULTIPLIER,
} from "./config";
import { enforceSpendPolicy } from "./spendPolicy";
import { insertPayment, updatePaymentStatus } from "./db";
import { SquadsExactScheme } from "./squadsScheme";
import type { AgentConfig, SpendPolicy, PaymentRecord } from "./types";

export interface SwigPayClientOptions {
  agentConfig: AgentConfig;
  agentPrivateKeyBase58: string;
  mcpServerUrl?: string;
}

type X402McpClient = ReturnType<typeof createx402MCPClient>;

export interface SwigPayClient {
  client: X402McpClient;
  callTool: X402McpClient["callTool"];
  listTools: X402McpClient["listTools"];
  close: X402McpClient["close"];
  agentAddress: string;
}

export async function createSwigPayClient(options: SwigPayClientOptions): Promise<SwigPayClient> {
  const { agentConfig, agentPrivateKeyBase58, mcpServerUrl } = options;
  const serverUrl = mcpServerUrl ?? DEFAULT_MCP_SERVER_URL;


  const policy: SpendPolicy = {
    dailyLimitUsdc: agentConfig.dailyLimitUsdc,
    perTxLimitUsdc: agentConfig.perTxLimitUsdc,
    approvalThresholdUsdc: agentConfig.approvalThresholdUsdc,
    whitelistedEndpoints: agentConfig.whitelistedEndpoints,
  };

  // Create custom Squads scheme that routes payments through spendingLimitUse
  const squadsScheme = new SquadsExactScheme({
    agentPrivateKeyBase58,
    multisigPda: agentConfig.multisigPda,
    spendingLimitPda: agentConfig.spendingLimitPda,
  });

  // Create x402 MCP client — auto-pays when 402 received
  const client = createx402MCPClient({
    name: "swigpay-openclaw-agent",
    version: "1.0.0",
    schemes: [
      {
        network: SOLANA_DEVNET_CAIP2,
        client: squadsScheme,
      },
    ],
    autoPayment: true,
    onPaymentRequested: async (context) => {
      const req = context.paymentRequired.accepts?.[0];
      const amountRaw = Number(req?.amount ?? 0);
      const amountUsdc = amountRaw / USDC_RAW_MULTIPLIER;


      // Enforce spend policy before approving payment
      const policyResult = enforceSpendPolicy({
        agentId: agentConfig.agentAddress,
        amountUsdc,
        endpoint: serverUrl,
        policy,
      });

      if (!policyResult.approved) {

        // Log rejected payment
        insertPayment({
          agentId: agentConfig.agentAddress,
          tool: (context as { toolName?: string }).toolName ?? "unknown",
          endpoint: serverUrl,
          amountUsdc,
          amountRaw,
          txHash: "",
          status: policyResult.requiresHumanApproval ? "pending_approval" : "rejected",
          createdAt: new Date().toISOString(),
          explorerUrl: "",
        });

        return false; // Deny payment
      }

      return true; // Approve payment — x402/mcp handles signing + retry
    },
  });

  // Connect to MCP server
  const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
  await client.connect(transport);

  // Wrap callTool to log approved payments
  const originalCallTool = client.callTool.bind(client);
  const callToolWithLogging: SwigPayClient["callTool"] = async (toolName, args) => {
    const startTime = Date.now();
    try {
      const result = await originalCallTool(toolName, args);

      if (result.paymentMade && result.paymentResponse) {
        const paymentResponse = result.paymentResponse as {
          transaction?: string;
          amount?: number;
          extensions?: {
            amountRaw?: number;
          };
        };
        const txHash = paymentResponse.transaction ?? "";
        const amountRaw = Number(paymentResponse.extensions?.amountRaw ?? paymentResponse.amount ?? 0);
        const amountUsdc = amountRaw / USDC_RAW_MULTIPLIER;
        const explorerUrl = buildExplorerTransactionUrl(txHash);

        // Log successful payment
        const paymentId = insertPayment({
          agentId: agentConfig.agentAddress,
          tool: toolName,
          endpoint: serverUrl,
          amountUsdc,
          amountRaw,
          txHash,
          status: "approved",
          createdAt: new Date().toISOString(),
          explorerUrl,
        });

      }

      return result;
    } catch (err) {
      console.error(`[x402client] Tool call failed (${Date.now() - startTime}ms):`, err);
      throw err;
    }
  };

  return {
    client,
    callTool: callToolWithLogging,
    listTools: () => client.listTools(),
    close: () => client.close(),
    agentAddress: agentConfig.agentAddress,
  };
}
