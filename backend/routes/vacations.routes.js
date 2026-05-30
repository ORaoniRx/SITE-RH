const express = require("express");
const { getDb } = require("../db/database");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { mapVacation, requireFields } = require("./helpers");

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  if (!req.user.employee_id) return res.json({ vacations: [] });
  const db = getDb();
  const vacations = (await db.prepare("SELECT * FROM vacation_requests WHERE employee_id = ? ORDER BY id DESC").all(req.user.employee_id)).map(mapVacation);
  db.close();
  res.json({ vacations });
});

router.post("/", auth, roles("employee", "manager", "rh", "admin"), async (req, res, next) => {
  try {
    requireFields(req.body, ["startDate", "endDate", "days"]);
    if (!req.user.employee_id) return res.status(400).json({ message: "Usuario sem funcionario vinculado." });
    const db = getDb();
    const result = await db.prepare(`
      INSERT INTO vacation_requests (employee_id, start_date, end_date, days, note, status)
      VALUES (?, ?, ?, ?, ?, 'Pendente')
    `).run(req.user.employee_id, req.body.startDate, req.body.endDate, Number(req.body.days), req.body.note || "");
    const vacation = await db.prepare("SELECT * FROM vacation_requests WHERE id = ?").get(result.lastInsertRowid);
    db.close();
    res.status(201).json({ vacation: mapVacation(vacation) });
  } catch (error) {
    next(error);
  }
});

router.get("/", auth, roles("rh", "admin", "manager"), async (req, res) => {
  const db = getDb();
  const vacations = (await db.prepare("SELECT * FROM vacation_requests ORDER BY id DESC").all()).map(mapVacation);
  db.close();
  res.json({ vacations });
});

router.patch("/:id/approve", auth, roles("rh", "admin", "manager"), async (req, res) => {
  const db = getDb();
  await db.prepare("UPDATE vacation_requests SET status = 'Aprovada', approved_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.user.id, req.params.id);
  db.close();
  res.json({ ok: true });
});

router.patch("/:id/reject", auth, roles("rh", "admin", "manager"), async (req, res) => {
  const db = getDb();
  await db.prepare("UPDATE vacation_requests SET status = 'Rejeitada', approved_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.user.id, req.params.id);
  db.close();
  res.json({ ok: true });
});

module.exports = router;
