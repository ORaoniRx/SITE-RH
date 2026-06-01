const express = require("express");
const { getDb } = require("../db/database");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { mapCandidate, requireFields, validateEmail } = require("./helpers");

const router = express.Router();

const candidateQuery = `
  SELECT c.*, v.title AS vacancy_title
  FROM candidates c
  JOIN vacancies v ON v.id = c.vacancy_id
`;

router.post("/", async (req, res, next) => {
  try {
    requireFields(req.body, ["name", "email", "phone", "vacancy"]);
    
    // Validar email
    if (!validateEmail(req.body.email)) {
      return res.status(400).json({ message: "E-mail invalido." });
    }
    
    // Validar score se fornecido
    if (req.body.score !== undefined && req.body.score !== null) {
      const score = Number(req.body.score);
      if (isNaN(score) || score < 0 || score > 100) {
        return res.status(400).json({ message: "Score deve estar entre 0 e 100." });
      }
    }
    
    const db = getDb();
    const vacancy = await db.prepare("SELECT id FROM vacancies WHERE slug = ? OR title = ?").get(req.body.vacancy, req.body.vacancy);
    if (!vacancy) {
      db.close();
      return res.status(400).json({ message: "Vaga nao encontrada." });
    }
    const result = await db.prepare(`
      INSERT INTO candidates (name, email, phone, portfolio, summary, vacancy_id, stage, score, source)
      VALUES (?, ?, ?, ?, ?, ?, 'Triagem', ?, 'Site')
    `).run(req.body.name, req.body.email, req.body.phone, req.body.portfolio || "", req.body.summary || "", vacancy.id, req.body.score || 68);
    const candidate = await db.prepare(`${candidateQuery} WHERE c.id = ?`).get(result.lastInsertRowid);
    db.close();
    res.status(201).json({ candidate: mapCandidate(candidate) });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res) => {
  const db = getDb();
  const candidates = (await db.prepare(`${candidateQuery} ORDER BY c.created_at DESC`).all()).map(mapCandidate);
  db.close();
  res.json(candidates || []);
});

router.get("/auth/list", auth, roles("rh", "admin", "manager"), async (req, res) => {
  const db = getDb();
  const candidates = (await db.prepare(`${candidateQuery} ORDER BY c.created_at DESC`).all()).map(mapCandidate);
  db.close();
  res.json({ candidates });
});

router.get("/me", auth, roles("candidate"), async (req, res) => {
  const db = getDb();
  const candidate = req.user.candidate_id ? await db.prepare(`${candidateQuery} WHERE c.id = ?`).get(req.user.candidate_id) : null;
  db.close();
  res.json({ candidate: candidate ? mapCandidate(candidate) : null });
});

router.patch("/:id/stage", auth, roles("rh", "admin"), async (req, res, next) => {
  try {
    requireFields(req.body, ["stage"]);
    const db = getDb();
    await db.prepare("UPDATE candidates SET stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.body.stage, req.params.id);
    const candidate = await db.prepare(`${candidateQuery} WHERE c.id = ?`).get(req.params.id);
    db.close();
    res.json({ candidate: mapCandidate(candidate) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
