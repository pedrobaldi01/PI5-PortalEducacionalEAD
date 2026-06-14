const AppError = require('./app-error');
const { inteiroPositivo } = require('./validacoes');

function obterId(valor, nome = 'ID') {
  if (!inteiroPositivo(valor)) throw new AppError(400, `${nome} inválido.`);
  return Number(valor);
}

function exigirEncontrado(registro, mensagem) {
  if (!registro) throw new AppError(404, mensagem);
  return registro;
}

function montarUpdate(camposPermitidos, dados) {
  const partes = [];
  const valores = [];

  for (const [campoApi, colunaBanco] of Object.entries(camposPermitidos)) {
    if (Object.prototype.hasOwnProperty.call(dados, campoApi)) {
      partes.push(`${colunaBanco} = ?`);
      valores.push(dados[campoApi]);
    }
  }

  return { partes, valores };
}

module.exports = { obterId, exigirEncontrado, montarUpdate };
