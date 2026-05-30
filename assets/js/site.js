const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("rhflow_token");
}

function setToken(token) {
  localStorage.setItem("rhflow_token", token);
}

function clearToken() {
  localStorage.removeItem("rhflow_token");
}

function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || "Erro na comunicacao com servidor.");
    error.response = data;
    throw error;
  }
  return data;
}

function showNotice(message) {
  window.alert(message);
}

function setActiveNav() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-nav a").forEach(function (link) {
    const href = link.getAttribute("href");
    link.classList.toggle("active", href === currentPage || (href === "index.html" && currentPage === ""));
  });
}

async function loadUserInfo() {
  if (!getToken()) return null;
  try {
    const data = await apiFetch("/auth/me");
    return data.user;
  } catch (error) {
    clearToken();
    return null;
  }
}

function addNavToggle() {
  const button = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (!button || !nav) return;
  button.addEventListener("click", function () {
    const expanded = this.getAttribute("aria-expanded") === "true";
    this.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("open");
  });
}

async function init() {
  addNavToggle();
  setActiveNav();
  const user = await loadUserInfo();

  const path = window.location.pathname.split("/").pop() || "index.html";
  switch (path) {
    case "vagas.html":
      return loadVagasPage();
    case "cadastro-candidato.html":
      return initCandidateSignup();
    case "login.html":
      return initLoginPage();
    case "rh-dashboard.html":
      return loadRhDashboard();
    case "rh-funcionarios.html":
      return loadRhFuncionarios();
    case "rh-folha.html":
      return loadRhFolha();
    case "rh-recrutamento.html":
      return loadRhRecrutamento();
    case "rh-relatorios.html":
      return loadRhRelatorios();
    case "func-perfil.html":
      return loadFuncionarioPerfil();
    case "func-holerites.html":
      return loadFuncionarioHolerites();
    case "func-ferias.html":
      return loadFuncionarioFerias();
    case "func-ponto.html":
      return loadFuncionarioPonto();
    case "priv-funcionarios.html":
      return loadPrivFuncionarios();
    case "priv-gestores.html":
      return loadPrivGestores();
    case "priv-admins.html":
      return loadPrivAdmins();
    default:
      return;
  }
}

function formatMoney(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

function fillCards(selector, values) {
  document.querySelectorAll(selector).forEach((card, index) => {
    const title = card.querySelector("h3");
    const text = card.querySelector("p.muted");
    if (!title || !text || !values[index]) return;
    title.textContent = values[index].title;
    text.textContent = values[index].value;
  });
}

async function loadVagasPage() {
  try {
    const data = await apiFetch("/vacancies/public");
    const grid = document.querySelector(".card-grid");
    if (!grid) return;
    grid.innerHTML = data.vacancies.map((vacancy) => `
      <article class="small-card">
        <h3>${vacancy.title}</h3>
        <p class="muted">${vacancy.description}</p>
        <p><strong>Setor:</strong> ${vacancy.sector}</p>
        <p><strong>Local:</strong> ${vacancy.location}</p>
        <p><strong>Status:</strong> ${vacancy.status}</p>
      </article>
    `).join("");
  } catch (error) {
    showNotice(error.message);
  }
}

async function initCandidateSignup() {
  const form = document.querySelector("form");
  const vacancySelect = document.querySelector("select[name='vacancy']");

  if (vacancySelect) {
    try {
      const data = await apiFetch("/vacancies/public");
      vacancySelect.innerHTML = `<option value="">Selecione</option>` + data.vacancies.map((vacancy) => `
        <option value="${vacancy.id}">${vacancy.title}</option>
      `).join("");
    } catch (error) {
      vacancySelect.innerHTML = `<option value="">${error.message}</option>`;
    }
  }

  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const body = {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      vacancy: formData.get("vacancy"),
      portfolio: formData.get("portfolio"),
      summary: formData.get("summary")
    };
    try {
      await apiFetch("/candidates", { method: "POST", body: JSON.stringify(body) });
      showNotice("Cadastro enviado com sucesso.");
      form.reset();
    } catch (error) {
      showNotice(error.message);
    }
  });
}

function initLoginPage() {
  const form = document.querySelector("form");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const body = {
      email: formData.get("email"),
      password: formData.get("password")
    };
    try {
      const data = await apiFetch("/auth/login", { method: "POST", body: JSON.stringify(body) });
      setToken(data.token);
      showNotice("Login realizado com sucesso.");
      window.location.href = "index.html";
    } catch (error) {
      showNotice(error.message);
    }
  });
}

