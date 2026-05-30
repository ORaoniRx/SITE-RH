const express = require("express");
const { getDb } = require("../db/database");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { mapPayroll } = require("./helpers");

const router = express.Router();

router.get("/", auth, roles("rh", "admin"), (req, res) => {
  const db = getDb();
  const payroll = db.prepare(`
    SELECT p.*, e.name AS employee_name
    FROM payroll p
    JOIN employees e ON e.id = p.employee_id
    ORDER BY p.id DESC
  `).all().map(mapPayroll);
  db.close();
  res.json({ payroll });
});

router.patch("/:id/status", auth, roles("rh", "admin"), (req, res) => {
  const db = getDb();
  db.prepare("UPDATE payroll SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.body.status || "Fechado", req.params.id);
  db.close();
  res.json({ ok: true });
});

module.exports = router;
