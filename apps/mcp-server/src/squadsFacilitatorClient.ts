import { Connection } from "@solana/web3.js";
import { HTTPFacilitatorClient } from "@x402/core/server";
import type { FacilitatorClient } from "@x402/core/server";
import type {
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  SupportedResponse,
  VerifyResponse,
} from "@x402/core/types";
import { SOLANA_DEVNET_CAIP2, USDC_DEVNET_ADDRESS } from "@x402/svm";
import { SOLANA_RPC_URL } from "./config.js";

const SQUADS_PROGRAM_ID = "SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf";
const SQUADS_SETTLEMENT_KIND = "swigpay-squads-spending-limit";

type SquadsPaymentPayload = PaymentPayload & {
  payload: {
    transaction: string;
    settlement: typeof SQUADS_SETTLEMENT_KIND;
  };
};

type ParsedTransferCheckedInfo = {
  authority: string;
  destination: string;
  mint: string;
  source: string;
  tokenAmount: {
    amount: string;
    decimals: number;
    uiAmount: number | null;
    uiAmountString: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSquadsPaymentPayload(paymentPayload: PaymentPayload): paymentPayload is SquadsPaymentPayload {
  if (!isRecord(paymentPayload.payload)) {
    return false;
  }

  return (
    paymentPayload.payload.settlement === SQUADS_SETTLEMENT_KIND
    && typeof paymentPayload.payload.transaction === "string"
  );
}

function getParsedTransferCheckedInfo(instruction: unknown): ParsedTransferCheckedInfo | null {
  if (!isRecord(instruction) || instruction.program !== "spl-token") {
    return null;
  }

  const parsed = instruction.parsed;
  if (!isRecord(parsed) || parsed.type !== "transferChecked") {
    return null;
  }

  const info = parsed.info;
  if (!isRecord(info) || !isRecord(info.tokenAmount)) {
    return null;
  }

  if (
    typeof info.authority !== "string"
    || typeof info.destination !== "string"
    || typeof info.mint !== "string"
    || typeof info.source !== "string"
    || typeof info.tokenAmount.amount !== "string"
    || typeof info.tokenAmount.decimals !== "number"
    || typeof info.tokenAmount.uiAmountString !== "string"
  ) {
    return null;
  }

  return {
    authority: info.authority,
    destination: info.destination,
    mint: info.mint,
    source: info.source,
    tokenAmount: {
      amount: info.tokenAmount.amount,
      decimals: info.tokenAmount.decimals,
      uiAmount: typeof info.tokenAmount.uiAmount === "number" ? info.tokenAmount.uiAmount : null,
      uiAmountString: info.tokenAmount.uiAmountString,
    },
  };
}

export class SquadsFacilitatorClient implements FacilitatorClient {
  private readonly fallback: FacilitatorClient;
  private readonly connection: Connection;

  constructor(params: { fallback?: FacilitatorClient; rpcUrl?: string } = {}) {
    this.fallback = params.fallback ?? new HTTPFacilitatorClient();
    this.connection = new Connection(params.rpcUrl ?? SOLANA_RPC_URL, "confirmed");
  }

  async getSupported(): Promise<SupportedResponse> {
    try {
      return await this.fallback.getSupported();
    } catch (error) {
      console.error("[x402] Failed to load supported payment kinds", { error });
      throw error;
    }
  }

  async verify(paymentPayload: PaymentPayload, paymentRequirements: PaymentRequirements): Promise<VerifyResponse> {
    try {
      if (!isSquadsPaymentPayload(paymentPayload) || !this.supports(paymentRequirements)) {
        return await this.fallback.verify(paymentPayload, paymentRequirements);
      }

      const signature = paymentPayload.payload.transaction;
      const transaction = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });

      if (!transaction) {
        return {
          isValid: false,
          invalidReason: "squads_transaction_not_found",
          invalidMessage: `Transaction not found: ${signature}`,
        };
      }

      if (transaction.meta?.err) {
        return {
          isValid: false,
          invalidReason: "squads_transaction_failed",
          invalidMessage: JSON.stringify(transaction.meta.err),
        };
      }

      const messageAccounts = transaction.transaction.message.accountKeys;
      const accountAddresses = messageAccounts.map((account) => account.pubkey.toBase58());
      const hasSquadsInstruction = transaction.transaction.message.instructions.some(
        (instruction) => instruction.programId.toBase58() === SQUADS_PROGRAM_ID
      );
      const hasSpendingLimitLog = transaction.meta?.logMessages?.some(
        (log) => log.includes("Instruction: SpendingLimitUse")
      ) ?? false;

      if (!hasSquadsInstruction || !hasSpendingLimitLog) {
        return {
          isValid: false,
          invalidReason: "squads_instruction_missing",
          invalidMessage: "Transaction is not a Squads spendingLimitUse payment",
        };
      }

      if (!accountAddresses.includes(paymentRequirements.payTo)) {
        return {
          isValid: false,
          invalidReason: "squads_destination_wallet_mismatch",
          invalidMessage: `Expected destination wallet ${paymentRequirements.payTo}`,
        };
      }

      const transferInstructions = (transaction.meta?.innerInstructions ?? [])
        .flatMap((inner) => inner.instructions)
        .map(getParsedTransferCheckedInfo)
        .filter((instruction): instruction is ParsedTransferCheckedInfo => instruction !== null);

      const matchedTransfer = transferInstructions.find((instruction) => {
        if (instruction.mint !== paymentRequirements.asset) {
          return false;
        }

        if (instruction.tokenAmount.amount !== String(paymentRequirements.amount)) {
          return false;
        }

        const destinationOwnerMatches = [...(transaction.meta?.preTokenBalances ?? []), ...(transaction.meta?.postTokenBalances ?? [])]
          .some((balance) => {
            const accountAddress = accountAddresses[balance.accountIndex];
            return (
              accountAddress === instruction.destination
              && balance.mint === paymentRequirements.asset
              && balance.owner === paymentRequirements.payTo
            );
          });

        return destinationOwnerMatches;
      });

      if (!matchedTransfer) {
        return {
          isValid: false,
          invalidReason: "squads_transfer_mismatch",
          invalidMessage: `No matching transferChecked CPI found for ${paymentRequirements.amount} ${paymentRequirements.asset}`,
        };
      }

      const payer = messageAccounts.find((account) => account.signer)?.pubkey.toBase58();
      console.log("[x402] Verified Squads spendingLimitUse payment", {
        amount_usdc: Number(paymentRequirements.amount) / 1_000_000,
        tool: "paid_tool",
        txHash: signature,
        agent: payer,
      });

      return {
        isValid: true,
        payer,
      };
    } catch (error) {
      console.error("[x402] Failed to verify Squads payment", {
        error,
        network: paymentRequirements.network,
        scheme: paymentRequirements.scheme,
      });
      throw error;
    }
  }

  async settle(paymentPayload: PaymentPayload, paymentRequirements: PaymentRequirements): Promise<SettleResponse> {
    try {
      if (!isSquadsPaymentPayload(paymentPayload) || !this.supports(paymentRequirements)) {
        return await this.fallback.settle(paymentPayload, paymentRequirements);
      }

      const amountRaw = Number(paymentRequirements.amount);
      const verifyResult = await this.verify(paymentPayload, paymentRequirements);
      if (!verifyResult.isValid) {
        return {
          success: false,
          errorReason: verifyResult.invalidReason,
          errorMessage: verifyResult.invalidMessage,
          payer: verifyResult.payer,
          transaction: paymentPayload.payload.transaction,
          network: paymentRequirements.network,
          extensions: {
            amountRaw,
          },
        };
      }

      return {
        success: true,
        payer: verifyResult.payer,
        transaction: paymentPayload.payload.transaction,
        network: paymentRequirements.network,
        extensions: {
          amountRaw,
        },
      };
    } catch (error) {
      console.error("[x402] Failed to settle Squads payment", {
        error,
        network: paymentRequirements.network,
        scheme: paymentRequirements.scheme,
      });
      throw error;
    }
  }

  private supports(paymentRequirements: PaymentRequirements): boolean {
    return (
      paymentRequirements.scheme === "exact"
      && paymentRequirements.network === SOLANA_DEVNET_CAIP2
      && paymentRequirements.asset === USDC_DEVNET_ADDRESS
    );
  }
}
