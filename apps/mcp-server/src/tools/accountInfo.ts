/**
 * Paid tool: fetch Solana account info via RPC
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { SOLANA_RPC_URL } from "../config.js";

const RPC_URL = SOLANA_RPC_URL;
const connection = new Connection(RPC_URL, "confirmed");

export async function fetchAccountInfo(address: string): Promise<{
  address: string;
  lamports: number;
  sol: number;
  owner: string;
  executable: boolean;
  rentEpoch: number;
  dataSize: number;
  timestamp: string;
}> {
  try {
    const pubkey = new PublicKey(address);
    const info = await connection.getAccountInfo(pubkey);
    if (!info) {
      return {
        address,
        lamports: 0,
        sol: 0,
        owner: "not found",
        executable: false,
        rentEpoch: 0,
        dataSize: 0,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      address,
      lamports: info.lamports,
      sol: info.lamports / 1_000_000_000,
      owner: info.owner.toBase58(),
      executable: info.executable,
      rentEpoch: Number(info.rentEpoch),
      dataSize: info.data.length,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    throw new Error(`Failed to fetch account ${address}: ${err}`);
  }
}
