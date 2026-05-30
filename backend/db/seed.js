const bcrypt = require("bcryptjs");
const { initDb } = require("./database");

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

function reset(db) {
  db.exec(`
    DELETE FROM time_punches;
    DELETE FROM vacation_requests;
    DELETE FROM payslips;
    DELETE FROM payroll;
    DELETE FROM candidates;
    DELETE FROM users;
    DELETE FROM vacancies;
    DELETE FROM employees;
    DELETE FROM sqlite_sequence WHERE name IN ('time_punches','vacation_requests','payslips','payroll','candidates','users','vacancies','employees');
  `);
}

function run() {
  const db = initDb();
  reset(db);

  const insertEmployee = db.prepare(`
    INSERT INTO employees (name, email, role, area, status, contract_type, manager, salary_cents, admission_date)
    VALUES (@name, @email, @role, @area, @status, @contract_type, @manager, @salary_cents, @admission_date)
  `);
  employees.forEach((employee) => insertEmployee.run(employee));

  const getEmployee = db.prepare("SELECT id FROM employees WHERE email = ?");

  const insertVacancy = db.prepare(`
    INSERT INTO vacancies (slug, title, sector, location, contract_type, level, status, description)
    VALUES (@slug, @title, @sector, @location, @contract_type, @level, @status, @description)
  `);
  vacancies.forEach((vacancy) => insertVacancy.run(vacancy));

  const getVacancy = db.prepare("SELECT id FROM vacancies WHERE title = ?");
  const insertCandidate = db.prepare(`
    INSERT INTO candidates (name, email, phone, portfolio, summary, vacancy_id, stage, score, source)
    VALUES (@name, @email, @phone, @portfolio, @summary, @vacancy_id, @stage, @score, @source)
  `);
  candidates.forEach((candidate) => insertCandidate.run({ ...candidate, vacancy_id: getVacancy.get(candidate.vacancy).id }));

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, employee_id, candidate_id, status)
    VALUES (@name, @email, @password_hash, @role, @employee_id, @candidate_id, 'Ativo')
  `);

  insertUser.run({ name: "Admin Master", email: "admin@rhflow.com", password_hash: passwordHash, role: "admin", employee_id: null, candidate_id: null });
  insertUser.run({ name: "Equipe RH", email: "rh@rhflow.com", password_hash: passwordHash, role: "rh", employee_id: getEmployee.get("marina@rhflow.com").id, candidate_id: null });
  insertUser.run({ name: "Rafael Dias", email: "gestor@rhflow.com", password_hash: passwordHash, role: "manager", employee_id: null, candidate_id: null });
  insertUser.run({ name: "Marina Alves", email: "marina@rhflow.com", password_hash: passwordHash, role: "employee", employee_id: getEmployee.get("marina@rhflow.com").id, candidate_id: null });
  insertUser.run({ name: "Ana Lima", email: "candidato@rhflow.com", password_hash: passwordHash, role: "candidate", employee_id: null, candidate_id: 1 });
  insertUser.run({ name: "Seguranca RH", email: "seguranca@rhflow.com", password_hash: passwordHash, role: "admin", employee_id: null, candidate_id: null });

  const insertPayroll = db.prepare(`
    INSERT INTO payroll (employee_id, month, gross_cents, discounts_cents, net_cents, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  [
    ["marina@rhflow.com", "Maio 2026", cents(5800), cents(812), cents(4988), "Fechado"],
    ["bruno@rhflow.com", "Maio 2026", cents(9200), 0, cents(9200), "Pendente"],
    ["ana@rhflow.com", "Maio 2026", cents(6700), cents(938), cents(5762), "Fechado"]
  ].forEach(([email, month, gross, discounts, net, status]) => insertPayroll.run(getEmployee.get(email).id, month, gross, discounts, net, status));

  const marinaId = getEmployee.get("marina@rhflow.com").id;
  const insertPayslip = db.prepare(`
    INSERT INTO payslips (employee_id, month, gross_cents, discounts_cents, net_cents, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  [
    ["Maio 2026", cents(5800), cents(812), cents(4988), "Disponivel"],
    ["Abril 2026", cents(5800), cents(804), cents(4996), "Disponivel"],
    ["Marco 2026", cents(5800), cents(790), cents(5010), "Disponivel"]
  ].forEach((row) => insertPayslip.run(marinaId, ...row));

  const insertPunch = db.prepare(`
    INSERT INTO time_punches (employee_id, punch_date, entry_time, break_out_time, break_in_time, exit_time, balance_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertPunch.run(marinaId, "2026-05-28", "08:58", "12:01", "13:00", "18:02", 4);
  insertPunch.run(marinaId, "2026-05-27", "09:04", "12:08", "13:10", "18:07", -1);
  insertPunch.run(marinaId, "2026-05-26", "08:55", "12:00", "13:02", "18:01", 3);

  const insertVacation = db.prepare(`
    INSERT INTO vacation_requests (employee_id, start_date, end_date, days, note, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertVacation.run(marinaId, "2026-07-06", "2026-07-17", 12, "Periodo sugerido pelo sistema.", "Pendente");

  db.close();
  console.log("Banco de dados inicializado com dados de exemplo.");
}

run();
