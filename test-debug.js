/**
 * TESTE DEBUG - INVESTIGAR PROBLEMAS ESPECÍFICOS
 */

const BASE_URL = 'http://localhost:3000/api';

async function request(method, path, body = null, auth = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (auth) options.headers['Authorization'] = `Bearer ${auth}`;
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function debug() {
  console.log('🔍 DEBUG - Problemas da API\n');

  // 1. Login e pegar token
  console.log('1️⃣  Fazendo login...');
  const loginRes = await request('POST', '/auth/login', {
    email: 'admin@rhflow.com',
    password: '123456'
  });
  console.log('Status:', loginRes.status);
  console.log('Response:', JSON.stringify(loginRes.data, null, 2));
  
  if (!loginRes.data?.token) {
    console.log('❌ Não consegui token');
    return;
  }
  
  const token = loginRes.data.token;
  console.log('✅ Token obtido:', token.substring(0, 40) + '...\n');

  // 2. Testar GET /auth/me
  console.log('2️⃣  Testando GET /auth/me com token...');
  const meRes = await request('GET', '/auth/me', null, token);
  console.log('Status:', meRes.status);
  console.log('Response:', JSON.stringify(meRes.data, null, 2));
  console.log('Headers:', Object.fromEntries(meRes.headers.entries()));

  // 3. Testar GET /candidates
  console.log('\n3️⃣  Testando GET /candidates (pública)...');
  const candRes = await request('GET', '/candidates');
  console.log('Status:', candRes.status);
  console.log('Tipo de resposta:', typeof candRes.data);
  console.log('É array?', Array.isArray(candRes.data));
  if (Array.isArray(candRes.data)) {
    console.log('Número de candidatos:', candRes.data.length);
    if (candRes.data.length > 0) {
      console.log('Primeiro candidato:', JSON.stringify(candRes.data[0], null, 2));
    }
  } else {
    console.log('Response:', JSON.stringify(candRes.data, null, 2));
  }

  // 4. Testar GET /candidates/auth/list
  console.log('\n4️⃣  Testando GET /candidates/auth/list com token...');
  const authCandRes = await request('GET', '/candidates/auth/list', null, token);
  console.log('Status:', authCandRes.status);
  console.log('Response:', JSON.stringify(authCandRes.data, null, 2));

  // 5. Testar GET /vacancies
  console.log('\n5️⃣  Testando GET /vacancies (pública)...');
  const vacRes = await request('GET', '/vacancies');
  console.log('Status:', vacRes.status);
  console.log('Tipo de resposta:', typeof vacRes.data);
  console.log('É array?', Array.isArray(vacRes.data));
  if (Array.isArray(vacRes.data)) {
    console.log('Número de vagas:', vacRes.data.length);
    if (vacRes.data.length > 0) {
      console.log('Primeira vaga:', JSON.stringify(vacRes.data[0], null, 2));
    }
  } else {
    console.log('Response:', JSON.stringify(vacRes.data, null, 2));
  }

  // 6. Testar GET /vacancies/all
  console.log('\n6️⃣  Testando GET /vacancies/all com token...');
  const allVacRes = await request('GET', '/vacancies/all', null, token);
  console.log('Status:', allVacRes.status);
  console.log('Response:', JSON.stringify(allVacRes.data, null, 2));

  // 7. Testar GET /employees
  console.log('\n7️⃣  Testando GET /employees com token...');
  const empRes = await request('GET', '/employees', null, token);
  console.log('Status:', empRes.status);
  console.log('Response:', JSON.stringify(empRes.data, null, 2));
}

debug().catch(err => console.error('Erro:', err.message));
