// Online backup of the SQLite database, safe while the server runs.
// Usage: node scripts/backup.mjs            (writes to $BACKUP_DIR, default ./data/backups)
// Keeps the newest $BACKUP_KEEP files (default 14). Run daily, e.g. from cron on the host:
//   0 3 * * * docker compose -f /srv/3adent/docker-compose.yml exec -T web node scripts/backup.mjs
import Database from 'better-sqlite3';
import { mkdirSync, readdirSync, unlinkSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dataDir = resolve(process.env.DATA_DIR ?? './data');
const src = join(dataDir, 'app.db');
const outDir = resolve(process.env.BACKUP_DIR ?? join(dataDir, 'backups'));
const keep = Math.max(1, Number(process.env.BACKUP_KEEP ?? 14) || 14);

if (!existsSync(src)) {
  console.error(`No database at ${src}; nothing to back up.`);
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dest = join(outDir, `app-${stamp}.db`);

const db = new Database(src, { readonly: true, fileMustExist: true });
await db.backup(dest);
db.close();

// Make the copy a single self-contained file (no -wal/-shm), then verify it opens and has the table.
const check = new Database(dest);
check.pragma('journal_mode = DELETE');
const n = check.prepare('SELECT COUNT(*) AS n FROM appointment_request').get().n;
check.close();

const old = readdirSync(outDir).filter((f) => /^app-.*\.db$/.test(f)).sort().reverse().slice(keep);
for (const f of old) for (const ext of ['', '-wal', '-shm']) if (existsSync(join(outDir, f + ext))) unlinkSync(join(outDir, f + ext));
console.log(`backup ok: ${dest} (${n} requests); removed ${old.length} old backup(s)`);
