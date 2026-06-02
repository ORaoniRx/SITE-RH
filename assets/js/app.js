const state = {
  pendingVacancy: "",
  user: JSON.parse(localStorage.getItem("rhflow_user") || "null"),
  employees: [],
  vacancies: [],
  candidates: [],
  payroll: [],
  holerites: [],
  punches: [],
  managers: [],
  admins: [],
  reports: null
};

const API_BASE = "/api";

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("rhflow_token");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Erro inesperado na API.");
  }
  return data;
}

function setSession(token, user) {
  localStorage.setItem("rhflow_token", token);
  localStorage.setItem("rhflow_user", JSON.stringify(user));
  state.user = user;
  updateUserChip();
}

function logout() {
  localStorage.removeItem("rhflow_token");
  localStorage.removeItem("rhflow_user");
  state.user = null;
  updateUserChip();
  goTo("home");
  showNotice("Sessao encerrada.");
}

function updateUserChip() {
  const chip = document.querySelector(".user-chip span:last-child");
  const status = document.querySelector(".status-dot + span");
  if (chip) chip.textContent = state.user ? state.user.name : "Visitante";
  if (status) status.textContent = state.user ? "Online" : "Offline";
}

async function loadDataForView(viewName) {
  const protectedView = !["home", "sobre", "vagas", "cadastro-candidato", "vagas-abertas", "login", "login-candidato"].includes(viewName);
  try {
    if (["home", "vagas", "vagas-abertas", "cadastro-candidato"].includes(viewName)) {
      state.vacancies = (await apiFetch("/vacancies/public")).vacancies;
    }
    if (protectedView && !state.user) return;
    if (["rh-dashboard", "rh-relatorios"].includes(viewName)) state.reports = await apiFetch("/reports/dashboard");
    if (["rh-dashboard", "rh-funcionarios", "priv-funcionarios"].includes(viewName)) state.employees = (await apiFetch("/employees")).employees;
    if (["rh-dashboard", "rh-recrutamento"].includes(viewName)) state.candidates = (await apiFetch("/candidates")).candidates;
    if (viewName === "rh-folha") state.payroll = (await apiFetch("/payroll")).payroll;
    if (viewName === "func-perfil") {
      const data = await apiFetch("/employees/me");
      state.employees = data.employee ? [data.employee] : [];
    }
    if (viewName === "func-holerites") state.holerites = (await apiFetch("/payslips/me")).holerites;
    if (viewName === "func-ferias") state.vacations = (await apiFetch("/vacations/me")).vacations;
    if (viewName === "func-ponto") state.punches = (await apiFetch("/time-clock/me")).punches;
    if (viewName === "login-candidato" && state.user?.role === "candidate") {
      const data = await apiFetch("/candidates/me");
      state.candidates = data.candidate ? [data.candidate] : [];
    }
    if (viewName === "priv-gestores") state.managers = (await apiFetch("/managers")).managers;
    if (viewName === "priv-admins") state.admins = (await apiFetch("/admins")).admins;
  } catch (error) {
    showNotice(error.message);
  }
}

const areaLabels = {
  public: "Area publica",
  rh: "Area do RH",
  employee: "Area funcionario",
  private: "Area privada"
};

