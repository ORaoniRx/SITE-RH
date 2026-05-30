const express = require("express");
const { getDb } = require("../db/database");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { mapEmployee, requireFields } = require("./helpers");

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  const db = getDb();
  const employee = req.user.employee_id
    ? await db.prepare("SELECT * FROM employees WHERE id = ?").get(req.user.employee_id)
    : await db.prepare("SELECT * FROM employees ORDER BY id LIMIT 1").get();
  db.close();
  res.json({ employee: employee ? mapEmployee(employee) : null });
});

router.get("/", auth, roles("rh", "admin", "manager"), async (req, res) => {
  const db = getDb();
  const employees = (await db.prepare("SELECT * FROM employees ORDER BY name").all()).map(mapEmployee);
  db.close();
  res.json({ employees });
});

router.post("/", auth, roles("rh", "admin"), async (req, res, next) => {
  try {
    requireFields(req.body, ["name", "role", "area", "type", "manager"]);
    const email = String(req.body.email || `${req.body.name.toLowerCase().replace(/\s+/g, ".")}@rhflow.com`).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const db = getDb();
    const result = await db.prepare(`
      INSERT INTO employees (name, email, role, area, status, contract_type, manager, salary_cents, admission_date)
      VALUES (?, ?, ?, ?, 'Ativo', ?, ?, ?, CURRENT_DATE)
    `).run(req.body.name, email, req.body.role, req.body.area, req.body.type, req.body.manager, Number(req.body.salary_cents || 0));
    const employee = await db.prepare("SELECT * FROM employees WHERE id = ?").get(result.lastInsertRowid);
    db.close();
    res.status(201).json({ employee: mapEmployee(employee) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
