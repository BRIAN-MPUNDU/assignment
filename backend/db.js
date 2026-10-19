const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const configuredPath = process.env.DB_PATH || './noticeboard.sqlite';
const dbPath = path.isAbsolute(configuredPath)
  ? configuredPath
  : path.resolve(__dirname, configuredPath);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new sqlite3.Database(dbPath, (error) => {
  if (error) console.error('Could not open SQLite database:', error.message);
  else console.log(`SQLite database connected: ${dbPath}`);
});

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) reject(error);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => error ? reject(error) : resolve(row));
  });
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
  });
}

async function initializeDatabase() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await new Promise((resolve, reject) => db.exec(schema, (error) => error ? reject(error) : resolve()));
  const count = await get('SELECT COUNT(*) AS total FROM notices');
  console.log(`Database ready. Notice records: ${count.total}`);
}

module.exports = { db, run, get, all, initializeDatabase };
