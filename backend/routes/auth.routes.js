const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../db/database");
const auth = require("../middleware/auth");
const { requireFields } = require("./helpers");

const router = express.Router();

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    employeeId: user.employee_id,
    candidateId: user.candidate_id
  };
}

router.post("/login", (req, res, next) => {
  try {
    requireFields(req.body, ["email", "password"]);
    const db = getDb();
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(String(req.body.email).trim().toLowerCase());
    db.close();

    if (!user || user.status !== "Ativo" || !bcrypt.compareSync(req.body.password, user.password_hash)) {
      return res.status(401).json({ message: "E-mail ou senha invalidos." });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "dev-secret", { expiresIn: "8h" });
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get("/me", auth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
