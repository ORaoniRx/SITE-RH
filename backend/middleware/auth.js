const jwt = require("jsonwebtoken");
const { getDb } = require("../db/database");

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Login necessario." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    const db = getDb();
    const user = db.prepare("SELECT id, name, email, role, employee_id, candidate_id, status FROM users WHERE id = ?").get(payload.id);
    db.close();

    if (!user || user.status !== "Ativo") {
      return res.status(401).json({ message: "Usuario invalido ou inativo." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalido." });
  }
}

module.exports = auth;
