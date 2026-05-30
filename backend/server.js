const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();
const { initDb } = require("./db/database");

const app = express();
const rootDir = path.resolve(__dirname, "..");
const port = process.env.PORT || 3000;

async function startServer() {
  await initDb();
  app.use(cors());
  app.use(express.json());
  app.use(express.static(rootDir));

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", require("./routes/auth.routes"));
  app.use("/api/employees", require("./routes/employees.routes"));
  app.use("/api/vacancies", require("./routes/vacancies.routes"));
  app.use("/api/candidates", require("./routes/candidates.routes"));
  app.use("/api/payroll", require("./routes/payroll.routes"));
  app.use("/api/payslips", require("./routes/payslips.routes"));
  app.use("/api/vacations", require("./routes/vacations.routes"));
  app.use("/api/time-clock", require("./routes/time-clock.routes"));
  app.use("/api/managers", require("./routes/managers.routes"));
  app.use("/api/admins", require("./routes/admins.routes"));
  app.use("/api/reports", require("./routes/reports.routes"));

  app.get("*", (req, res) => {
    res.sendFile(path.join(rootDir, "index.html"));
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status || 500;
    res.status(status).json({ message: status === 500 ? "Erro interno do servidor." : error.message });
  });

  app.listen(port, () => {
    console.log(`RH Flow rodando em http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Falha ao iniciar o servidor:", error);
  process.exit(1);
});