const viewMeta = {
  home: {
    area: "public",
    title: "Home",
    subtitle: "Portal principal para candidatos, colaboradores e equipe de RH.",
    actions: `<button class="btn btn-brand" data-go="vagas-abertas"><i class="bi bi-search"></i> Ver vagas</button><button class="btn btn-outline-secondary" data-go="login"><i class="bi bi-box-arrow-in-right"></i> Acessar portal</button>`,
    render: renderHome
  },
  sobre: {
    area: "public",
    title: "Sobre",
    subtitle: "Uma visao clara da proposta do sistema e dos modulos principais.",
    render: renderAbout
  },
  vagas: {
    area: "public",
    title: "Vagas",
    subtitle: "Lista publica de oportunidades para atrair novos candidatos.",
    actions: `<button class="btn btn-brand" data-go="cadastro-candidato"><i class="bi bi-person-plus"></i> Cadastrar candidato</button>`,
    render: renderJobs
  },
  "cadastro-candidato": {
    area: "public",
    title: "Cadastro de candidato",
    subtitle: "Formulario publico para candidatos entrarem no processo seletivo.",
    render: renderCandidateSignup
  },
  "vagas-abertas": {
    area: "public",
    title: "Vagas abertas",
    subtitle: "Busca rapida para visualizar oportunidades disponiveis.",
    render: renderOpenJobs
  },
  "login-candidato": {
    area: "public",
    title: "Login candidato",
    subtitle: "Acesso do candidato para acompanhar candidatura e etapas.",
    render: renderCandidateLogin
  },
  login: {
    area: "public",
    title: "Login",
    subtitle: "Entrada para RH, funcionarios, gestores e administradores.",
    render: renderGeneralLogin
  },
  "rh-dashboard": {
    area: "rh",
    title: "Dashboard RH",
    subtitle: "Indicadores de pessoas, folha, vagas e solicitacoes.",
    actions: `<button class="btn btn-brand" data-go="rh-recrutamento"><i class="bi bi-plus-circle"></i> Nova vaga</button>`,
    render: renderRhDashboard
  },
  "rh-funcionarios": {
    area: "rh",
    title: "Funcionarios",
    subtitle: "Gestao de pessoas, contratos, setores e status cadastral.",
    render: renderRhEmployees
  },
  "rh-folha": {
    area: "rh",
    title: "Folha de pagamento",
    subtitle: "Previa de salarios, descontos, liquidos e fechamento mensal.",
    render: renderPayroll
  },
  "rh-recrutamento": {
    area: "rh",
    title: "Recrutamento",
    subtitle: "Pipeline visual de candidatos por etapa do processo.",
    render: renderRecruiting
  },
  "rh-relatorios": {
    area: "rh",
    title: "Relatorios",
    subtitle: "Indicadores para decisao: turnover, vagas, folha e presenca.",
    render: renderReports
  },
  "func-perfil": {
    area: "employee",
    title: "Meu perfil",
    subtitle: "Dados pessoais, cargo, gestor e documentos do colaborador.",
    render: renderEmployeeProfile
  },
  "func-holerites": {
    area: "employee",
    title: "Holerites",
    subtitle: "Historico de demonstrativos mensais.",
    render: renderHolerites
  },
  "func-ferias": {
    area: "employee",
    title: "Ferias",
    subtitle: "Consulta de saldo e solicitacao de periodo de descanso.",
    render: renderVacation
  },
  "func-ponto": {
    area: "employee",
    title: "Ponto",
    subtitle: "Registro diario de entrada, pausa, retorno e saida.",
    render: renderTimeClock
  },
  "priv-funcionarios": {
    area: "private",
    title: "Funcionarios cadastrados pelo RH",
    subtitle: "Area privada para controle de acessos e cadastros oficiais.",
    render: renderPrivateEmployees
  },
  "priv-gestores": {
    area: "private",
    title: "Gestores",
    subtitle: "Controle de liderancas, times e aprovacoes pendentes.",
    render: renderManagers
  },
  "priv-admins": {
    area: "private",
    title: "Administradores",
    subtitle: "Usuarios com permissao administrativa e auditoria.",
    render: renderAdmins
  }
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function initials(name) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function statusBadge(status) {
  const statusKey = String(status).toLowerCase();
  let cls = "badge-brand";
  if (statusKey.includes("pendente") || statusKey.includes("pausada")) cls = "badge-accent";
  if (statusKey.includes("ferias")) cls = "badge-info";
  if (statusKey.includes("inativo")) cls = "badge-danger";
  return `<span class="badge-soft ${cls}">${escapeHtml(status)}</span>`;
}

function employeeRows(list = state.employees) {
  return list.map((employee) => `
    <tr data-search-item="${escapeHtml(`${employee.name} ${employee.role} ${employee.area}`)}">
      <td><span class="avatar">${initials(employee.name)}</span></td>
      <td><strong>${escapeHtml(employee.name)}</strong><br><small class="muted">${escapeHtml(employee.role)}</small></td>
      <td>${escapeHtml(employee.area)}</td>
      <td>${escapeHtml(employee.type)}</td>
      <td>${statusBadge(employee.status)}</td>
      <td>${escapeHtml(employee.manager)}</td>
    </tr>
  `).join("");
}

function vacancyCards() {
  return state.vacancies.map((job) => `
    <article class="panel-card" data-search-item="${escapeHtml(`${job.title} ${job.sector} ${job.location}`)}">
      <div class="section-title">
        <h3>${escapeHtml(job.title)}</h3>
        ${statusBadge(job.status)}
      </div>
      <p class="muted">${escapeHtml(job.description)}</p>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <span class="badge-soft badge-info"><i class="bi bi-building"></i> ${escapeHtml(job.sector)}</span>
        <span class="badge-soft badge-brand"><i class="bi bi-geo-alt"></i> ${escapeHtml(job.location)}</span>
        <span class="badge-soft badge-accent"><i class="bi bi-person-check"></i> ${escapeHtml(job.level)}</span>
      </div>
      <div class="d-flex align-items-center justify-content-between gap-2">
        <small class="muted">${job.applicants} candidatos</small>
        <button class="btn btn-sm btn-brand" data-apply="${escapeHtml(job.id)}">Candidatar</button>
      </div>
    </article>
  `).join("");
}

function renderHome() {
  return `
    <div class="hero-panel">
      <div class="row g-0">
        <div class="col-xl-7 hero-copy">
          <h2>RH completo para operar pessoas, vagas e folha.</h2>
          <p>Um front-end inicial para site de RH com area publica, area do RH, portal do funcionario e area privada de administracao.</p>
          <div class="d-flex flex-wrap gap-2 mt-4">
            <button class="btn btn-brand" data-go="rh-dashboard"><i class="bi bi-speedometer2"></i> Abrir dashboard</button>
            <button class="btn btn-outline-secondary" data-go="cadastro-candidato"><i class="bi bi-person-plus"></i> Cadastrar candidato</button>
          </div>
          <div class="quick-stat-row">
            <div class="metric-card"><span>Vagas</span><strong>${state.vacancies.filter((job) => job.status === "Aberta").length}</strong><small>Abertas agora</small></div>
            <div class="metric-card"><span>Candidatos</span><strong>${state.candidates.length}</strong><small>No funil</small></div>
            <div class="metric-card"><span>Funcionarios</span><strong>${state.employees.length}</strong><small>Cadastrados</small></div>
            <div class="metric-card"><span>Folha</span><strong>92%</strong><small>Fechamento</small></div>
          </div>
        </div>
        <div class="col-xl-5 hero-media" role="img" aria-label="Equipe em reuniao de trabalho"></div>
      </div>
    </div>
    <div class="three-col-grid">
      ${moduleCard("Area publica", "Home, sobre, vagas, cadastro de candidatos e login candidato.", "bi-globe2", "home")}
      ${moduleCard("Area do RH", "Dashboard, funcionarios, folha, recrutamento e relatorios.", "bi-clipboard-data", "rh-dashboard")}
      ${moduleCard("Area do funcionario", "Perfil, holerites, ferias e controle de ponto.", "bi-person-badge", "func-perfil")}
    </div>
  `;
}

function moduleCard(title, text, icon, view) {
  return `
    <article class="panel-card">
      <div class="section-title">
        <h3><i class="bi ${icon} text-success"></i> ${title}</h3>
      </div>
      <p class="muted">${text}</p>
      <button class="btn btn-outline-secondary btn-sm" data-go="${view}">Abrir area</button>
    </article>
  `;
}

function renderAbout() {
  return `
    <div class="three-col-grid">
      <article class="panel-card role-card">
        <h3>Objetivo</h3>
        <p class="muted">Centralizar processos de pessoas em um portal simples para candidatos, RH, funcionarios, gestores e administradores.</p>
      </article>
      <article class="panel-card role-card">
        <h3>Publico</h3>
        <p class="muted">Empresas que precisam organizar contratacoes, funcionarios, folha, ferias, ponto e relatorios em uma unica interface.</p>
      </article>
      <article class="panel-card role-card">
        <h3>Proximo passo</h3>
        <p class="muted">Depois deste front-end, a evolucao natural e conectar login, banco de dados e regras de permissao.</p>
      </article>
    </div>
    <div class="panel-card">
      <div class="section-title"><h2>Mapa do produto</h2></div>
      <div class="row g-3">
        <div class="col-md-3"><span class="badge-soft badge-brand">Publico</span><p class="mt-2 mb-0 muted">Vagas, cadastro, login e conteudo institucional.</p></div>
        <div class="col-md-3"><span class="badge-soft badge-info">RH</span><p class="mt-2 mb-0 muted">Operacao diaria, folha, pessoas e recrutamento.</p></div>
        <div class="col-md-3"><span class="badge-soft badge-accent">Funcionario</span><p class="mt-2 mb-0 muted">Perfil, documentos, ferias e ponto.</p></div>
        <div class="col-md-3"><span class="badge-soft badge-danger">Privado</span><p class="mt-2 mb-0 muted">Gestores, administradores e permissoes.</p></div>
      </div>
    </div>
  `;
}

function renderJobs() {
  return `<div class="cards-grid">${vacancyCards()}</div>`;
}

function renderOpenJobs() {
  return `
    <div class="panel-card">
      <div class="section-title">
        <h2>Oportunidades publicas</h2>
        <span class="badge-soft badge-brand">${state.vacancies.filter((job) => job.status === "Aberta").length} abertas</span>
      </div>
      <div class="table-responsive">
        <table class="table align-middle">
          <thead><tr><th>Vaga</th><th>Area</th><th>Local</th><th>Tipo</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${state.vacancies.map((job) => `
              <tr data-search-item="${escapeHtml(`${job.title} ${job.sector} ${job.location}`)}">
                <td><strong>${escapeHtml(job.title)}</strong><br><small class="muted">${escapeHtml(job.level)}</small></td>
                <td>${escapeHtml(job.sector)}</td>
                <td>${escapeHtml(job.location)}</td>
                <td>${escapeHtml(job.type)}</td>
                <td>${statusBadge(job.status)}</td>
                <td class="text-end"><button class="btn btn-sm btn-brand" data-apply="${escapeHtml(job.id)}">Candidatar</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderCandidateSignup() {
  const options = state.vacancies.map((job) => `<option value="${escapeHtml(job.title)}" ${state.pendingVacancy === job.id ? "selected" : ""}>${escapeHtml(job.title)}</option>`).join("");
  return `
    <div class="two-col-grid">
      <form class="form-card" id="candidateForm">
        <div class="section-title"><h2>Dados do candidato</h2></div>
        <div class="row g-3">
          <div class="col-md-6"><label class="form-label">Nome completo</label><input class="form-control" name="name" required></div>
          <div class="col-md-6"><label class="form-label">E-mail</label><input class="form-control" name="email" type="email" required></div>
          <div class="col-md-6"><label class="form-label">Telefone</label><input class="form-control" name="phone" required></div>
          <div class="col-md-6"><label class="form-label">Vaga desejada</label><select class="form-select" name="vacancy" required><option value="">Selecione</option>${options}</select></div>
          <div class="col-12"><label class="form-label">LinkedIn ou portfolio</label><input class="form-control" name="portfolio"></div>
          <div class="col-12"><label class="form-label">Resumo profissional</label><textarea class="form-control" rows="5" name="summary" required></textarea></div>
          <div class="col-12"><button class="btn btn-brand" type="submit"><i class="bi bi-send"></i> Enviar cadastro</button></div>
        </div>
      </form>
      <aside class="panel-card">
        <div class="section-title"><h2>Etapas</h2></div>
        ${stepList(["Cadastro recebido", "Triagem do RH", "Entrevista com gestor", "Teste tecnico ou dinamica", "Proposta e admissao"])}
      </aside>
    </div>
  `;
}

function renderCandidateLogin() {
  return `
    <div class="two-col-grid">
      <form class="form-card" id="candidateLoginForm">
        <div class="section-title"><h2>Acesso do candidato</h2></div>
        <label class="form-label">E-mail</label>
        <input class="form-control mb-3" name="email" type="email" value="candidato@rhflow.com" required>
        <label class="form-label">Senha</label>
        <input class="form-control mb-3" name="password" type="password" value="123456" required>
        <button class="btn btn-brand" type="submit"><i class="bi bi-box-arrow-in-right"></i> Entrar</button>
      </form>
      <div class="panel-card">
        <div class="section-title"><h2>Minha candidatura</h2></div>
        ${state.user?.role === "candidate" && state.candidates[0]
          ? candidateStatusCard(state.candidates[0].name, state.candidates[0].vacancy, state.candidates[0].stage, state.candidates[0].score)
          : candidateStatusCard("Ana Lima", "UX Designer", "Entrevista marcada", 72)}
      </div>
    </div>
  `;
}

function renderGeneralLogin() {
  return `
    <div class="two-col-grid">
      <form class="form-card" id="generalLoginForm">
        <div class="section-title"><h2>Entrar no sistema</h2></div>
        <label class="form-label">Perfil</label>
        <select class="form-select mb-3" name="profile" required>
          <option>RH</option>
          <option>Funcionario</option>
          <option>Gestor</option>
          <option>Administrador</option>
        </select>
        <label class="form-label">E-mail</label>
        <input class="form-control mb-3" name="email" type="email" value="rh@rhflow.com" required>
        <label class="form-label">Senha</label>
        <input class="form-control mb-3" name="password" type="password" value="123456" required>
        <button class="btn btn-brand" type="submit"><i class="bi bi-shield-lock"></i> Acessar</button>
      </form>
      <div class="panel-card">
        <div class="section-title"><h2>Acessos de exemplo</h2></div>
        <div class="d-grid gap-2">
          <button class="btn btn-outline-secondary text-start" data-go="rh-dashboard"><i class="bi bi-speedometer2"></i> Entrar como RH</button>
          <button class="btn btn-outline-secondary text-start" data-go="func-perfil"><i class="bi bi-person-badge"></i> Entrar como funcionario</button>
          <button class="btn btn-outline-secondary text-start" data-go="priv-admins"><i class="bi bi-person-gear"></i> Entrar como administrador</button>
          <button class="btn btn-outline-danger text-start" id="logoutBtn"><i class="bi bi-box-arrow-left"></i> Sair</button>
        </div>
      </div>
    </div>
  `;
}

function renderRhDashboard() {
  return `
    <div class="metric-grid">
      <div class="metric-card"><span>Funcionarios ativos</span><strong>${state.employees.filter((e) => e.status !== "Inativo").length}</strong><small>+2 este mes</small></div>
      <div class="metric-card"><span>Vagas abertas</span><strong>${state.vacancies.filter((v) => v.status === "Aberta").length}</strong><small>${state.candidates.length} candidatos no funil</small></div>
      <div class="metric-card"><span>Folha</span><strong>92%</strong><small>Fechamento de maio</small></div>
      <div class="metric-card"><span>Solicitacoes</span><strong>11</strong><small>Ferias, ponto e documentos</small></div>
    </div>
    <div class="two-col-grid">
      <div class="panel-card">
        <div class="section-title"><h2>Distribuicao por area</h2></div>
        ${progressItem("Tecnologia", 42, "bg-success")}
        ${progressItem("Operacoes", 30, "bg-primary")}
        ${progressItem("Comercial", 18, "bg-warning")}
        ${progressItem("Financeiro", 10, "bg-danger")}
      </div>
      <div class="panel-card">
        <div class="section-title"><h2>Alertas</h2></div>
        ${stepList(["3 contratos aguardando assinatura", "4 candidatos aguardando retorno", "Folha de 2 funcionarios pendente", "6 solicitacoes de ferias para aprovar"])}
      </div>
    </div>
  `;
}

function renderRhEmployees() {
  return `
    <div class="two-col-grid">
      <div class="panel-card">
        <div class="section-title"><h2>Funcionarios</h2><span class="badge-soft badge-brand">${state.employees.length} cadastros</span></div>
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th></th><th>Nome</th><th>Area</th><th>Tipo</th><th>Status</th><th>Gestor</th></tr></thead>
            <tbody>${employeeRows()}</tbody>
          </table>
        </div>
      </div>
      <form class="form-card" id="employeeForm">
        <div class="section-title"><h2>Novo funcionario</h2></div>
        <label class="form-label">Nome</label><input class="form-control mb-3" name="name" required>
        <label class="form-label">Cargo</label><input class="form-control mb-3" name="role" required>
        <label class="form-label">Area</label><input class="form-control mb-3" name="area" required>
        <label class="form-label">Tipo de contrato</label><select class="form-select mb-3" name="type"><option>CLT</option><option>PJ</option><option>Estagio</option></select>
        <label class="form-label">Gestor</label><input class="form-control mb-3" name="manager" required>
        <button class="btn btn-brand" type="submit"><i class="bi bi-person-plus"></i> Cadastrar</button>
      </form>
    </div>
  `;
}

function renderPayroll() {
  return `
    <div class="metric-grid">
      <div class="metric-card"><span>Total bruto</span><strong>R$ 21,7k</strong><small>Competencia maio</small></div>
      <div class="metric-card"><span>Descontos</span><strong>R$ 2,5k</strong><small>INSS, IR e beneficios</small></div>
      <div class="metric-card"><span>Liquido</span><strong>R$ 19,9k</strong><small>Previsto para pagamento</small></div>
      <div class="metric-card"><span>Status</span><strong>92%</strong><small>Fechamento</small></div>
    </div>
    <div class="panel-card">
      <div class="section-title"><h2>Resumo da folha</h2><button class="btn btn-sm btn-accent" data-notice="Folha exportada em modo demonstracao."><i class="bi bi-download"></i> Exportar</button></div>
      <div class="table-responsive">
        <table class="table">
          <thead><tr><th>Funcionario</th><th>Mes</th><th>Bruto</th><th>Descontos</th><th>Liquido</th><th>Status</th></tr></thead>
          <tbody>${state.payroll.map((row) => `
            <tr data-search-item="${escapeHtml(`${row.employee} ${row.month} ${row.status}`)}">
              <td><strong>${escapeHtml(row.employee)}</strong></td><td>${escapeHtml(row.month)}</td><td>${escapeHtml(row.gross)}</td><td>${escapeHtml(row.discounts)}</td><td>${escapeHtml(row.net)}</td><td>${statusBadge(row.status)}</td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderRecruiting() {
  const stages = ["Triagem", "Entrevista", "Teste", "Proposta"];
  return `
    <div class="pipeline">
      ${stages.map((stage) => `
        <div class="pipeline-column">
          <div class="section-title"><h3>${stage}</h3><span class="badge-soft badge-info">${state.candidates.filter((c) => c.stage === stage).length}</span></div>
          ${state.candidates.filter((candidate) => candidate.stage === stage).map((candidate) => `
            <article class="candidate-card" data-search-item="${escapeHtml(`${candidate.name} ${candidate.vacancy} ${candidate.stage}`)}">
              <strong>${escapeHtml(candidate.name)}</strong>
              <p class="mb-2 muted">${escapeHtml(candidate.vacancy)} - ${escapeHtml(candidate.source)}</p>
              <div class="progress" role="progressbar" aria-label="Aderencia" aria-valuenow="${candidate.score}" aria-valuemin="0" aria-valuemax="100">
                <div class="progress-bar bg-success" style="width: ${candidate.score}%">${candidate.score}%</div>
              </div>
            </article>
          `).join("") || `<div class="empty-state">Sem candidatos nesta etapa.</div>`}
        </div>
      `).join("")}
    </div>
  `;
}

function renderReports() {
  return `
    <div class="three-col-grid">
      ${reportCard("Turnover", "3.2%", "Baixo para o trimestre", "badge-brand")}
      ${reportCard("Tempo medio de vaga", "18 dias", "Meta interna: 21 dias", "badge-info")}
      ${reportCard("Absenteismo", "1.8%", "Estavel no mes", "badge-accent")}
    </div>
    <div class="panel-card">
      <div class="section-title"><h2>Relatorio executivo</h2></div>
      ${progressItem("Contratacoes no prazo", 78, "bg-success")}
      ${progressItem("Folha conferida", 92, "bg-primary")}
      ${progressItem("Ferias aprovadas", 64, "bg-warning")}
      ${progressItem("Pontos ajustados", 48, "bg-danger")}
    </div>
  `;
}

function renderEmployeeProfile() {
  return `
    <div class="two-col-grid">
      <div class="panel-card">
        <div class="d-flex align-items-center gap-3 mb-3">
          <span class="avatar" style="width:56px;height:56px;">MA</span>
          <div><h2 class="mb-1">Marina Alves</h2><p class="muted mb-0">Analista de RH - CLT - Matricula 0014</p></div>
        </div>
        <div class="row g-3">
          <div class="col-md-6"><strong>Gestor</strong><p class="muted mb-0">Carla Souza</p></div>
          <div class="col-md-6"><strong>Area</strong><p class="muted mb-0">RH</p></div>
          <div class="col-md-6"><strong>E-mail</strong><p class="muted mb-0">marina@rhflow.com</p></div>
          <div class="col-md-6"><strong>Status</strong><p class="mb-0">${statusBadge("Ativo")}</p></div>
        </div>
      </div>
      <div class="panel-card">
        <div class="section-title"><h2>Documentos</h2></div>
        ${stepList(["Contrato de trabalho", "Termo de confidencialidade", "Ficha cadastral", "Politica de beneficios"])}
      </div>
    </div>
  `;
}

function renderHolerites() {
  return `
    <div class="panel-card">
      <div class="section-title"><h2>Meus holerites</h2><button class="btn btn-sm btn-outline-secondary" data-notice="Download simulado."><i class="bi bi-download"></i> Baixar todos</button></div>
      <div class="table-responsive">
        <table class="table">
          <thead><tr><th>Mes</th><th>Bruto</th><th>Descontos</th><th>Liquido</th><th>Status</th><th></th></tr></thead>
          <tbody>${state.holerites.map((row) => `
            <tr><td><strong>${row.month}</strong></td><td>${row.gross}</td><td>${row.discounts}</td><td>${row.net}</td><td>${statusBadge(row.status)}</td><td class="text-end"><button class="btn btn-sm btn-outline-secondary" data-notice="Holerite aberto em modo demonstracao."><i class="bi bi-eye"></i></button></td></tr>
          `).join("")}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderVacation() {
  return `
    <div class="two-col-grid">
      <div class="panel-card">
        <div class="section-title"><h2>Saldo de ferias</h2><span class="badge-soft badge-brand">18 dias disponiveis</span></div>
        <div class="calendar-strip">
          ${["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map((day, index) => `<div class="day-box ${index < 5 ? "active" : ""}"><strong>${day}</strong><br><small>${index < 5 ? "Periodo sugerido" : "Fim de semana"}</small></div>`).join("")}
        </div>
      </div>
      <form class="form-card" id="leaveForm">
        <div class="section-title"><h2>Solicitar ferias</h2></div>
        <label class="form-label">Inicio</label><input class="form-control mb-3" name="startDate" type="date" required>
        <label class="form-label">Fim</label><input class="form-control mb-3" name="endDate" type="date" required>
        <label class="form-label">Dias</label><input class="form-control mb-3" name="days" type="number" min="1" value="10" required>
        <label class="form-label">Observacao</label><textarea class="form-control mb-3" name="note" rows="4"></textarea>
        <button class="btn btn-brand" type="submit"><i class="bi bi-calendar-check"></i> Enviar solicitacao</button>
      </form>
    </div>
  `;
}

function renderTimeClock() {
  return `
    <div class="two-col-grid">
      <div class="panel-card">
        <div class="section-title"><h2>Registro de hoje</h2><span class="badge-soft badge-info">28/05/2026</span></div>
        <p class="muted">Use o botao para simular um novo registro de ponto no historico.</p>
        <button class="btn btn-brand btn-lg" id="clockBtn"><i class="bi bi-clock"></i> Bater ponto agora</button>
      </div>
      <div class="panel-card">
        <div class="section-title"><h2>Historico</h2></div>
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>Data</th><th>Entrada</th><th>Pausa</th><th>Retorno</th><th>Saida</th><th>Saldo</th></tr></thead>
            <tbody>${state.punches.map((row) => `<tr><td>${row.date}</td><td>${row.entry}</td><td>${row.breakOut}</td><td>${row.breakIn}</td><td>${row.exit}</td><td>${row.balance}</td></tr>`).join("")}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderPrivateEmployees() {
  return `
    <div class="panel-card">
      <div class="section-title"><h2>Cadastros oficiais</h2><span class="badge-soft badge-brand">Criados pelo RH</span></div>
      <div class="table-responsive">
        <table class="table">
          <thead><tr><th></th><th>Nome</th><th>Area</th><th>Contrato</th><th>Status</th><th>Gestor</th></tr></thead>
          <tbody>${employeeRows()}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderManagers() {
  return `
    <div class="three-col-grid">
      ${state.managers.map((manager) => `
        <article class="panel-card" data-search-item="${escapeHtml(`${manager.name} ${manager.area}`)}">
          <div class="section-title"><h3>${escapeHtml(manager.name)}</h3><span class="avatar">${initials(manager.name)}</span></div>
          <p class="muted mb-3">${escapeHtml(manager.area)}</p>
          <div class="d-flex justify-content-between"><span>Time</span><strong>${manager.team}</strong></div>
          <div class="d-flex justify-content-between"><span>Aprovacoes</span><strong>${manager.approvals}</strong></div>
        </article>
      `).join("")}
    </div>
  `;
}

function renderAdmins() {
  return `
    <div class="two-col-grid">
      <div class="panel-card">
        <div class="section-title"><h2>Administradores</h2></div>
        <div class="table-responsive">
          <table class="table">
            <thead><tr><th>Nome</th><th>E-mail</th><th>Permissao</th><th>Status</th></tr></thead>
            <tbody>${state.admins.map((admin) => `
              <tr data-search-item="${escapeHtml(`${admin.name} ${admin.email} ${admin.role}`)}"><td><strong>${escapeHtml(admin.name)}</strong></td><td>${escapeHtml(admin.email)}</td><td>${escapeHtml(admin.role)}</td><td>${statusBadge(admin.status)}</td></tr>
            `).join("")}</tbody>
          </table>
        </div>
      </div>
      <form class="form-card" id="adminForm">
        <div class="section-title"><h2>Novo administrador</h2></div>
        <label class="form-label">Nome</label><input class="form-control mb-3" name="name" required>
        <label class="form-label">E-mail</label><input class="form-control mb-3" name="email" type="email" required>
        <label class="form-label">Permissao</label><select class="form-select mb-3" name="role"><option>Administrador geral</option><option>Auditoria</option><option>Suporte</option></select>
        <button class="btn btn-brand" type="submit"><i class="bi bi-person-gear"></i> Criar acesso</button>
      </form>
    </div>
  `;
}

function reportCard(title, value, description, badgeClass) {
  return `
    <article class="metric-card">
      <span>${title}</span>
      <strong>${value}</strong>
      <small><span class="badge-soft ${badgeClass}">${description}</span></small>
    </article>
  `;
}

function progressItem(label, value, cls) {
  return `
    <div class="mb-3">
      <div class="d-flex justify-content-between mb-1"><strong>${label}</strong><span class="muted">${value}%</span></div>
      <div class="progress" role="progressbar" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar ${cls}" style="width:${value}%"></div>
      </div>
    </div>
  `;
}

function stepList(items) {
  return `
    <div class="list-group list-group-flush">
      ${items.map((item) => `<div class="list-group-item px-0 bg-transparent"><i class="bi bi-check-circle text-success me-2"></i>${escapeHtml(item)}</div>`).join("")}
    </div>
  `;
}

function candidateStatusCard(name, vacancy, stage, percent) {
  return `
    <article class="panel-card shadow-none">
      <strong>${name}</strong>
      <p class="muted mb-2">${vacancy} - ${stage}</p>
      <div class="progress" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
        <div class="progress-bar bg-success" style="width: ${percent}%">${percent}%</div>
      </div>
    </article>
  `;
}

async function renderView(viewName) {
  const view = viewMeta[viewName] || viewMeta.home;
  await loadDataForView(viewName);
  document.getElementById("viewArea").textContent = areaLabels[view.area];
  document.getElementById("viewTitle").textContent = view.title;
  document.getElementById("viewSubtitle").textContent = view.subtitle;
  document.getElementById("viewActions").innerHTML = view.actions || "";
  document.getElementById("viewContent").innerHTML = view.render();
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  document.body.classList.remove("sidebar-open");
  wireView(viewName);
  filterVisibleItems(document.getElementById("globalSearch").value);
  updateUserChip();
}

function goTo(viewName) {
  if (window.location.hash === `#${viewName}`) {
    renderView(viewName);
    return;
  }
  window.location.hash = viewName;
}

function showNotice(message) {
  const notice = document.getElementById("notice");
  notice.textContent = message;
  notice.classList.add("show");
  window.setTimeout(() => notice.classList.remove("show"), 4200);
}

function filterVisibleItems(term) {
  const value = String(term || "").trim().toLowerCase();
  document.querySelectorAll("[data-search-item]").forEach((item) => {
    const haystack = item.dataset.searchItem.toLowerCase();
    item.style.display = !value || haystack.includes(value) ? "" : "none";
  });
}

async function wireView(viewName) {
  const candidateForm = document.getElementById("candidateForm");
  if (candidateForm) {
    candidateForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(candidateForm);
      try {
        await apiFetch("/candidates", {
          method: "POST",
          body: JSON.stringify(Object.fromEntries(form.entries()))
        });
        state.pendingVacancy = "";
        candidateForm.reset();
        showNotice("Cadastro enviado. O candidato entrou na etapa de triagem.");
      } catch (error) {
        showNotice(error.message);
      }
    });
  }

  const employeeForm = document.getElementById("employeeForm");
  if (employeeForm) {
    employeeForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(employeeForm);
      try {
        await apiFetch("/employees", {
          method: "POST",
          body: JSON.stringify(Object.fromEntries(form.entries()))
        });
        await renderView(viewName);
        showNotice("Funcionario cadastrado pelo RH.");
      } catch (error) {
        showNotice(error.message);
      }
    });
  }

  const adminForm = document.getElementById("adminForm");
  if (adminForm) {
    adminForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(adminForm);
      try {
        await apiFetch("/admins", {
          method: "POST",
          body: JSON.stringify(Object.fromEntries(form.entries()))
        });
        await renderView(viewName);
        showNotice("Administrador criado com permissao privada.");
      } catch (error) {
        showNotice(error.message);
      }
    });
  }

  const leaveForm = document.getElementById("leaveForm");
  if (leaveForm) {
    leaveForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(leaveForm);
      try {
        await apiFetch("/vacations", {
          method: "POST",
          body: JSON.stringify(Object.fromEntries(form.entries()))
        });
        leaveForm.reset();
        await renderView(viewName);
        showNotice("Solicitacao de ferias enviada para aprovacao do gestor.");
      } catch (error) {
        showNotice(error.message);
      }
    });
  }

  const generalLoginForm = document.getElementById("generalLoginForm");
  if (generalLoginForm) {
    generalLoginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(generalLoginForm);
      try {
        const data = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify(Object.fromEntries(form.entries()))
        });
        setSession(data.token, data.user);
        const nextView = { admin: "priv-admins", rh: "rh-dashboard", manager: "priv-gestores", employee: "func-perfil", candidate: "login-candidato" }[data.user.role] || "home";
        goTo(nextView);
        showNotice("Login realizado com sucesso.");
      } catch (error) {
        showNotice(error.message);
      }
    });
  }

  const candidateLoginForm = document.getElementById("candidateLoginForm");
  if (candidateLoginForm) {
    candidateLoginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(candidateLoginForm);
      try {
        const data = await apiFetch("/auth/login", {
          method: "POST",
          body: JSON.stringify(Object.fromEntries(form.entries()))
        });
        setSession(data.token, data.user);
        showNotice("Login de candidato realizado.");
      } catch (error) {
        showNotice(error.message);
      }
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  const clockBtn = document.getElementById("clockBtn");
  if (clockBtn) {
    clockBtn.addEventListener("click", async () => {
      try {
        await apiFetch("/time-clock/punch", { method: "POST", body: JSON.stringify({}) });
        await renderView(viewName);
        showNotice("Ponto registrado com sucesso.");
      } catch (error) {
        showNotice(error.message);
      }
    });
  }
}

document.addEventListener("click", (event) => {
  const navButton = event.target.closest("[data-view]");
  if (navButton) {
    goTo(navButton.dataset.view);
    return;
  }

  const goButton = event.target.closest("[data-go]");
  if (goButton) {
    goTo(goButton.dataset.go);
    return;
  }

  const applyButton = event.target.closest("[data-apply]");
  if (applyButton) {
    state.pendingVacancy = applyButton.dataset.apply;
    goTo("cadastro-candidato");
    return;
  }

  const noticeButton = event.target.closest("[data-notice]");
  if (noticeButton) {
    showNotice(noticeButton.dataset.notice);
    return;
  }

  if (event.target.closest("#sidebarToggle")) {
    document.body.classList.toggle("sidebar-open");
  }
});

document.getElementById("globalSearch").addEventListener("input", (event) => {
  filterVisibleItems(event.target.value);
});

window.addEventListener("hashchange", () => {
  const viewName = window.location.hash.replace("#", "") || "home";
  renderView(viewName);
});

renderView(window.location.hash.replace("#", "") || "home");
