/**
 * SwigPay — Custom x402 Scheme that routes payments through Squads v4 spendingLimitUse
 * Instead of signing with the raw agent key, this scheme executes spendingLimitUse
 * to transfer USDC from the Squads vault to the destination.
 */
import { SchemeNetworkClient, PaymentRequirements, PaymentPayload } from "@x402/mcp";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { base58 } from "@scure/base";
import { executeSpendingLimitPayment } from "./squadsExecute.js";
import { getConnection } from "./squads.js";

export class SquadsExactScheme implements SchemeNetworkClient {
  private agentKeypair: Keypair;
  private multisigPda: string;
  private spendingLimitPda: string;
  private connection: Connection;

  get scheme() {
    return "squads-exact";
  }

  constructor(params: {
    agentPrivateKeyBase58: string;
    multisigPda: string;
    spendingLimitPda: string;
  }) {
    this.agentKeypair = Keypair.fromSecretKey(base58.decode(params.agentPrivateKeyBase58));
    this.multisigPda = params.multisigPda;
    this.spendingLimitPda = params.spendingLimitPda;
    this.connection = getConnection();
  }

  async createPaymentPayload(
    x402Version: number,
    paymentRequirements: PaymentRequirements,
    context?: any
  ): Promise<PaymentPayload> {
    console.log("[squads-scheme] Executing payment via Squads spendingLimitUse");
    console.log(`[squads-scheme] Amount: ${paymentRequirements.amount} ${paymentRequirements.asset || "USDC"}`);
    console.log(`[squads-scheme] To: ${paymentRequirements.payTo}`);

    // Convert amount from string/number to USDC float
    const amountUsdc = Number(paymentRequirements.amount) / 1_000_000; // Convert from raw units

    // Execute payment through Squads spending limit
    const { txHash } = await executeSpendingLimitPayment({
      agentKeypair: this.agentKeypair,
      multisigPda: this.multisigPda,
      spendingLimitPda: this.spendingLimitPda,
      destinationAddress: paymentRequirements.payTo,
      amountUsdc,
    });

    console.log(`[squads-scheme] Payment executed via Squads: ${txHash}`);
    return {
      x402Version,
      accepted: paymentRequirements,
      payload: {
        transaction: txHash,
        network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"
      }
    };
  }
}
