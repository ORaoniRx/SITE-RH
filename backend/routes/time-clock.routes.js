const express = require("express");
const { getDb } = require("../db/database");
const auth = require("../middleware/auth");
const { mapPunch } = require("./helpers");

const router = express.Router();

router.get("/me", auth, (req, res) => {
  if (!req.user.employee_id) return res.json({ punches: [] });
  const db = getDb();
  const punches = db.prepare("SELECT * FROM time_punches WHERE employee_id = ? ORDER BY punch_date DESC LIMIT 10").all(req.user.employee_id).map(mapPunch);
  db.close();
  res.json({ punches });
});

router.post("/punch", auth, (req, res) => {
  if (!req.user.employee_id) return res.status(400).json({ message: "Usuario sem funcionario vinculado." });

  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const db = getDb();
  let punch = db.prepare("SELECT * FROM time_punches WHERE employee_id = ? AND punch_date = ?").get(req.user.employee_id, date);

  if (!punch) {
    db.prepare("INSERT INTO time_punches (employee_id, punch_date, entry_time) VALUES (?, ?, ?)").run(req.user.employee_id, date, time);
  } else if (!punch.break_out_time) {
    db.prepare("UPDATE time_punches SET break_out_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(time, punch.id);
  } else if (!punch.break_in_time) {
    db.prepare("UPDATE time_punches SET break_in_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(time, punch.id);
  } else if (!punch.exit_time) {
    db.prepare("UPDATE time_punches SET exit_time = ?, balance_minutes = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(time, punch.id);
  } else {
    db.close();
    return res.status(400).json({ message: "Ponto de hoje ja esta completo." });
  }

  punch = db.prepare("SELECT * FROM time_punches WHERE employee_id = ? AND punch_date = ?").get(req.user.employee_id, date);
  db.close();
  res.json({ punch: mapPunch(punch) });
});

module.exports = router;
