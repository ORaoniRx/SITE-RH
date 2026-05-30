const express = require("express");
const { getDb } = require("../db/database");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { mapCandidate, requireFields } = require("./helpers");

const router = express.Router();

const candidateQuery = `
  SELECT c.*, v.title AS vacancy_title
  FROM candidates c
  JOIN vacancies v ON v.id = c.vacancy_id
`;

router.post("/", (req, res, next) => {
  try {
    requireFields(req.body, ["name", "email", "phone", "vacancy"]);
    const db = getDb();
    const vacancy = db.prepare("SELECT id FROM vacancies WHERE slug = ? OR title = ?").get(req.body.vacancy, req.body.vacancy);
    if (!vacancy) {
      db.close();
      return res.status(400).json({ message: "Vaga nao encontrada." });
    }
    const result = db.prepare(`
      INSERT INTO candidates (name, email, phone, portfolio, summary, vacancy_id, stage, score, source)
      VALUES (?, ?, ?, ?, ?, ?, 'Triagem', 68, 'Site')
    `).run(req.body.name, req.body.email, req.body.phone, req.body.portfolio || "", req.body.summary || "", vacancy.id);
    const candidate = db.prepare(`${candidateQuery} WHERE c.id = ?`).get(result.lastInsertRowid);
    db.close();
    res.status(201).json({ candidate: mapCandidate(candidate) });
  } catch (error) {
    next(error);
  }
});

router.get("/", auth, roles("rh", "admin", "manager"), (req, res) => {
  const db = getDb();
  const candidates = db.prepare(`${candidateQuery} ORDER BY c.created_at DESC`).all().map(mapCandidate);
  db.close();
  res.json({ candidates });
});

router.get("/me", auth, roles("candidate"), (req, res) => {
  const db = getDb();
  const candidate = req.user.candidate_id ? db.prepare(`${candidateQuery} WHERE c.id = ?`).get(req.user.candidate_id) : null;
  db.close();
  res.json({ candidate: candidate ? mapCandidate(candidate) : null });
});

router.patch("/:id/stage", auth, roles("rh", "admin"), (req, res, next) => {
  try {
    requireFields(req.body, ["stage"]);
    const db = getDb();
    db.prepare("UPDATE candidates SET stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.body.stage, req.params.id);
    const candidate = db.prepare(`${candidateQuery} WHERE c.id = ?`).get(req.params.id);
    db.close();
    res.json({ candidate: mapCandidate(candidate) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
