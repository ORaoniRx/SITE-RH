const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
require("dotenv").config();

const rootDir = path.resolve(__dirname, "../..");
const databasePath = path.resolve(rootDir, process.env.DATABASE_PATH || "backend/db/rh.sqlite");
const schemaPath = path.join(__dirname, "schema.sql");

function getDb() {
  const db = new Database(databasePath);
  db.pragma("foreign_keys = ON");
  return db;
}

function initDb() {
  const db = getDb();
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema);
  return db;
}

module.exports = { getDb, initDb, databasePath };
