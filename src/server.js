const app = require('./app');
const env = require('./config/env');
const { testarConexao } = require('./database/conexao');

async function iniciar() {
  try {
    const banco = await testarConexao();

    const servidor = app.listen(env.port, () => {
      console.log('----------------------------------------');
      console.log('Portal Educacional EAD');
      console.log(`Servidor: http://localhost:${env.port}`);
      console.log(`Banco conectado: ${banco.banco}`);
      console.log('----------------------------------------');
    });

    servidor.on('error', (erro) => {
      if (erro.code === 'EADDRINUSE') {
        console.error(`A porta ${env.port} já está em uso.`);
      } else {
        console.error('Erro ao iniciar o servidor:', erro.message);
      }
      process.exit(1);
    });
  } catch (erro) {
    console.error('Não foi possível iniciar o servidor.');
    console.error(`Detalhes: ${erro.message}`);
    process.exit(1);
  }
}

iniciar();
