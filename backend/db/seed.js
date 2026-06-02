const bcrypt = require("bcryptjs");
const { initDb, pool } = require("./database");

const passwordHash = bcrypt.hashSync("123456", 10);

function cents(value) {
  return Math.round(value * 100);
}

const employees = [
  { name: "Marina Alves", email: "marina@rhflow.com", role: "Analista de RH", area: "RH", status: "Ativo", contract_type: "CLT", manager: "Carla Souza", salary_cents: cents(5800), admission_date: "2023-02-10" },
  { name: "Bruno Lima", email: "bruno@rhflow.com", role: "Desenvolvedor Full Stack", area: "Tecnologia", status: "Ativo", contract_type: "PJ", manager: "Rafael Dias", salary_cents: cents(9200), admission_date: "2022-08-15" },
  { name: "Ana Torres", email: "ana@rhflow.com", role: "Designer de Produto", area: "Produto", status: "Ferias", contract_type: "CLT", manager: "Rafael Dias", salary_cents: cents(6700), admission_date: "2021-11-03" },
  { name: "Joao Ribeiro", email: "joao.ribeiro@rhflow.com", role: "Analista Financeiro", area: "Financeiro", status: "Ativo", contract_type: "CLT", manager: "Carla Souza", salary_cents: cents(5400), admission_date: "2024-01-22" },
  { name: "Camila Rocha", email: "camila@rhflow.com", role: "Coordenadora Comercial", area: "Comercial", status: "Ativo", contract_type: "CLT", manager: "Patricia Neves", salary_cents: cents(8100), admission_date: "2020-06-18" }
];

const vacancies = [
  { slug: "ux", title: "UX Designer", sector: "Produto", location: "Remoto", contract_type: "CLT", level: "Pleno", status: "Aberta", description: "Pesquisa, prototipos e melhoria da experiencia do colaborador." },
  { slug: "dev", title: "Desenvolvedor Full Stack", sector: "Tecnologia", location: "Hibrido", contract_type: "PJ", level: "Senior", status: "Aberta", description: "Desenvolvimento web, APIs e integracoes com sistemas internos." },
  { slug: "rh", title: "Analista de RH", sector: "Pessoas", location: "Presencial", contract_type: "CLT", level: "Junior", status: "Aberta", description: "Apoio em recrutamento, admissao, beneficios e comunicacao interna." },
  { slug: "finance", title: "Assistente Financeiro", sector: "Financeiro", location: "Hibrido", contract_type: "CLT", level: "Junior", status: "Pausada", description: "Rotinas financeiras, conferencia de folha e suporte a pagamentos." }
];

const candidates = [
  { name: "Ana Lima", email: "ana.lima@email.com", phone: "11999990001", portfolio: "linkedin.com/in/analima", summary: "Experiencia com discovery e prototipacao.", vacancy: "UX Designer", stage: "Triagem", score: 84, source: "LinkedIn" },
  { name: "Miguel Santos", email: "miguel@email.com", phone: "11999990002", portfolio: "github.com/miguel", summary: "Full stack com foco em APIs.", vacancy: "Desenvolvedor Full Stack", stage: "Entrevista", score: 91, source: "Indicacao" },
  { name: "Rafa Costa", email: "rafa@email.com", phone: "11999990003", portfolio: "linkedin.com/in/rafa", summary: "Rotinas de DP e recrutamento.", vacancy: "Analista de RH", stage: "Teste", score: 76, source: "Site" },
  { name: "Bianca Melo", email: "bianca@email.com", phone: "11999990004", portfolio: "behance.net/bianca", summary: "Produto, UX writing e pesquisa.", vacancy: "UX Designer", stage: "Proposta", score: 88, source: "Site" }
];

async function reset(client) {
  await client.query(`
    DELETE FROM time_punches;
    DELETE FROM vacation_requests;
    DELETE FROM payslips;
    DELETE FROM payroll;
    DELETE FROM users;
    DELETE FROM candidates;
    DELETE FROM vacancies;
    DELETE FROM employees;
  `);
}

