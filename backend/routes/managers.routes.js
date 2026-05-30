const express = require("express");
const { getDb } = require("../db/database");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { mapEmployee } = require("./helpers");

const router = express.Router();

router.get("/", auth, roles("manager", "rh", "admin"), (req, res) => {
  const db = getDb();
  const managers = db.prepare("SELECT * FROM employees WHERE role LIKE '%Coordenador%' OR role LIKE '%Coordenadora%' OR role LIKE '%Gerente%' ORDER BY name").all().map((employee) => ({ ...mapEmployee(employee), team: 5, approvals: 2 }));
  db.close();
  res.json({ managers });
});

module.exports = router;
