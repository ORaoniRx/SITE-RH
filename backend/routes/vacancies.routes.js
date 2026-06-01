const express = require("express");
const { getDb } = require("../db/database");
const auth = require("../middleware/auth");
const roles = require("../middleware/roles");
const { mapVacancy, requireFields } = require("./helpers");

const router = express.Router();

const vacancyQuery = `
  SELECT v.*, COUNT(c.id) AS applicants
  FROM vacancies v
  LEFT JOIN candidates c ON c.vacancy_id = v.id
`;

router.get("/", async (req, res) => {
  const db = getDb();
  const vacancies = (await db.prepare(`${vacancyQuery} WHERE v.status = 'Aberta' GROUP BY v.id ORDER BY v.created_at DESC`).all()).map(mapVacancy);
  db.close();
  res.json(vacancies);
});

router.get("/public", async (req, res) => {
  const db = getDb();
  const vacancies = (await db.prepare(`${vacancyQuery} WHERE v.status = 'Aberta' GROUP BY v.id ORDER BY v.created_at DESC`).all()).map(mapVacancy);
  db.close();
  res.json({ vacancies });
});

router.get("/all", auth, roles("rh", "admin", "manager"), async (req, res) => {
  const db = getDb();
  const vacancies = (await db.prepare(`${vacancyQuery} GROUP BY v.id ORDER BY v.created_at DESC`).all()).map(mapVacancy);
  db.close();
  res.json({ vacancies });
});

router.post("/", auth, roles("rh", "admin"), async (req, res, next) => {
  try {
    requireFields(req.body, ["title", "sector", "location", "type", "level", "description"]);
    const slug = String(req.body.title).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const db = getDb();
    const result = await db.prepare(`
      INSERT INTO vacancies (slug, title, sector, location, contract_type, level, status, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(`${slug}-${Date.now()}`, req.body.title, req.body.sector, req.body.location, req.body.type, req.body.level, req.body.status || "Aberta", req.body.description);
    const vacancy = await db.prepare(`${vacancyQuery} WHERE v.id = ? GROUP BY v.id`).get(result.lastInsertRowid);
    db.close();
    res.status(201).json({ vacancy: mapVacancy(vacancy) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
