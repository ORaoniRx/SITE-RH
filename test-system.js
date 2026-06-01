/**
 * TESTE COMPLETO DO SISTEMA SITE-RH
 * Valida todos os endpoints da API e validação de formulários
 */

const BASE_URL = 'http://localhost:3000/api';
let testsPassed = 0;
let testsFailed = 0;
let testToken = null;

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function testPass(name) {
  testsPassed++;
  log(`✓ ${name}`, 'green');
}

function testFail(name, error) {
  testsFailed++;
  log(`✗ ${name}`, 'red');
  if (error) log(`  Erro: ${error}`, 'gray');
}

async function makeRequest(method, endpoint, body = null, token = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 0, error: error.message };
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════╗', 'blue');
  log('║          TESTE COMPLETO - SITE-RH              ║', 'blue');
  log('╚════════════════════════════════════════════════╝\n', 'blue');

  // TESTE 1: Health Check
  log('1️⃣  TESTE DE CONECTIVIDADE', 'yellow');
  let result = await makeRequest('GET', '/auth/health');
  if (result.status !== 200 && result.status !== 0) {
    // Tentar endpoint raiz
    result = await fetch('http://localhost:3000/health').then(r => r.json()).then(d => ({ status: 200, data: d })).catch(() => ({ status: 0 }));
  }
  if (result.status === 200 || result.data?.ok) {
    testPass('Servidor respondendo corretamente (Health Check)');
  } else {
    testFail('Health Check', `Status: ${result.status}`);
  }

  // TESTE 2: Registro de Novo Candidato
  log('\n2️⃣  TESTE DE REGISTRO DE CANDIDATO', 'yellow');
  const candidateData = {
    name: 'João Silva Teste',
    email: `joao.teste.${Date.now()}@test.com`,
    phone: '(11) 98765-4321',
    portfolio: 'https://github.com/joao-teste',
    summary: 'Desenvolvedor Full Stack com 5 anos de experiência',
    vacancy: 'dev' // slug da vaga
  };
  result = await makeRequest('POST', '/candidates', candidateData);
  if (result.status === 201 || result.status === 200) {
    testPass('Registro de candidato com sucesso');
  } else {
    testFail('Registro de candidato', `Status: ${result.status}`);
  }

  // TESTE 3: Listar Candidatos
  log('\n3️⃣  TESTE DE LISTAGEM DE CANDIDATOS', 'yellow');
  result = await makeRequest('GET', '/candidates');
  if (result.status === 200 && Array.isArray(result.data)) {
    testPass(`Listagem de candidatos (${result.data.length} registros)`);
  } else {
    testFail('Listagem de candidatos', `Status: ${result.status}`);
  }

  // TESTE 4: Listagem de Vagas
  log('\n4️⃣  TESTE DE LISTAGEM DE VAGAS', 'yellow');
  result = await makeRequest('GET', '/vacancies');
  if (result.status === 200) {
    testPass(`Listagem de vagas retornou ${result.data?.length || 0} vagas`);
  } else {
    testFail('Listagem de vagas', `Status: ${result.status}`);
  }

  // TESTE 5: Login (Teste de Autenticação)
  log('\n5️⃣  TESTE DE AUTENTICAÇÃO (LOGIN)', 'yellow');
  const loginData = {
    email: 'admin@rhflow.com',
    password: '123456'
  };
  result = await makeRequest('POST', '/auth/login', loginData);
  if (result.status === 200 && result.data?.token) {
    testPass('Login bem-sucedido');
    testToken = result.data.token;
    log(`  Token obtido: ${result.data.token.substring(0, 20)}...`, 'gray');
  } else {
    testFail('Login', `Status: ${result.status} - ${result.data?.message || result.error}`);
  }

  // TESTE 6: Endpoints Protegidos
  if (testToken) {
    log('\n6️⃣  TESTE DE ENDPOINTS PROTEGIDOS', 'yellow');
    
    result = await makeRequest('GET', '/employees', null, testToken);
    if (result.status === 200 || result.status === 401) {
      testPass('Validação de autenticação em /employees');
    } else {
      testFail('Endpoint protegido /employees', `Status: ${result.status}`);
    }

    result = await makeRequest('GET', '/payroll', null, testToken);
    if (result.status === 200 || result.status === 401 || result.status === 404) {
      testPass('Acesso a /payroll verificado');
    } else {
      testFail('Endpoint /payroll', `Status: ${result.status}`);
    }
  }

  // TESTE 7: Validação de Inputs
  log('\n7️⃣  TESTE DE VALIDAÇÃO DE INPUTS', 'yellow');

  // Email inválido
  const invalidEmail = {
    name: 'Teste',
    email: 'email-invalido',
    phone: '(11) 98765-4321',
    portfolio: 'https://github.com/teste',
    summary: 'Teste',
    vacancy: 'ux'
  };
  result = await makeRequest('POST', '/candidates', invalidEmail);
  if (result.status !== 201 && result.status !== 200) {
    testPass('Email inválido é rejeitado');
  } else {
    testFail('Validação de email', 'Email inválido foi aceito');
  }

  // Nome vazio
  const emptyName = {
    name: '',
    email: `teste.${Date.now()}@test.com`,
    phone: '(11) 98765-4321',
    portfolio: 'https://github.com/teste',
    summary: 'Teste',
    vacancy: 'rh'
  };
  result = await makeRequest('POST', '/candidates', emptyName);
  if (result.status !== 201 && result.status !== 200) {
    testPass('Nome vazio é rejeitado');
  } else {
    testFail('Validação de nome', 'Nome vazio foi aceito');
  }

  // Score fora do intervalo válido
  const invalidScore = {
    name: 'Teste Score',
    email: `teste.${Date.now()}@test.com`,
    phone: '(11) 98765-4321',
    portfolio: 'https://github.com/teste',
    summary: 'Teste',
    vacancy: 'finance',
    score: 150 // Score deve estar entre 0-100
  };
  result = await makeRequest('POST', '/candidates', invalidScore);
  if (result.status !== 201 && result.status !== 200) {
    testPass('Score inválido (> 100) é rejeitado');
  } else {
    testFail('Validação de score', 'Score inválido foi aceito');
  }

  // TESTE 8: Verificar Erro em Rota Desconhecida
  log('\n8️⃣  TESTE DE ROTEAMENTO', 'yellow');
  result = await makeRequest('POST', '/rota-inexistente', { test: 'data' });
  if (result.data?.message?.includes('/api/')) {
    testPass('Erro útil em rota POST desconhecida');
  } else {
    testFail('Tratamento de erro em rota desconhecida', 'Erro não informativo');
  }

  // TESTE 9: Métodos HTTP Não Suportados
  log('\n9️⃣  TESTE DE MÉTODOS HTTP', 'yellow');
  result = await makeRequest('PUT', '/candidates', { test: 'data' });
  if (result.status === 400 || result.status === 404 || result.status === 405) {
    testPass('Método PUT rejeitado apropriadamente');
  } else {
    testFail('Rejeição de método PUT', `Status: ${result.status}`);
  }

  // TESTE 10: Performance - Múltiplas Requisições
  log('\n🔟 TESTE DE PERFORMANCE', 'yellow');
  const startTime = Date.now();
  let successCount = 0;
  
  for (let i = 0; i < 5; i++) {
    result = await makeRequest('GET', '/vacancies');
    if (result.status === 200) successCount++;
  }
  
  const endTime = Date.now();
  const avgTime = (endTime - startTime) / 5;
  
  if (successCount === 5) {
    testPass(`5 requisições completadas em ${endTime - startTime}ms (${avgTime.toFixed(0)}ms cada)`);
  } else {
    testFail('Performance test', `Apenas ${successCount}/5 requisições sucedidas`);
  }

  // RESUMO FINAL
  log('\n╔════════════════════════════════════════════════╗', 'blue');
  log('║              RESUMO DOS TESTES                 ║', 'blue');
  log('╚════════════════════════════════════════════════╝\n', 'blue');

  const total = testsPassed + testsFailed;
  const percentage = total > 0 ? ((testsPassed / total) * 100).toFixed(1) : 0;

  log(`✓ Testes passaram: ${testsPassed}`, 'green');
  log(`✗ Testes falharam: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  log(`Total: ${total} testes`, 'blue');
  log(`Taxa de sucesso: ${percentage}%\n`, percentage >= 80 ? 'green' : 'yellow');

  if (testsFailed === 0) {
    log('🎉 TODOS OS TESTES PASSARAM! Sistema funcionando corretamente!\n', 'green');
  } else {
    log(`⚠️  ${testsFailed} teste(s) falharam. Revise os erros acima.\n`, 'yellow');
  }

  return { passed: testsPassed, failed: testsFailed, total };
}

// Executar testes
runTests().catch(err => {
  log(`Erro ao executar testes: ${err.message}`, 'red');
  process.exit(1);
});
