const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const rootDir = path.resolve(__dirname, "../..");
const schemaPath = path.join(__dirname, "schema.sql");

const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || "postgres"}:${process.env.DB_PASSWORD || "senai"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || "postgres"}`;

const pool = new Pool({ connectionString });

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

function replacePlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function prepare(sql) {
  return {
    get: async (...params) => {
      const text = replacePlaceholders(sql);
      let values = [];
      if (params.length === 1 && Array.isArray(params[0])) values = params[0];
      else if (params.length > 0) values = params;
      const result = await pool.query(text, values);
      return result.rows[0];
    },
    all: async (...params) => {
      const text = replacePlaceholders(sql);
      let values = [];
      if (params.length === 1 && Array.isArray(params[0])) values = params[0];
      else if (params.length > 0) values = params;
      const result = await pool.query(text, values);
      return result.rows;
    },
    run: async (...params) => {
      let text = replacePlaceholders(sql);
      let values = [];
      if (params.length === 1 && Array.isArray(params[0])) values = params[0];
      else if (params.length > 0) values = params;
      // If this is an INSERT and doesn't already have RETURNING, add RETURNING id
      const isInsert = /^\s*INSERT\b/i.test(text);
      if (isInsert && !/\bRETURNING\b/i.test(text)) {
        text = text + " RETURNING id";
      }
      const result = await pool.query(text, values);
      return {
        ...result,
        lastInsertRowid: result.rows[0] ? result.rows[0].id : undefined
      };
    }
  };
}

async function initDb() {
  const client = await pool.connect();
  try {
    const schema = fs.readFileSync(schemaPath, "utf8");
    console.log("Applying database schema...");
    await client.query('BEGIN');
    await client.query(schema);
    await client.query('COMMIT');
    console.log("Database schema applied.");
  } finally {
    client.release();
  }
  return {
    prepare,
    close: async () => await pool.end()
  };
}

function getDb() {
  return {
    prepare,
    close: () => {}
  };
}

module.exports = { getDb, initDb, pool };
