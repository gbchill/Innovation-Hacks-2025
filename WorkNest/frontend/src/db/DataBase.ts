import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

// Types
type TaskPriority = 'low' | 'normal' | 'high';

export interface Task {
  id: number;
  title: string;
  priority: TaskPriority;
  is_done: number;
  created_at: string;
  completed_at?: string | null;
}

export interface Event {
  id: number;
  title: string;
  datetime: string;
}

export interface FocusSession {
  id: number;
  start_time: string;
  end_time: string;
  success: number;
}

// Setup DB
const dbPath = path.join(app.getPath('userData'), 'worknest.db');
const db = new Database(dbPath);

// Tables
db.prepare(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    priority TEXT DEFAULT 'normal',
    is_done INTEGER DEFAULT 0,
    created_at TEXT,
    completed_at TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    datetime TEXT
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS focus_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time TEXT,
    end_time TEXT,
    success INTEGER
  )
`).run();

// CRUD: Focus Sessions
export function saveFocusSession(startTime: string, endTime: string, success: boolean): void {
  db.prepare(`
    INSERT INTO focus_sessions (start_time, end_time, success)
    VALUES (?, ?, ?)
  `).run(startTime, endTime, success ? 1 : 0);
}

export function getFocusSessions(): FocusSession[] {
  return db.prepare(`SELECT * FROM focus_sessions ORDER BY id DESC`).all() as FocusSession[];
}

// CRUD: Tasks
export function addTask(title: string, priority: TaskPriority = 'normal'): void {
  const createdAt = new Date().toISOString();
  db.prepare(`
    INSERT INTO tasks (title, priority, is_done, created_at)
    VALUES (?, ?, 0, ?)
  `).run(title, priority, createdAt);
}

export function markTaskDone(id: number): void {
  const completedAt = new Date().toISOString();
  db.prepare(`
    UPDATE tasks
    SET is_done = 1, completed_at = ?
    WHERE id = ?
  `).run(completedAt, id);
}

export default db;
