const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const rootDir = path.resolve(__dirname, "../..");
const schemaPath = path.join(__dirname, "schema.sql");

const connectionString = process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USER || "postgres"}:${process.env.DB_PASSWORD || "23"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || "rhflow"}`;

const pool = new Pool({ connectionString });

function replacePlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function prepare(sql) {
  return {
    get: async (params = []) => {
      const text = replacePlaceholders(sql);
      const values = Array.isArray(params) ? params : params === undefined ? [] : [params];
      const result = await pool.query(text, values);
      return result.rows[0];
    },
    all: async (params = []) => {
      const text = replacePlaceholders(sql);
      const values = Array.isArray(params) ? params : params === undefined ? [] : [params];
      const result = await pool.query(text, values);
      return result.rows;
    },
    run: async (params = []) => {
      const text = replacePlaceholders(sql);
      const values = Array.isArray(params) ? params : params === undefined ? [] : [params];
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
    await client.query(schema);
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
