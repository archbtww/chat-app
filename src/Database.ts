import { Database } from "bun:sqlite";

type userRow = {
  username: string;
  password_hash: string;
};

export class DB {
  db = new Database("db.sqlite");

  constructor() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_hashes (
        username VARCHAR(255) PRIMARY KEY,
        password_hash TEXT NOT NULL
      );
    `);
    this.db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY,
        from_username TEXT NOT NULL,
        to_username TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  insertUser(username: string, hashedPassword: string) {
    const query = this.db.prepare(
      "INSERT INTO user_hashes (username, password_hash) VALUES (?, ?)",
    );
    query.run(username, hashedPassword);
  }

  getHashedPassword(username: string) {
    const query = this.db.prepare(
      "SELECT password_hash FROM user_hashes WHERE username = ? LIMIT 1",
    );
    return (query.get(username) as userRow)?.password_hash;
  }

  insertMessage(fromUsername: string, toUsername: string, message: string) {
    const query = this.db.prepare(
      "INSERT INTO messages (from_username, to_username, message) VALUES (?, ?, ?)",
    );
    const result = query.run(fromUsername, toUsername, message);

    return this.db
      .query("SELECT * FROM messages WHERE id = ?")
      .get(result.lastInsertRowid);
  }

  getConversations(fromUsername: string) {
    const query = this.db.prepare(`
    SELECT id, from_username, to_username, message, timestamp, other_user
    FROM (
      SELECT
        id,
        from_username,
        to_username,
        message,
        timestamp,
        CASE WHEN from_username = ? THEN to_username ELSE from_username END AS other_user,
        ROW_NUMBER() OVER (
          PARTITION BY CASE WHEN from_username = ? THEN to_username ELSE from_username END
          ORDER BY timestamp DESC, id DESC
        ) AS rn
      FROM messages
      WHERE from_username = ? OR to_username = ?
    )
    WHERE rn = 1
    ORDER BY timestamp DESC
  `);
    return query.all(fromUsername, fromUsername, fromUsername, fromUsername);
  }

  getMessages(user1: string, user2: string) {
    const query = this.db.prepare(
      "SELECT * FROM messages WHERE (from_username = ? AND to_username = ?) OR (from_username = ? AND to_username = ?) ORDER BY timestamp ASC",
    );
    return query.all(user1, user2, user2, user1);
  }
}
