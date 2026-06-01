const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  password: '23',
  host: 'localhost',
  port: 5432,
  database: 'postgres'
});

async function setupUser() {
  try {
    await client.connect();
    console.log('Conectado ao PostgreSQL como postgres');
    
    // Criar usuário rh-flow
    try {
      await client.query(`CREATE USER "rh-flow" WITH PASSWORD '23' SUPERUSER;`);
      console.log('✓ Usuário rh-flow criado com sucesso');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('✓ Usuário rh-flow já existe');
        // Resetar a senha
        await client.query(`ALTER USER "rh-flow" WITH PASSWORD '23';`);
        console.log('✓ Senha do usuário rh-flow resetada');
      } else {
        throw err;
      }
    }
    
    console.log('\n✓ Setup do usuário PostgreSQL completo!');
  } catch (err) {
    console.error('Erro ao configurar usuário:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupUser();
