const express = require("express");
const bcrypt = require("bcryptjs");
const { getDb } = require("../db/database");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { requireFields } = require("./helpers");

const router = express.Router();

function mapAdmin(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: "Administrador",
    status: user.status
  };
}

router.get("/", auth, roles("admin"), (req, res) => {
  const db = getDb();
  const admins = db.prepare("SELECT id, name, email, status FROM users WHERE role = 'admin' ORDER BY name").all().map(mapAdmin);
  db.close();
  res.json({ admins });
});

router.post("/", auth, roles("admin"), (req, res, next) => {
  try {
    requireFields(req.body, ["name", "email"]);
    const db = getDb();
    const passwordHash = bcrypt.hashSync(req.body.password || "123456", 10);
    const result = db.prepare("INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, 'admin', 'Ativo')").run(req.body.name, String(req.body.email).trim().toLowerCase(), passwordHash);
    const admin = db.prepare("SELECT id, name, email, status FROM users WHERE id = ?").get(result.lastInsertRowid);
    db.close();
    res.status(201).json({ admin: mapAdmin(admin) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
