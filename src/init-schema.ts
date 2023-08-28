const Database = require('better-sqlite3');
const db = new Database('database.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS server_channel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id TEXT,
    channel_id TEXT,
    result_channel_id TEXT
  )
`);

db.exec(`
CREATE TABLE IF NOT EXISTS tossup (
    question_id TEXT PRIMARY KEY,
    server_id TEXT,
    author_id TEXT,
    total_characters INT,
    category TEXT,
    answer TEXT,
    thread_id TEXT
)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS bonus (
    question_id TEXT PRIMARY KEY,
    server_id TEXT,
    author_id TEXT,
    category TEXT,
    thread_id TEXT
)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS bonus_part (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id TEXT,
  part INT,
  difficulty TEXT,
  answer TEXT,
  UNIQUE (question_id, part)
)
`)

db.exec(`
CREATE TABLE IF NOT EXISTS buzz (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id TEXT,
    question_id TEXT,
    author_id TEXT,
    user_id TEXT,
    clue_index INT,
    characters_revealed INT,
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