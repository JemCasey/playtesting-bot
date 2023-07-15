const Database = require('better-sqlite3');
const db = new Database('database.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS server_channel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id TEXT,
    channel_id TEXT,
    type INT
  )
`);

db.exec(`
CREATE TABLE IF NOT EXISTS buzz (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id TEXT,
    question_id TEXT,
    author_id TEXT,
    user_id TEXT,
    clue_index INT,
    value INT,
    answer_given TEXT
)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS bonus_direct (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id TEXT,
    question_id TEXT,
    author_id TEXT,
    user_id TEXT,
    part INT,
    value INT,
    answer_given TEXT
)
`)