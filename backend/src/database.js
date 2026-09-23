/**
 * database.js — SQLite wrapper using sql.js (pure WASM, no native build needed)
 * 
 * sql.js provides a synchronous API after async initialization.
 * We persist the database to disk after each write operation.
 */
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/study_agent.db');
const DATA_DIR = path.dirname(DB_PATH);

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let sqlDb = null;
let initPromise = null;

function saveToDisk() {
  if (!sqlDb) return;
  const data = sqlDb.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function initializeSchema() {
  sqlDb.run(`PRAGMA foreign_keys = ON;`);
  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      course TEXT,
      branch TEXT,
      semester TEXT,
      study_hours_per_day REAL DEFAULT 4,
      exam_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      code TEXT,
      difficulty TEXT DEFAULT 'medium',
      priority INTEGER DEFAULT 2,
      color TEXT DEFAULT '#3b82f6',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      difficulty TEXT DEFAULT 'medium',
      is_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      subject_id INTEGER,
      topic_id INTEGER,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      extracted_text TEXT,
      file_size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resource_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_id INTEGER NOT NULL,
      chunk_index INTEGER NOT NULL,
      chunk_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS study_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      subject_id INTEGER,
      topic_id INTEGER,
      resource_id INTEGER,
      material_type TEXT NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS flashcards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      subject_id INTEGER,
      topic_id INTEGER,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      difficulty TEXT DEFAULT 'medium',
      last_reviewed DATETIME,
      review_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      subject_id INTEGER,
      topic_id INTEGER,
      total_questions INTEGER NOT NULL,
      score INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      student_answer TEXT,
      is_correct INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS study_plan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      plan_content TEXT NOT NULL,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      subject_id INTEGER,
      topic_id INTEGER,
      hours REAL NOT NULL DEFAULT 0,
      session_date TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tutor_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      subject_id INTEGER,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  saveToDisk();
  console.log('Database initialized successfully');
}

async function getDb() {
  if (sqlDb) return sqlDb;
  if (initPromise) return initPromise;

  initPromise = initSqlJs().then(SQL => {
    let fileBuffer = null;
    if (fs.existsSync(DB_PATH)) {
      fileBuffer = fs.readFileSync(DB_PATH);
    }
    sqlDb = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();
    initializeSchema();
    return sqlDb;
  });

  return initPromise;
}

/**
 * Thin synchronous-style wrapper that matches the better-sqlite3 API used throughout the app.
 * All methods return a proxy that defers execution until the DB is ready.
 * 
 * For simplicity in this app we use a synchronous pattern with top-level await at server start.
 */
class DbWrapper {
  constructor() {
    this._db = null;
  }

  _ensureDb() {
    if (!this._db) throw new Error('Database not yet initialized. Call await db.init() first.');
    return this._db;
  }

  async init() {
    this._db = await getDb();
    return this;
  }

  /**
   * Execute a statement and return { lastInsertRowid, changes }
   */
  run(sql, ...params) {
    const d = this._ensureDb();
    d.run(sql, params.length === 1 && Array.isArray(params[0]) ? params[0] : params);
    const meta = d.exec('SELECT last_insert_rowid() as id, changes() as ch');
    const row = meta[0]?.values[0] || [0, 0];
    saveToDisk();
    return { lastInsertRowid: row[0], changes: row[1] };
  }

  /**
   * Execute a SQL and return all rows as objects.
   */
  all(sql, ...params) {
    const d = this._ensureDb();
    const stmt = d.prepare(sql);
    const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    stmt.bind(args);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  }

  /**
   * Return first row as object or undefined.
   */
  get(sql, ...params) {
    const rows = this.all(sql, ...params);
    return rows[0];
  }

  /**
   * Execute DDL/multi-statement SQL.
   */
  exec(sql) {
    const d = this._ensureDb();
    d.exec(sql);
    // Don't persist for transaction-control statements — the transaction()
    // helper calls saveToDisk() itself after COMMIT.
    const trimmed = sql.trim().toUpperCase();
    if (trimmed !== 'BEGIN' && trimmed !== 'COMMIT' && trimmed !== 'ROLLBACK') {
      saveToDisk();
    }
  }

  /**
   * Returns an object with run/all/get bound to a prepared statement.
   * Mimics better-sqlite3's prepare() API.
   */
  prepare(sql) {
    const wrapper = this;
    return {
      run: (...params) => wrapper.run(sql, ...params),
      all: (...params) => wrapper.all(sql, ...params),
      get: (...params) => wrapper.get(sql, ...params),
    };
  }

  /**
   * Transaction helper — runs all ops atomically.
   */
  transaction(fn) {
    const wrapper = this;
    return (...args) => {
      const d = wrapper._ensureDb();
      d.exec('BEGIN');
      try {
        fn(...args);
        d.exec('COMMIT');
        saveToDisk();
      } catch (e) {
        try { d.exec('ROLLBACK'); } catch (_) {}
        throw e;
      }
    };
  }

  pragma(str) {
    // no-op for compatibility; WAL not supported by sql.js
  }
}

const db = new DbWrapper();

module.exports = db;