async function run() {
  await initDb();
  const client = await pool.connect();
  try {
    await reset(client);

    const insertEmployeeText = `
      INSERT INTO employees (name, email, role, area, status, contract_type, manager, salary_cents, admission_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    const employeeIds = {};

    for (const employee of employees) {
      const result = await client.query(insertEmployeeText, [
        employee.name,
        employee.email,
        employee.role,
        employee.area,
        employee.status,
        employee.contract_type,
        employee.manager,
        employee.salary_cents,
        employee.admission_date
      ]);
      employeeIds[employee.email] = result.rows[0].id;
    }

    const insertVacancyText = `
      INSERT INTO vacancies (slug, title, sector, location, contract_type, level, status, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    const vacancyIds = {};

    for (const vacancy of vacancies) {
      const result = await client.query(insertVacancyText, [
        vacancy.slug,
        vacancy.title,
        vacancy.sector,
        vacancy.location,
        vacancy.contract_type,
        vacancy.level,
        vacancy.status,
        vacancy.description
      ]);
      vacancyIds[vacancy.title] = result.rows[0].id;
    }

    const insertCandidateText = `
      INSERT INTO candidates (name, email, phone, portfolio, summary, vacancy_id, stage, score, source)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    const candidateIds = {};

    for (const candidate of candidates) {
      const result = await client.query(insertCandidateText, [
        candidate.name,
        candidate.email,
        candidate.phone,
        candidate.portfolio,
        candidate.summary,
        vacancyIds[candidate.vacancy],
        candidate.stage,
        candidate.score,
        candidate.source
      ]);
      candidateIds[candidate.email] = result.rows[0].id;
    }

    const insertUserText = `
      INSERT INTO users (name, email, password_hash, role, employee_id, candidate_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'Ativo')
    `;
    await client.query(insertUserText, ["Admin Master", "admin@rhflow.com", passwordHash, "admin", null, null]);
    await client.query(insertUserText, ["Equipe RH", "rh@rhflow.com", passwordHash, "rh", employeeIds["marina@rhflow.com"], null]);
    await client.query(insertUserText, ["Rafael Dias", "gestor@rhflow.com", passwordHash, "manager", null, null]);
    await client.query(insertUserText, ["Marina Alves", "marina@rhflow.com", passwordHash, "employee", employeeIds["marina@rhflow.com"], null]);
    await client.query(insertUserText, ["Ana Lima", "candidato@rhflow.com", passwordHash, "candidate", null, candidateIds["ana.lima@email.com"]]);
    await client.query(insertUserText, ["Seguranca RH", "seguranca@rhflow.com", passwordHash, "admin", null, null]);

    const insertPayrollText = `
      INSERT INTO payroll (employee_id, month, gross_cents, discounts_cents, net_cents, status)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await client.query(insertPayrollText, [employeeIds["marina@rhflow.com"], "Maio 2026", cents(5800), cents(812), cents(4988), "Fechado"]);
    await client.query(insertPayrollText, [employeeIds["bruno@rhflow.com"], "Maio 2026", cents(9200), 0, cents(9200), "Pendente"]);
    await client.query(insertPayrollText, [employeeIds["ana@rhflow.com"], "Maio 2026", cents(6700), cents(938), cents(5762), "Fechado"]);

    const insertPayslipText = `
      INSERT INTO payslips (employee_id, month, gross_cents, discounts_cents, net_cents, status)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await client.query(insertPayslipText, [employeeIds["marina@rhflow.com"], "Maio 2026", cents(5800), cents(812), cents(4988), "Disponivel"]);
    await client.query(insertPayslipText, [employeeIds["marina@rhflow.com"], "Abril 2026", cents(5800), cents(804), cents(4996), "Disponivel"]);
    await client.query(insertPayslipText, [employeeIds["marina@rhflow.com"], "Marco 2026", cents(5800), cents(790), cents(5010), "Disponivel"]);

    const insertPunchText = `
      INSERT INTO time_punches (employee_id, punch_date, entry_time, break_out_time, break_in_time, exit_time, balance_minutes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await client.query(insertPunchText, [employeeIds["marina@rhflow.com"], "2026-05-28", "08:58", "12:01", "13:00", "18:02", 4]);
    await client.query(insertPunchText, [employeeIds["marina@rhflow.com"], "2026-05-27", "09:04", "12:08", "13:10", "18:07", -1]);
    await client.query(insertPunchText, [employeeIds["marina@rhflow.com"], "2026-05-26", "08:55", "12:00", "13:02", "18:01", 3]);

    const insertVacationText = `
      INSERT INTO vacation_requests (employee_id, start_date, end_date, days, note, status)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await client.query(insertVacationText, [employeeIds["marina@rhflow.com"], "2026-07-06", "2026-07-17", 12, "Periodo sugerido pelo sistema.", "Pendente"]);

    console.log("Banco de dados inicializado com dados de exemplo.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  console.error("Erro ao executar seed:", error);
  process.exit(1);
});
