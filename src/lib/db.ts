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
  return db;
}

export function insertRequest(r: Omit<AppointmentRequest, 'id' | 'created_at' | 'updated_at' | 'status'>): number {
  const stmt = getDb().prepare(`
    INSERT INTO appointment_request
      (patient_name, patient_is_minor, guardian_name, phone, email, preferred_contact, patient_type,
       service_interest, preferred_times, message, consent_privacy, source)
    VALUES (@patient_name, @patient_is_minor, @guardian_name, @phone, @email, @preferred_contact, @patient_type,
       @service_interest, @preferred_times, @message, @consent_privacy, @source)`);
  return Number(stmt.run(r).lastInsertRowid);
}

export function listRequests(status?: Status): AppointmentRequest[] {
  const d = getDb();
  return status
    ? (d.prepare('SELECT * FROM appointment_request WHERE status = ? ORDER BY created_at DESC').all(status) as AppointmentRequest[])
    : (d.prepare('SELECT * FROM appointment_request ORDER BY created_at DESC').all() as AppointmentRequest[]);
}

export function updateStatus(id: number, status: Status): boolean {
  const res = getDb()
    .prepare("UPDATE appointment_request SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?")
    .run(status, id);
  return res.changes === 1;
}
