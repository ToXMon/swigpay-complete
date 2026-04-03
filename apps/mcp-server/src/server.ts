/**
 * SwigPay MCP Server — Phase 1
 * Paid MCP tools using @x402/mcp on Solana Devnet
 * Based on: https://github.com/hanzochang/x402-solana-mcp-sample
 * Port: 4022
 */
import { config as loadEnv } from "dotenv";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createPaymentWrapper, x402ResourceServer } from "@x402/mcp";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";
import { SOLANA_DEVNET_CAIP2, USDC_DEVNET_ADDRESS } from "@x402/svm";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { fetchSolanaPrice } from "./tools/solanaPrice.js";
import { fetchAccountInfo } from "./tools/accountInfo.js";
import { FACILITATOR_URL, MCP_PRICE_PER_CALL_USD, MCP_SERVER_PORT, EXPENSIVE_TOOL_PRICE_USD } from "./config.js";
import { SquadsFacilitatorClient } from "./squadsFacilitatorClient.js";

loadEnv({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

// ---- Validate env ----
const SERVER_WALLET_ADDRESS = process.env.SERVER_WALLET_ADDRESS;
const PORT = MCP_SERVER_PORT;
const PRICE = MCP_PRICE_PER_CALL_USD;

if (!SERVER_WALLET_ADDRESS) {
  console.error("❌ SERVER_WALLET_ADDRESS is required in .env");
  process.exit(1);
}


async function main() {
  // ---- x402 setup ----
  const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
  const resourceServer = new x402ResourceServer(
    new SquadsFacilitatorClient({ fallback: facilitatorClient })
  );
  resourceServer.register(SOLANA_DEVNET_CAIP2, new ExactSvmScheme());
  await resourceServer.initialize();

  const paymentAccepts = await resourceServer.buildPaymentRequirements({
    scheme: "exact",
    network: SOLANA_DEVNET_CAIP2,
    payTo: SERVER_WALLET_ADDRESS!,
    price: `$${PRICE}`,
  });

  const wrapWithPayment = createPaymentWrapper(resourceServer, { accepts: paymentAccepts });

  // ---- Expensive tool payment requirements ($0.50 = approval threshold) ----
  const expensivePaymentAccepts = await resourceServer.buildPaymentRequirements({
    scheme: "exact",
    network: SOLANA_DEVNET_CAIP2,
    payTo: SERVER_WALLET_ADDRESS!,
    price: `$${EXPENSIVE_TOOL_PRICE_USD}`,
  });

  const wrapExpensivePayment = createPaymentWrapper(resourceServer, { accepts: expensivePaymentAccepts });

  // ---- Session management ----
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  function createMcpServer(): McpServer {
    const server = new McpServer({ name: "swigpay-tools", version: "1.0.0" });

    // Free tool — health check
    server.tool("ping", "Health check (free)", {}, async () => ({
      content: [{ type: "text", text: "pong — SwigPay MCP Server is online" }],
    }));

    // Paid tool 1: SOL price ($0.001 USDC)
    server.tool(
      "solana_price",
      `Get current SOL/USDC price. Costs $${PRICE} USDC on Solana Devnet.`,
      {},
      wrapWithPayment(async () => {
        const data = await fetchSolanaPrice();
        return {
          content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
        };
      })
    );

    // Paid tool 2: Account info ($0.001 USDC)
    server.tool(
      "account_info",
      `Fetch Solana account data for an address. Costs $${PRICE} USDC on Solana Devnet.`,
      { address: z.string().describe("Solana wallet or program address (base58)") },
      wrapWithPayment(async (args: { address: string }) => {
        const data = await fetchAccountInfo(args.address);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
        };
      })
    );

    // Paid tool 3: Expensive analysis ($0.50 USDC — requires human approval)
    server.tool(
      "expensive_tool",
      `Expensive analysis tool. Costs $${EXPENSIVE_TOOL_PRICE_USD} USDC on Solana Devnet. Requires human approval via dashboard before payment executes.`,
      {},
      wrapExpensivePayment(async () => {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({
            analysis: "Comprehensive on-chain analysis completed",
            confidence: 0.95,
            timestamp: new Date().toISOString(),
            details: "Multi-factor wallet risk assessment with transaction history analysis",
          }, null, 2) }],
        };
      })
    );

    return server;
  }

  // ---- Express app ----
  const app = createMcpExpressApp();

  app.post("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    try {
      let transport: StreamableHTTPServerTransport;
      if (sessionId && transports[sessionId]) {
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid) => {
            transports[sid] = transport;
          },
        });
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            delete transports[sid];
          }
        };
        const server = createMcpServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        res.status(400).json({ jsonrpc: "2.0", error: { code: -32000, message: "No valid session" }, id: null });
        return;
      }
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error("MCP error:", err);
      if (!res.headersSent) res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null });
    }
  });

  app.get("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string;
    if (!sessionId || !transports[sessionId]) { res.status(400).send("Invalid session"); return; }
    await transports[sessionId].handleRequest(req, res);
  });

  app.delete("/mcp", async (req, res) => {
    const sessionId = req.headers["mcp-session-id"] as string;
    if (!sessionId || !transports[sessionId]) { res.status(400).send("Invalid session"); return; }
    await transports[sessionId].handleRequest(req, res);
  });

  // Health check (no payment required)
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: "swigpay-mcp", network: SOLANA_DEVNET_CAIP2, pricePerCall: `$${PRICE}`, tools: ["ping (free)", "solana_price (paid)", "account_info (paid)", "expensive_tool (paid, requires approval)"] });
  });

  app.listen(PORT, () => {
  });
}

main().catch((err) => {
  console.error("❌ Server failed:", err);
  process.exit(1);
});
