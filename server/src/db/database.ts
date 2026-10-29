import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function createDatabase(filename = process.env.DATABASE_PATH ?? 'data.sqlite') {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new Database(filename); db.pragma('foreign_keys = ON');
  db.exec(`CREATE TABLE IF NOT EXISTS students (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, phone TEXT NOT NULL, group_name TEXT NOT NULL, monthly_fee INTEGER NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE, amount INTEGER NOT NULL, paid_at TEXT NOT NULL, created_at TEXT NOT NULL);`);
  return db;
}
export type Db = ReturnType<typeof createDatabase>;
export function tashkentToday(now = new Date()): string { return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Tashkent', year:'numeric',month:'2-digit',day:'2-digit'}).format(now); }
