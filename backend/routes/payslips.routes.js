const express = require("express");
const { getDb } = require("../db/database");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { mapPayslip } = require("./helpers");

const router = express.Router();

router.get("/me", auth, (req, res) => {
  const employeeId = req.user.employee_id;
  if (!employeeId) return res.json({ holerites: [] });
  const db = getDb();
  const holerites = db.prepare("SELECT * FROM payslips WHERE employee_id = ? ORDER BY id DESC").all(employeeId).map(mapPayslip);
  db.close();
  res.json({ holerites });
});

router.post("/", auth, roles("rh", "admin"), (req, res) => {
  res.status(201).json({ ok: true });
});

module.exports = router;
