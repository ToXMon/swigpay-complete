/**
 * Paid tool: fetch SOL/USDC price from Jupiter price API
 */
export async function fetchSolanaPrice(): Promise<{
  sol_usd: number;
  sol_usdc: number;
  source: string;
  timestamp: string;
}> {
  try {
    // Jupiter Price API v2 — free, no key required
    const SOL_MINT = "So11111111111111111111111111111111111111112";
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const res = await fetch(
      `https://price.jup.ag/v6/price?ids=${SOL_MINT}&vsToken=${USDC_MINT}`
    );
    if (!res.ok) throw new Error(`Jupiter API ${res.status}`);
    const data = await res.json() as { data: Record<string, { price: number }> };
    const price = data.data[SOL_MINT]?.price ?? 0;
    return {
      sol_usd: price,
      sol_usdc: price,
      source: "Jupiter Price API v2",
      timestamp: new Date().toISOString(),
    };
  } catch {
    // Fallback: CoinGecko free tier
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
      );
      const data = await res.json() as { solana: { usd: number } };
      return {
        sol_usd: data.solana.usd,
        sol_usdc: data.solana.usd,
        source: "CoinGecko (fallback)",
        timestamp: new Date().toISOString(),
      };
    } catch {
      // Last resort: return mock for demo
      return {
        sol_usd: 145.23,
        sol_usdc: 145.23,
        source: "mock (API unavailable)",
        timestamp: new Date().toISOString(),
      };
    }
  }
}
