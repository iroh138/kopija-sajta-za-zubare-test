import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const STATUSES = ['new', 'contacted', 'booked', 'closed'] as const;
export type Status = (typeof STATUSES)[number];

export interface AppointmentRequest {
  id: number;
  created_at: string;
  patient_name: string;
  patient_is_minor: number;
  guardian_name: string | null;
  phone: string;
  email: string | null;
  preferred_contact: string;
  patient_type: string;
  service_interest: string | null;
  preferred_times: string;
  message: string | null;
  urgent: number;
  consent_privacy: number;
  source: string | null;
  status: Status;
  updated_at: string;
}

let db: Database.Database | null = null;

/** Opens (and migrates) the SQLite database. DATA_DIR defaults to ./data — keep it outside the web root and back it up. */
export function getDb(): Database.Database {
  if (db) return db;
  const dir = resolve(process.env.DATA_DIR ?? './data');
  mkdirSync(dir, { recursive: true });
  db = new Database(join(dir, 'app.db'));
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointment_request (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      patient_name      TEXT NOT NULL,
      patient_is_minor  INTEGER NOT NULL,
      guardian_name     TEXT,
      phone             TEXT NOT NULL,
      email             TEXT,
      preferred_contact TEXT NOT NULL,
      patient_type      TEXT NOT NULL,
      service_interest  TEXT,
      preferred_times   TEXT NOT NULL,
      message           TEXT,
      consent_privacy   INTEGER NOT NULL CHECK (consent_privacy = 1),
      source            TEXT,
      status            TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','booked','closed')),
      updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );
    CREATE INDEX IF NOT EXISTS idx_request_status ON appointment_request(status, created_at);
  `);
  // Migration: 'urgent' added after the first release.
  const cols = db.prepare("SELECT name FROM pragma_table_info('appointment_request')").all() as { name: string }[];
  if (!cols.some((c) => c.name === 'urgent')) db.exec('ALTER TABLE appointment_request ADD COLUMN urgent INTEGER NOT NULL DEFAULT 0');
  return db;
}

export function insertRequest(r: Omit<AppointmentRequest, 'id' | 'created_at' | 'updated_at' | 'status'>): number {
  const stmt = getDb().prepare(`
    INSERT INTO appointment_request
      (patient_name, patient_is_minor, guardian_name, phone, email, preferred_contact, patient_type,
       service_interest, preferred_times, message, urgent, consent_privacy, source)
    VALUES (@patient_name, @patient_is_minor, @guardian_name, @phone, @email, @preferred_contact, @patient_type,
       @service_interest, @preferred_times, @message, @urgent, @consent_privacy, @source)`);
  return Number(stmt.run(r).lastInsertRowid);
}

export function listRequests(status?: Status): AppointmentRequest[] {
  const d = getDb();
  return status
    ? (d.prepare('SELECT * FROM appointment_request WHERE status = ? ORDER BY urgent DESC, created_at DESC').all(status) as AppointmentRequest[])
    : (d.prepare('SELECT * FROM appointment_request ORDER BY urgent DESC, created_at DESC').all() as AppointmentRequest[]);
}

export function updateStatus(id: number, status: Status): boolean {
  const res = getDb()
    .prepare("UPDATE appointment_request SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?")
    .run(status, id);
  return res.changes === 1;
}

export function deleteRequest(id: number): boolean {
  return getDb().prepare('DELETE FROM appointment_request WHERE id = ?').run(id).changes === 1;
}

/**
 * Data minimisation: requests that are finished ('booked' or 'closed') are deleted once they have not been
 * touched for REQUEST_RETENTION_DAYS (default 90). Open requests ('new', 'contacted') are never auto-deleted.
 * Runs at most once an hour, triggered by normal traffic (booking or admin), so no cron is needed.
 */
let lastPurge = 0;
export function purgeOldRequests(now = Date.now()): number {
  if (now - lastPurge < 60 * 60 * 1000) return 0;
  lastPurge = now;
  const days = Math.max(1, Number(process.env.REQUEST_RETENTION_DAYS ?? 90) || 90);
  const cutoff = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
  const res = getDb()
    .prepare("DELETE FROM appointment_request WHERE status IN ('booked','closed') AND updated_at < ?")
    .run(cutoff);
  if (res.changes) console.info(`[retention] deleted ${res.changes} finished request(s) older than ${days} days`);
  return res.changes;
}

/** Consistent online copy of the database (safe while the server is running). */
export async function backupTo(file: string): Promise<void> {
  await getDb().backup(file);
}
