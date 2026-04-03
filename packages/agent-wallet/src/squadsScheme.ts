/**
 * SwigPay — Custom x402 Scheme that routes payments through Squads v4 spendingLimitUse
 * Instead of signing with the raw agent key, this scheme executes spendingLimitUse
 * to transfer USDC from the Squads vault to the destination.
 */
import { SchemeNetworkClient, PaymentRequirements, PaymentPayload } from "@x402/mcp";
import { Keypair } from "@solana/web3.js";
import { base58 } from "@scure/base";
import { executeSpendingLimitPayment } from "./squadsExecute";

const SQUADS_SETTLEMENT_KIND = "swigpay-squads-spending-limit";

export class SquadsExactScheme implements SchemeNetworkClient {
  private agentKeypair: Keypair;
  private multisigPda: string;
  private spendingLimitPda: string;

  get scheme() {
    return "exact";
  }

  constructor(params: {
    agentPrivateKeyBase58: string;
    multisigPda: string;
    spendingLimitPda: string;
  }) {
    this.agentKeypair = Keypair.fromSecretKey(base58.decode(params.agentPrivateKeyBase58));
    this.multisigPda = params.multisigPda;
    this.spendingLimitPda = params.spendingLimitPda;
  }

  async createPaymentPayload(
    x402Version: number,
    paymentRequirements: PaymentRequirements,
    context?: unknown
  ): Promise<PaymentPayload> {
    try {

      const amountUsdc = Number(paymentRequirements.amount) / 1_000_000;
      const { txHash } = await executeSpendingLimitPayment({
        agentKeypair: this.agentKeypair,
        multisigPda: this.multisigPda,
        spendingLimitPda: this.spendingLimitPda,
        destinationAddress: paymentRequirements.payTo,
        amountUsdc,
      });

      return {
        x402Version,
        accepted: paymentRequirements,
        payload: {
          transaction: txHash,
          settlement: SQUADS_SETTLEMENT_KIND,
        },
      };
    } catch (error) {
      console.error("[squads-scheme] Failed to create Squads payment payload", {
        error,
        multisigPda: this.multisigPda,
        spendingLimitPda: this.spendingLimitPda,
        payTo: paymentRequirements.payTo,
        amount: paymentRequirements.amount,
        context,
      });
      throw error;
    }
  }
}
