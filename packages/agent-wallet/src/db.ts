/**
 * SwigPay — SQLite Transaction Log
 * Records all x402 payment attempts, approvals, rejections
 */
import Database from "better-sqlite3";
import type { PaymentRecord, PaymentStatus } from "./types.ts";

// Lazy singleton with optimized settings
let _db: Database.Database | null = null;

type PaymentRow = {
  id: number;
  agent_id: string;
  tool: string;
  endpoint: string;
  amount_usdc: number;
  amount_raw: number;
  tx_hash: string;
  status: PaymentStatus;
  created_at: string;
  explorer_url: string;
};

function getDbPath() {
  return process.env.DB_PATH ?? "./swigpay.db";
}

function mapPaymentRow(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    agentId: row.agent_id,
    tool: row.tool,
    endpoint: row.endpoint,
    amountUsdc: row.amount_usdc,
    amountRaw: row.amount_raw,
    txHash: row.tx_hash,
    status: row.status,
    createdAt: row.created_at,
    explorerUrl: row.explorer_url,
  };
}

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(getDbPath());
    _db.pragma("journal_mode = WAL");
    _db.pragma("synchronous = NORMAL");
    _db.pragma("cache_size = 10000");
    _db.pragma("temp_store = MEMORY");
    _db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        agent_id TEXT NOT NULL,
        tool TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        amount_usdc REAL NOT NULL,
        amount_raw INTEGER NOT NULL,
        tx_hash TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'pending_approval',
        created_at TEXT NOT NULL,
        explorer_url TEXT NOT NULL DEFAULT ''
      );
      CREATE INDEX IF NOT EXISTS idx_payments_agent ON payments(agent_id);
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_payments_created ON payments(created_at);
    `);
  }
  return _db;
}

// Alias for imports that use `db` directly
export const db = getDb;

export function insertPayment(record: Omit<PaymentRecord, "id">): number {
  const stmt = getDb().prepare(`
    INSERT INTO payments (agent_id, tool, endpoint, amount_usdc, amount_raw, tx_hash, status, created_at, explorer_url)
    VALUES (@agentId, @tool, @endpoint, @amountUsdc, @amountRaw, @txHash, @status, @createdAt, @explorerUrl)
  `);
  const result = stmt.run({
    agentId: record.agentId,
    tool: record.tool,
    endpoint: record.endpoint,
    amountUsdc: record.amountUsdc,
    amountRaw: record.amountRaw,
    txHash: record.txHash,
    status: record.status,
    createdAt: record.createdAt,
    explorerUrl: record.explorerUrl,
  });
  return result.lastInsertRowid as number;
}

export function updatePaymentStatus(id: number, status: PaymentStatus, txHash?: string): void {
  const updates = txHash
    ? getDb().prepare("UPDATE payments SET status = ?, tx_hash = ? WHERE id = ?")
    : getDb().prepare("UPDATE payments SET status = ? WHERE id = ?");
  if (txHash) {
    updates.run(status, txHash, id);
  } else {
    updates.run(status, id);
  }
}

export function getPaymentsByAgent(agentId: string, limit = 50): PaymentRecord[] {
  const rows = getDb()
    .prepare("SELECT * FROM payments WHERE agent_id = ? ORDER BY id DESC LIMIT ?")
    .all(agentId, limit) as PaymentRow[];
  return rows.map(mapPaymentRow);
}

export function getAllPayments(limit = 100): PaymentRecord[] {
  const rows = getDb()
    .prepare("SELECT * FROM payments ORDER BY id DESC LIMIT ?")
    .all(limit) as PaymentRow[];
  return rows.map(mapPaymentRow);
}

export function getPendingPayments(): PaymentRecord[] {
  const rows = getDb()
    .prepare("SELECT * FROM payments WHERE status = 'pending_approval' ORDER BY id DESC")
    .all() as PaymentRow[];
  return rows.map(mapPaymentRow);
}

export function getSpentToday(agentId: string): number {
  const today = new Date().toISOString().split("T")[0];
  const result = getDb()
    .prepare(`
      SELECT COALESCE(SUM(amount_usdc), 0) as total
      FROM payments
      WHERE agent_id = ? AND status = 'approved' AND created_at LIKE ?
    `)
    .get(agentId, `${today}%`) as { total: number };
  return result.total;
}
