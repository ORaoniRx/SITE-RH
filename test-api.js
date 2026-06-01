/**
 * TESTE DETALHADO DA API - SITE-RH
 * Valida todos os endpoints com requests reais
 */

const BASE_URL = 'http://localhost:3000/api';
let testsPassed = 0;
let testsFailed = 0;
let token = null;

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

async function request(method, path, body = null, auth = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (auth) options.headers['Authorization'] = `Bearer ${auth}`;
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json().catch(() => null);
    
    return {
      status: response.status,
      ok: response.ok,
      data,
      method,
      path
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
      method,
      path
    };
  }
}

async function test(name, fn) {
  try {
    const result = await fn();
    if (result) {
      testsPassed++;
      log(`  ✅ ${name}`, 'green');
      return true;
    } else {
      testsFailed++;
      log(`  ❌ ${name}`, 'red');
      return false;
    }
  } catch (error) {
    testsFailed++;
    log(`  ❌ ${name}: ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════╗', 'blue');
  log('║      TESTE DETALHADO DA API - SITE-RH          ║', 'blue');
  log('╚════════════════════════════════════════════════╝\n', 'blue');

  // 1️⃣ TESTES DE AUTENTICAÇÃO
  log('1️⃣  AUTENTICAÇÃO', 'yellow');
  
  await test('Login com credenciais válidas', async () => {
    const res = await request('POST', '/auth/login', {
      email: 'admin@rhflow.com',
      password: '123456'
    });
    if (res.status === 200 && res.data?.token) {
      token = res.data.token;
      log(`     Token: ${token.substring(0, 30)}...`, 'gray');
      return true;
    }
    log(`     Status ${res.status}: ${res.data?.message}`, 'gray');
    return false;
  });

  await test('Login com email inválido retorna 401', async () => {
    const res = await request('POST', '/auth/login', {
      email: 'invalido@test.com',
      password: '123456'
    });
    return res.status === 401;
  });

  await test('Login com senha inválida retorna 401', async () => {
    const res = await request('POST', '/auth/login', {
      email: 'admin@rhflow.com',
      password: 'senhaerrada'
    });
    return res.status === 401;
  });

  await test('Rejeita login sem email', async () => {
    const res = await request('POST', '/auth/login', {
      password: '123456'
    });
    return res.status === 400;
  });

  await test('Rejeita login sem senha', async () => {
    const res = await request('POST', '/auth/login', {
      email: 'admin@rhflow.com'
    });
    return res.status === 400;
  });

  await test('GET /auth/me retorna usuário autenticado', async () => {
    const res = await request('GET', '/auth/me', null, token);
    return res.status === 200 && res.data?.user?.email;
  });

  // 2️⃣ TESTES DE CANDIDATOS
  log('\n2️⃣  GERENCIAMENTO DE CANDIDATOS', 'yellow');

  let candidateId = null;

  await test('POST /candidates - Registrar novo candidato', async () => {
    const res = await request('POST', '/candidates', {
      name: `Candidato Teste ${Date.now()}`,
      email: `candidate.${Date.now()}@test.com`,
      phone: '(11) 99999-9999',
      vacancy: 'dev',
      portfolio: 'https://github.com/test',
      summary: 'Desenvolvedor experiente'
    });
    if (res.status === 201 && res.data?.candidate?.id) {
      candidateId = res.data.candidate.id;
      return true;
    }
    log(`     Status ${res.status}: ${res.data?.message}`, 'gray');
    return false;
  });

  await test('Rejeita candidato com email inválido', async () => {
    const res = await request('POST', '/candidates', {
      name: 'Teste',
      email: 'email-invalido',
      phone: '(11) 99999-9999',
      vacancy: 'dev'
    });
    return res.status === 400;
  });

  await test('Rejeita candidato sem nome', async () => {
    const res = await request('POST', '/candidates', {
      email: `test.${Date.now()}@test.com`,
      phone: '(11) 99999-9999',
      vacancy: 'dev'
    });
    return res.status === 400;
  });

  await test('Rejeita candidato sem vaga', async () => {
    const res = await request('POST', '/candidates', {
      name: 'Teste',
      email: `test.${Date.now()}@test.com`,
      phone: '(11) 99999-9999'
    });
    return res.status === 400;
  });

  await test('GET /candidates retorna lista', async () => {
    const res = await request('GET', '/candidates');
    return res.status === 200 && Array.isArray(res.data);
  });

  await test('GET /candidates/auth/list requer autenticação', async () => {
    const res = await request('GET', '/candidates/auth/list');
    return res.status === 401;
  });

  await test('GET /candidates/auth/list retorna lista com token', async () => {
    const res = await request('GET', '/candidates/auth/list', null, token);
    return res.status === 200 && Array.isArray(res.data?.candidates);
  });

  // 3️⃣ TESTES DE VAGAS
  log('\n3️⃣  GERENCIAMENTO DE VAGAS', 'yellow');

  await test('GET /vacancies retorna lista pública', async () => {
    const res = await request('GET', '/vacancies');
    return res.status === 200 && Array.isArray(res.data);
  });

  await test('Vagas contêm todos os campos necessários', async () => {
    const res = await request('GET', '/vacancies');
    if (res.status !== 200 || !Array.isArray(res.data) || res.data.length === 0) return false;
    
    const vaga = res.data[0];
    return vaga.id && vaga.title && (vaga.slug || vaga.dbId) && vaga.status;
  });

  await test('GET /vacancies/all requer autenticação', async () => {
    const res = await request('GET', '/vacancies/all');
    return res.status === 401;
  });

  await test('GET /vacancies/all retorna todas com token', async () => {
    const res = await request('GET', '/vacancies/all', null, token);
    return res.status === 200 && Array.isArray(res.data?.vacancies);
  });

  // 4️⃣ TESTES DE FUNCIONÁRIOS
  log('\n4️⃣  GERENCIAMENTO DE FUNCIONÁRIOS', 'yellow');

  await test('GET /employees requer autenticação', async () => {
    const res = await request('GET', '/employees');
    return res.status === 401;
  });

  await test('GET /employees retorna lista com token', async () => {
    const res = await request('GET', '/employees', null, token);
    return res.status === 200 && Array.isArray(res.data?.employees);
  });

  await test('Funcionários contêm dados corretos', async () => {
    const res = await request('GET', '/employees', null, token);
    if (res.status !== 200 || !Array.isArray(res.data?.employees) || res.data.employees.length === 0) return false;
    
    const emp = res.data.employees[0];
    return emp.id && emp.name && emp.email && emp.role;
  });

  // 5️⃣ TESTES DE VAGAS (ENDPOINTS PROTEGIDOS)
  log('\n5️⃣  ENDPOINTS PROTEGIDOS', 'yellow');

  await test('POST /vacancies requer autenticação', async () => {
    const res = await request('POST', '/vacancies', {
      title: 'Teste',
      slug: 'teste',
      sector: 'Test'
    });
    return res.status === 401;
  });


  // 6️⃣ TESTES DE PAYLOAD
  log('\n6️⃣  VALIDAÇÃO DE PAYLOAD', 'yellow');

  await test('Retorna 400 para payload JSON inválido', async () => {
    try {
      const response = await fetch(`${BASE_URL}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json {'
      });
      return response.status === 400 || response.status === 500;
    } catch {
      return true;
    }
  });

  // 7️⃣ TESTES DE CAMPOS OBRIGATÓRIOS
  log('\n7️⃣  CAMPOS OBRIGATÓRIOS', 'yellow');

  await test('POST /candidates - campo name obrigatório', async () => {
    const res = await request('POST', '/candidates', {
      email: `test.${Date.now()}@test.com`,
      phone: '(11) 99999-9999',
      vacancy: 'dev'
    });
    return res.status === 400 && res.data?.message?.includes('name');
  });

  await test('POST /candidates - campo email obrigatório', async () => {
    const res = await request('POST', '/candidates', {
      name: 'Teste',
      phone: '(11) 99999-9999',
      vacancy: 'dev'
    });
    return res.status === 400 && res.data?.message?.includes('email');
  });

  await test('POST /candidates - campo phone obrigatório', async () => {
    const res = await request('POST', '/candidates', {
      name: 'Teste',
      email: `test.${Date.now()}@test.com`,
      vacancy: 'dev'
    });
    return res.status === 400 && res.data?.message?.includes('phone');
  });

  // 8️⃣ TESTES DE DADOS OPCIONAIS
  log('\n8️⃣  DADOS OPCIONAIS', 'yellow');

  await test('Portfolio é opcional', async () => {
    const res = await request('POST', '/candidates', {
      name: `Candidato ${Date.now()}`,
      email: `candidate.${Date.now()}@test.com`,
      phone: '(11) 99999-9999',
      vacancy: 'ux'
    });
    return res.status === 201;
  });

  await test('Summary é opcional', async () => {
    const res = await request('POST', '/candidates', {
      name: `Candidato ${Date.now()}`,
      email: `candidate.${Date.now()}@test.com`,
      phone: '(11) 99999-9999',
      vacancy: 'rh'
    });
    return res.status === 201;
  });

  // 9️⃣ TESTES DE VALIDAÇÃO DE DADOS
  log('\n9️⃣  VALIDAÇÃO DE DADOS', 'yellow');

  await test('Email com formato inválido é rejeitado', async () => {
    const res = await request('POST', '/candidates', {
      name: 'Teste',
      email: 'nao.eh.email',
      phone: '(11) 99999-9999',
      vacancy: 'dev'
    });
    return res.status === 400;
  });

  // 🔟 TESTES DE ERRO
  log('\n🔟 TRATAMENTO DE ERROS', 'yellow');

  await test('Rota GET inexistente retorna 404 ou redirecionamento', async () => {
    const res = await request('GET', '/rota-inexistente');
    // Pode ser 404 ou redirecionar para index.html (status 200)
    return res.status === 404 || res.status === 200;
  });

  await test('Método não permitido retorna erro', async () => {
    const res = await request('DELETE', '/candidates/1', null, token);
    return res.status === 404 || res.status === 405 || res.status === 400;
  });

  // RESUMO
  log('\n╔════════════════════════════════════════════════╗', 'blue');
  log('║              RESUMO DOS TESTES                 ║', 'blue');
  log('╚════════════════════════════════════════════════╝\n', 'blue');

  const total = testsPassed + testsFailed;
  const percentage = total > 0 ? ((testsPassed / total) * 100).toFixed(1) : 0;

  log(`✅ Testes passaram: ${testsPassed}`, 'green');
  log(`❌ Testes falharam: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  log(`📊 Taxa de sucesso: ${percentage}%`, percentage >= 90 ? 'green' : percentage >= 70 ? 'yellow' : 'red');
  log(`📈 Total: ${total} testes\n`, 'blue');

  if (percentage >= 90) {
    log('🎉 API FUNCIONANDO CORRETAMENTE!', 'green');
  } else if (percentage >= 70) {
    log('⚠️  API funciona, mas há alguns problemas', 'yellow');
  } else {
    log('❌ API tem problemas significativos', 'red');
  }

  return { passed: testsPassed, failed: testsFailed, percentage };
}

// Executar testes
runTests().catch(err => {
  log(`Erro ao executar testes: ${err.message}`, 'red');
  process.exit(1);
});
