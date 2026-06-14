const multer = require('multer');
const AppError = require('../utils/app-error');

function errorMiddleware(erro, req, res, next) {
  if (res.headersSent) return next(erro);

  if (erro instanceof multer.MulterError) {
    const mensagem = erro.code === 'LIMIT_FILE_SIZE'
      ? 'Arquivo maior que o limite permitido.'
      : 'Falha no upload do arquivo.';

    return res.status(400).json({ erro: mensagem, detalhe: erro.message });
  }

  if (erro instanceof AppError || erro.statusCode) {
    return res.status(erro.statusCode || 400).json({
      erro: erro.message,
      detalhes: erro.details || undefined
    });
  }

  const errosBanco = {
    ER_DUP_ENTRY: [409, 'Registro duplicado. Verifique CPF, e-mail, login, código ou vínculo.'],
    ER_NO_REFERENCED_ROW_2: [400, 'Um dos registros relacionados não existe.'],
    ER_ROW_IS_REFERENCED_2: [409, 'O registro não pode ser excluído porque possui vínculos.'],
    ER_CHECK_CONSTRAINT_VIOLATED: [400, 'Os dados violam uma regra do banco.'],
    ER_DATA_TOO_LONG: [400, 'Um dos campos ultrapassa o tamanho permitido.'],
    WARN_DATA_TRUNCATED: [400, 'Valor inválido para um dos campos.']
  };

  if (errosBanco[erro.code]) {
    const [status, mensagem] = errosBanco[erro.code];
    return res.status(status).json({ erro: mensagem });
  }

  if (['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'].includes(erro.code)) {
    return res.status(500).json({
      erro: 'Falha ao conectar ao banco de dados. Confira o MySQL e o arquivo .env.'
    });
  }

  console.error('Erro não tratado:', erro);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = errorMiddleware;
