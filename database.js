import sqlite3 from 'sqlite3';
import { promisify } from 'util';

class Database {
  constructor() {
    this.db = new sqlite3.Database('./monitor.db');
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
    this.init();
  }

  async init() {
    await this.run(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        type TEXT,
        repo_name TEXT,
        actor TEXT,
        created_at TEXT,
        raw_payload TEXT,
        is_suspicious INTEGER DEFAULT 0,
        processed INTEGER DEFAULT 0
      )
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT,
        repo_name TEXT,
        event_type TEXT,
        summary_text TEXT,
        root_cause TEXT,
        impact TEXT,
        next_steps TEXT,
        created_at TEXT,
        FOREIGN KEY(event_id) REFERENCES events(id)
      )
    `);

    // Create indexes separately
    await this.run('CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_events_suspicious ON events(is_suspicious)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_summaries_created_at ON summaries(created_at)');
  }

  async saveEvent(event) {
    return this.run(`
      INSERT OR REPLACE INTO events 
      (id, type, repo_name, actor, created_at, raw_payload, is_suspicious)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      event.id,
      event.type,
      event.repo?.name || 'unknown',
      event.actor?.login || 'unknown',
      event.created_at,
      JSON.stringify(event),
      event.isSuspicious ? 1 : 0
    ]);
  }

  async saveSummary(summary) {
    return this.run(`
      INSERT INTO summaries 
      (event_id, repo_name, event_type, summary_text, root_cause, impact, next_steps, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      summary.eventId,
      summary.repoName,
      summary.eventType,
      summary.summaryText,
      summary.rootCause,
      summary.impact,
      summary.nextSteps,
      new Date().toISOString()
    ]);
  }

  async getSummaries(since = null) {
    const query = since 
      ? 'SELECT * FROM summaries WHERE created_at > ? ORDER BY created_at DESC LIMIT 50'
      : 'SELECT * FROM summaries ORDER BY created_at DESC LIMIT 50';
    
    return since ? this.all(query, [since]) : this.all(query);
  }

  async getUnprocessedEvents() {
    return this.all(`
      SELECT * FROM events 
      WHERE is_suspicious = 1 AND processed = 0 
      ORDER BY created_at DESC LIMIT 10
    `);
  }

  async markEventProcessed(eventId) {
    return this.run('UPDATE events SET processed = 1 WHERE id = ?', [eventId]);
  }
}

export default new Database(); 