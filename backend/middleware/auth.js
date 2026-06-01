const jwt = require("jsonwebtoken");
const { getDb } = require("../db/database");

async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ message: "Login necessario." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    const db = getDb();
    const user = await db.prepare("SELECT id, name, email, role, employee_id, candidate_id, status FROM users WHERE id = ?").get(payload.id);
    
    if (!user) {
      db.close();
      return res.status(401).json({ message: "Usuario nao encontrado." });
    }
    
    if (user.status !== "Ativo") {
      db.close();
      return res.status(401).json({ message: "Usuario inativo." });
    }

    db.close();
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalido." });
  }
}

module.exports = auth;
