const express = require("express");
const { getDb } = require("../db/database");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");

const router = express.Router();

router.get("/dashboard", auth, roles("rh", "admin", "manager"), (req, res) => {
  const db = getDb();
  const activeEmployees = db.prepare("SELECT COUNT(*) AS total FROM employees WHERE status = 'Ativo'").get().total;
  const openVacancies = db.prepare("SELECT COUNT(*) AS total FROM vacancies WHERE status = 'Aberta'").get().total;
  const candidateCount = db.prepare("SELECT COUNT(*) AS total FROM candidates").get().total;
  const payrollTotal = db.prepare("SELECT COUNT(*) AS total FROM payroll").get().total;
  const payrollClosed = db.prepare("SELECT COUNT(*) AS total FROM payroll WHERE status = 'Fechado'").get().total;
  db.close();

  res.json({
    activeEmployees,
    openVacancies,
    candidateCount,
    payrollClosingPercent: payrollTotal ? Math.round((payrollClosed / payrollTotal) * 100) : 0,
    turnover: "3.2%",
    averageVacancyTimeDays: 18,
    absenteeism: "1.8%"
  });
});

module.exports = router;
