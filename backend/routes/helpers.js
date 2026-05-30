function formatMoney(cents = 0) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents) / 100);
}

function formatDate(date) {
  if (!date) return "-";
  const [year, month, day] = String(date).split("-");
  return day && month && year ? `${day}/${month}/${year}` : date;
}

function formatBalance(minutes = 0) {
  if (minutes === null || minutes === undefined) return "Em aberto";
  const sign = minutes >= 0 ? "+" : "-";
  const absolute = Math.abs(Number(minutes));
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const mins = String(absolute % 60).padStart(2, "0");
  return `${sign}${hours}:${mins}`;
}

function mapEmployee(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    area: row.area,
    status: row.status,
    type: row.contract_type,
    manager: row.manager || "-",
    salary: formatMoney(row.salary_cents),
    admissionDate: formatDate(row.admission_date)
  };
}

function mapVacancy(row) {
  return {
    id: row.slug || String(row.id),
    dbId: row.id,
    title: row.title,
    sector: row.sector,
    location: row.location,
    type: row.contract_type,
    level: row.level,
    status: row.status,
    applicants: row.applicants || 0,
    description: row.description
  };
}

function mapCandidate(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    portfolio: row.portfolio,
    summary: row.summary,
    vacancy: row.vacancy_title,
    stage: row.stage,
    score: row.score,
    source: row.source
  };
}

function mapPayroll(row) {
  return {
    id: row.id,
    employee: row.employee_name,
    month: row.month,
    gross: formatMoney(row.gross_cents),
    discounts: formatMoney(row.discounts_cents),
    net: formatMoney(row.net_cents),
    status: row.status
  };
}

function mapPayslip(row) {
  return {
    id: row.id,
    month: row.month,
    gross: formatMoney(row.gross_cents),
    discounts: formatMoney(row.discounts_cents),
    net: formatMoney(row.net_cents),
    status: row.status
  };
}

function mapPunch(row) {
  return {
    id: row.id,
    date: formatDate(row.punch_date),
    entry: row.entry_time || "-",
    breakOut: row.break_out_time || "-",
    breakIn: row.break_in_time || "-",
    exit: row.exit_time || "-",
    balance: row.exit_time ? formatBalance(row.balance_minutes) : "Em aberto"
  };
}

function mapVacation(row) {
  return {
    id: row.id,
    startDate: formatDate(row.start_date),
    endDate: formatDate(row.end_date),
    days: row.days,
    note: row.note || "-",
    status: row.status
  };
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => !String(body[field] || "").trim());
  if (missing.length) {
    const error = new Error(`Campos obrigatorios: ${missing.join(", ")}.`);
    error.status = 400;
    throw error;
  }
}

module.exports = {
  formatMoney,
  formatDate,
  formatBalance,
  mapEmployee,
  mapVacancy,
  mapCandidate,
  mapPayroll,
  mapPayslip,
  mapPunch,
  mapVacation,
  requireFields
};
