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

    const email = String(req.body.email).trim().toLowerCase();
    const vacancyValue = String(req.body.vacancy).trim();
    const name = String(req.body.name).trim();
    const phone = String(req.body.phone).trim();
    const linkedin = String(req.body.linkedin || "").trim();
    const portfolio = String(req.body.portfolio || "").trim();
    const summary = String(req.body.summary || "").trim();

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "E-mail invalido." });
    }

    const portfolioLinks = [portfolio, linkedin && `LinkedIn: ${linkedin}`].filter(Boolean).join(" | ");
    const db = getDb();
    const vacancy = /^\d+$/.test(vacancyValue)
      ? await db.prepare("SELECT id FROM vacancies WHERE id = ? AND status = 'Aberta'").get(Number(vacancyValue))
      : await db.prepare("SELECT id FROM vacancies WHERE (slug = ? OR title = ?) AND status = 'Aberta'").get(vacancyValue, vacancyValue);
    if (!vacancy) {
      db.close();
      return res.status(400).json({ message: "Vaga nao encontrada ou indisponivel." });
    }

    const duplicate = await db.prepare("SELECT id FROM candidates WHERE email = ? AND vacancy_id = ?").get(email, vacancy.id);
    if (duplicate) {
      db.close();
      return res.status(409).json({ message: "Ja existe candidatura para este e-mail nesta vaga." });
    }

    const result = await db.prepare(`
      INSERT INTO candidates (name, email, phone, portfolio, summary, vacancy_id, stage, score, source)
      VALUES (?, ?, ?, ?, ?, ?, 'Triagem', 68, 'Site')
    `).run(name, email, phone, portfolioLinks, summary, vacancy.id);
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
