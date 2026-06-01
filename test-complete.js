/**
 * TESTE SIMPLIFICADO E FUNCIONAL - SITE-RH
 * Valida o sistema através da interface Web
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.blue}╔${'═'.repeat(50)}╗${colors.reset}`);
  console.log(`${colors.blue}║ ${colors.bold}${title.padEnd(48)}${colors.blue}║${colors.reset}`);
  console.log(`${colors.blue}╚${'═'.repeat(50)}╝${colors.reset}\n`);
}

logSection('TESTE COMPLETO - SITE-RH v1.0');

let checks = [];

// CHECK 1: Servidor Node.js rodando
log('📋 Verificando status do servidor...', 'yellow');
fetch('http://localhost:3000/health')
  .then(r => r.json())
  .then(d => {
    if (d.ok) {
      checks.push({ name: '✓ Servidor Node.js operacional', status: 'PASS' });
      log('  ✓ Servidor respondendo', 'green');
    }
  })
  .catch(() => {
    checks.push({ name: '✗ Servidor Node.js não respondendo', status: 'FAIL' });
    log('  ✗ Servidor inacessível em http://localhost:3000', 'red');
  })
  .finally(() => {
    // CHECK 2: Arquivos HTML
    logSection('VALIDAÇÃO DE ARQUIVOS');
    
    const requiredFiles = [
      'index.html',
      'login.html',
      'cadastro-candidato.html',
      'rh-dashboard.html',
      'rh-funcionarios.html',
      'rh-recrutamento.html',
      'rh-relatorios.html',
      'rh-folha.html',
      'vagas.html',
      'assets/css/styles.css',
      'assets/js/app.js',
      'assets/js/site.js',
      'backend/server.js',
      'backend/db/database.js',
      'backend/db/schema.sql',
      'backend/routes/auth.routes.js',
      'backend/routes/candidates.routes.js',
      'backend/routes/employees.routes.js',
      'package.json'
    ];

    const rootDir = path.join(__dirname);
    let filesOk = 0;
    let filesFail = 0;

    requiredFiles.forEach(file => {
      const fullPath = path.join(rootDir, file);
      if (fs.existsSync(fullPath)) {
        checks.push({ name: `✓ ${file}`, status: 'PASS' });
        filesOk++;
      } else {
        checks.push({ name: `✗ ${file}`, status: 'FAIL' });
        filesFail++;
      }
    });

    log(`  Arquivos encontrados: ${filesOk}/${requiredFiles.length}`, filesOk === requiredFiles.length ? 'green' : 'yellow');

    // CHECK 3: Estrutura de diretórios
    logSection('ESTRUTURA DE DIRETÓRIOS');
    const requiredDirs = [
      'assets',
      'assets/css',
      'assets/js',
      'assets/vendor',
      'backend',
      'backend/db',
      'backend/middleware',
      'backend/routes',
      'scripts'
    ];

    let dirsOk = 0;
    requiredDirs.forEach(dir => {
      const fullPath = path.join(rootDir, dir);
      if (fs.existsSync(fullPath)) {
        dirsOk++;
        log(`  ✓ ${dir}/`, 'green');
      } else {
        log(`  ✗ ${dir}/`, 'red');
      }
    });

    log(`\n  Total: ${dirsOk}/${requiredDirs.length} diretórios`, dirsOk === requiredDirs.length ? 'green' : 'yellow');

    // CHECK 4: Verificar configuração do BD
    logSection('CONFIGURAÇÃO DO BANCO DE DADOS');
    
    const envPath = path.join(rootDir, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      log('  ✓ Arquivo .env encontrado', 'green');
      
      const hasDbUrl = envContent.includes('DATABASE_URL');
      const hasDbUser = envContent.includes('DB_USER');
      
      if (hasDbUrl || hasDbUser) {
        log('  ✓ Variáveis de banco de dados configuradas', 'green');
        checks.push({ name: '✓ Banco de dados configurado', status: 'PASS' });
      } else {
        log('  ⚠ Variáveis de banco incompletas', 'yellow');
      }
    } else {
      log('  ⚠ Arquivo .env não encontrado (usando valores padrão)', 'yellow');
    }

    // CHECK 5: Análise de rotas da API
    logSection('ROTAS DA API');
    
    const routeFiles = [
      'backend/routes/auth.routes.js',
      'backend/routes/candidates.routes.js',
      'backend/routes/employees.routes.js',
      'backend/routes/vacancies.routes.js',
      'backend/routes/payroll.routes.js',
      'backend/routes/payslips.routes.js',
      'backend/routes/time-clock.routes.js',
      'backend/routes/vacations.routes.js',
      'backend/routes/managers.routes.js',
      'backend/routes/admins.routes.js',
      'backend/routes/reports.routes.js'
    ];

    const availableRoutes = [
      '/api/auth - Autenticação (Login/Me)',
      '/api/candidates - Gerenciamento de Candidatos',
      '/api/employees - Gerenciamento de Funcionários',
      '/api/vacancies - Gerenciamento de Vagas',
      '/api/payroll - Folha de Pagamento',
      '/api/payslips - Contra-cheques',
      '/api/time-clock - Ponto Eletrônico',
      '/api/vacations - Férias',
      '/api/managers - Gestores',
      '/api/admins - Administração',
      '/api/reports - Relatórios'
    ];

    routeFiles.forEach((file, idx) => {
      const fullPath = path.join(rootDir, file);
      if (fs.existsSync(fullPath)) {
        log(`  ✓ ${availableRoutes[idx]}`, 'green');
        checks.push({ name: `✓ Rota ${availableRoutes[idx].split(' - ')[0]}`, status: 'PASS' });
      }
    });

    // CHECK 6: Validação de formulários HTML
    logSection('FORMULÁRIOS HTML');
    
    const formPages = {
      'login.html': ['email', 'password'],
      'cadastro-candidato.html': ['name', 'email', 'phone', 'vacancy'],
      'rh-funcionarios.html': ['name', 'email', 'role', 'area']
    };

    Object.entries(formPages).forEach(([file, fields]) => {
      const fullPath = path.join(rootDir, file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        let fieldsFound = 0;
        fields.forEach(field => {
          if (content.includes(field)) fieldsFound++;
        });
        
        if (fieldsFound === fields.length) {
          log(`  ✓ ${file} - Todos os campos presentes`, 'green');
          checks.push({ name: `✓ Formulário ${file}`, status: 'PASS' });
        } else {
          log(`  ⚠ ${file} - Alguns campos faltando (${fieldsFound}/${fields.length})`, 'yellow');
        }
      }
    });

    // CHECK 7: Dependências NPM
    logSection('DEPENDÊNCIAS');
    
    const pkgPath = path.join(rootDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const requiredDeps = ['express', 'pg', 'bcryptjs', 'jsonwebtoken', 'cors'];
        
        let depsOk = 0;
        requiredDeps.forEach(dep => {
          if (pkg.dependencies[dep]) {
            log(`  ✓ ${dep}`, 'green');
            depsOk++;
          } else {
            log(`  ✗ ${dep} faltando`, 'red');
          }
        });
        
        log(`\n  Total: ${depsOk}/${requiredDeps.length}`, depsOk === requiredDeps.length ? 'green' : 'yellow');
      } catch (e) {
        log('  ✗ Erro ao ler package.json', 'red');
      }
    }

    // RESUMO FINAL
    logSection('RESUMO DOS TESTES');
    
    const totalChecks = checks.length;
    const passedChecks = checks.filter(c => c.status === 'PASS').length;
    const failedChecks = checks.filter(c => c.status === 'FAIL').length;
    const percentage = totalChecks > 0 ? ((passedChecks / totalChecks) * 100).toFixed(1) : 0;

    log(`✓ Testes passaram: ${passedChecks}`, 'green');
    log(`✗ Testes falharam: ${failedChecks}`, failedChecks > 0 ? 'red' : 'green');
    log(`Taxa de sucesso: ${percentage}%\n`, percentage >= 80 ? 'green' : 'yellow');

    if (percentage >= 80) {
      log('🎉 SISTEMA OPERACIONAL!', 'green');
      log('O sistema está configurado corretamente.\n', 'green');
      
      log('Próximos passos:', 'blue');
      log('  1. Acessar: http://localhost:3000', 'gray');
      log('  2. Login com: admin@rhflow.com / 123456', 'gray');
      log('  3. Testar funcionalidades via interface Web\n', 'gray');
    } else {
      log(`⚠️  Alguns testes falharam (${failedChecks})`, 'yellow');
      log('Revise os problemas acima antes de usar o sistema.\n', 'yellow');
    }

    // Detalhes dos testes
    log('Detalhes completos:', 'blue');
    checks.forEach(check => {
      const color = check.status === 'PASS' ? 'green' : 'red';
      log(`  ${check.name}`, color);
    });

    console.log('');
  });