async function loadRhDashboard() {
  try {
    const data = await apiFetch("/reports/dashboard");
    const cards = [
      { title: "Funcionários ativos", value: `${data.activeEmployees} colaboradores` },
      { title: "Vagas abertas", value: `${data.openVacancies} vagas` },
      { title: "Folha fechada", value: `${data.payrollClosingPercent}%` },
      { title: "Candidatos", value: `${data.candidateCount} no funil` }
    ];
    const grid = document.querySelector(".stats-grid");
    if (!grid) return;
    grid.innerHTML = cards.map((item) => `<article class="small-card"><h3>${item.title}</h3><p class="muted">${item.value}</p></article>`).join("");
  } catch (error) {
    showNotice(error.message);
  }
}

async function loadRhFuncionarios() {
  const tbody = document.querySelector("table tbody");
  const form = document.querySelector("form");
  if (tbody) {
    try {
      const data = await apiFetch("/employees");
      tbody.innerHTML = data.employees.map((employee) => `
        <tr>
          <td>${employee.name}</td>
          <td>${employee.area}</td>
          <td>${employee.role}</td>
          <td>${employee.status}</td>
        </tr>
      `).join("");
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="4">${error.message}</td></tr>`;
    }
  }
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const body = {
      name: formData.get("name"),
      role: formData.get("role"),
      area: formData.get("area"),
      type: formData.get("type"),
      manager: formData.get("manager"),
      salary_cents: 0
    };
    try {
      const data = await apiFetch("/employees", { method: "POST", body: JSON.stringify(body) });
      showNotice(`Funcionário ${data.employee.name} cadastrado.`);
      form.reset();
      loadRhFuncionarios();
    } catch (error) {
      showNotice(error.message);
    }
  });
}

async function loadRhFolha() {
  const tbody = document.querySelector("table tbody");
  if (!tbody) return;
  try {
    const data = await apiFetch("/payroll");
    tbody.innerHTML = data.payroll.map((row) => `
      <tr>
        <td>${row.employee}</td>
        <td>${row.month}</td>
        <td>${row.gross}</td>
        <td>${row.discounts}</td>
        <td>${row.net}</td>
        <td>${row.status}</td>
      </tr>
    `).join("");
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="6">${error.message}</td></tr>`;
  }
}

async function loadRhRecrutamento() {
  const pipeline = document.querySelector(".pipeline");
  if (!pipeline) return;
  try {
    const data = await apiFetch("/candidates");
    const groups = {};
    data.candidates.forEach((candidate) => {
      const stage = candidate.stage || "Triagem";
      groups[stage] = groups[stage] || [];
      groups[stage].push(candidate);
    });
    const stageOrder = Object.keys(groups).length ? Object.keys(groups) : ["Triagem", "Entrevista", "Teste", "Proposta"];
    pipeline.innerHTML = stageOrder.map((stage) => `
      <div class="pipeline-column">
        <h3>${stage}</h3>
        ${groups[stage] ? groups[stage].map((candidate) => `<div class="candidate-card"><strong>${candidate.name}</strong><p class="muted">${candidate.vacancy}</p></div>`).join("") : `
          <div class="candidate-card"><p class="muted">Nenhum candidato nesta etapa.</p></div>`}
      </div>
    `).join("");
  } catch (error) {
    pipeline.innerHTML = `<div class="candidate-card">${error.message}</div>`;
  }
}

async function loadRhRelatorios() {
  try {
    const data = await apiFetch("/reports/dashboard");
    const cards = [
      { title: "Turnover", value: data.turnover },
      { title: "Vagas abertas", value: `${data.openVacancies}` },
      { title: "Folha fechada", value: `${data.payrollClosingPercent}%` },
      { title: "Absenteísmo", value: data.absenteeism }
    ];
    const grid = document.querySelector(".card-grid");
    if (!grid) return;
    grid.innerHTML = cards.map((item) => `<article class="small-card"><h3>${item.title}</h3><p class="muted">${item.value}</p></article>`).join("");
  } catch (error) {
    showNotice(error.message);
  }
}

async function loadFuncionarioPerfil() {
  const cards = document.querySelectorAll(".small-card");
  try {
    const data = await apiFetch("/employees/me");
    const profile = data.employee;
    if (!profile) throw new Error("Nenhum funcionário encontrado para o usuário atual.");
    const values = [
      { title: profile.name, value: profile.email },
      { title: profile.role, value: profile.area },
      { title: profile.manager, value: profile.type },
      { title: profile.status, value: `Admissão: ${profile.admissionDate}` }
    ];
    cards.forEach((card, index) => {
      const title = card.querySelector("h3");
      const text = card.querySelector("p.muted");
      if (!title || !text || !values[index]) return;
      title.textContent = values[index].title;
      text.textContent = values[index].value;
    });
  } catch (error) {
    cards.forEach((card) => {
      const text = card.querySelector("p.muted");
      if (text) text.textContent = error.message;
    });
  }
}

async function loadFuncionarioHolerites() {
  try {
    const data = await apiFetch("/payslips/me");
    const grid = document.querySelector(".card-grid");
    if (!grid) return;
    if (!data.holerites.length) {
      grid.innerHTML = `<article class="small-card"><p class="muted">Nenhum holerite disponível.</p></article>`;
      return;
    }
    grid.innerHTML = data.holerites.map((item) => `
      <article class="small-card">
        <h3>${item.month}</h3>
        <p class="muted">${item.net} líquido • ${item.status}</p>
      </article>
    `).join("");
  } catch (error) {
    showNotice(error.message);
  }
}

async function loadFuncionarioFerias() {
  const cards = document.querySelectorAll(".small-card");
  const tbody = document.querySelector("table tbody");
  try {
    const data = await apiFetch("/vacations/me");
    if (cards.length >= 3) {
      const values = [
        { title: `${data.vacations.reduce((sum, item) => sum + item.days, 0)} dias`, value: "Saldo atual" },
        { title: data.vacations[0]?.status || "Pendente", value: "Solicitação mais recente" },
        { title: `${data.vacations.length} solicitações`, value: "Histórico" }
      ];
      cards.forEach((card, index) => {
        const title = card.querySelector("h3");
        const text = card.querySelector("p.muted");
        if (!title || !text || !values[index]) return;
        title.textContent = values[index].title;
        text.textContent = values[index].value;
      });
    }
    if (tbody) {
      tbody.innerHTML = data.vacations.map((item) => `
        <tr>
          <td>${item.startDate} a ${item.endDate}</td>
          <td>${item.days}</td>
          <td>${item.status}</td>
        </tr>
      `).join("");
    }
  } catch (error) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="3">${error.message}</td></tr>`;
  }
}

async function loadFuncionarioPonto() {
  const tbody = document.querySelector("table tbody");
  if (!tbody) return;
  try {
    const data = await apiFetch("/time-clock/me");
    tbody.innerHTML = data.punches.map((punch) => `
      <tr>
        <td>${punch.date}</td>
        <td>${punch.entry}</td>
        <td>${punch.breakOut}</td>
        <td>${punch.breakIn}</td>
        <td>${punch.exit}</td>
      </tr>
    `).join("");
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
  }
}

async function loadPrivFuncionarios() {
  const tbody = document.querySelector("table tbody");
  if (!tbody) return;
  try {
    const data = await apiFetch("/employees");
    tbody.innerHTML = data.employees.map((employee) => `
      <tr>
        <td>${employee.name}</td>
        <td>${employee.role}</td>
        <td>${employee.area}</td>
        <td>${employee.status}</td>
      </tr>
    `).join("");
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="4">${error.message}</td></tr>`;
  }
}

async function loadPrivGestores() {
  const tbody = document.querySelector("table tbody");
  if (!tbody) return;
  try {
    const data = await apiFetch("/managers");
    tbody.innerHTML = data.managers.map((manager) => `
      <tr>
        <td>${manager.name}</td>
        <td>${manager.area}</td>
        <td>${manager.role}</td>
      </tr>
    `).join("");
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="3">${error.message}</td></tr>`;
  }
}

async function loadPrivAdmins() {
  const tbody = document.querySelector("table tbody");
  if (!tbody) return;
  try {
    const data = await apiFetch("/admins");
    tbody.innerHTML = data.admins.map((admin) => `
      <tr>
        <td>${admin.name}</td>
        <td>${admin.email}</td>
        <td>${admin.status}</td>
      </tr>
    `).join("");
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="3">${error.message}</td></tr>`;
  }
}

document.addEventListener("DOMContentLoaded", init);
