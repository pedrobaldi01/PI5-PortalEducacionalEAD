function textoValido(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

function inteiroPositivo(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0;
}

function numeroNaoNegativo(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0;
}

function emailValido(valor) {
  return textoValido(valor) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

function dataISOValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || ''))) return false;
  const data = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === valor;
}

function dataHoraValida(valor) {
  if (!textoValido(valor)) return false;
  return !Number.isNaN(new Date(valor).getTime());
}

function somenteDigitos(valor = '') {
  return String(valor).replace(/\D/g, '');
}

function cpfValido(valor) {
  const cpf = somenteDigitos(valor);

  if (!/^\d{11}$/.test(cpf)) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i += 1) soma += Number(cpf[i]) * (10 - i);
  let d1 = (soma * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== Number(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i += 1) soma += Number(cpf[i]) * (11 - i);
  let d2 = (soma * 10) % 11;
  if (d2 === 10) d2 = 0;

  return d2 === Number(cpf[10]);
}

function normalizarEmail(valor) {
  return String(valor || '').trim().toLowerCase();
}

function normalizarStatus(valor, permitidos) {
  const encontrado = permitidos.find(
    (item) => item.toLocaleLowerCase('pt-BR') === String(valor || '').trim().toLocaleLowerCase('pt-BR')
  );
  return encontrado || null;
}

function exigirCampos(objeto, campos) {
  return campos.filter((campo) => {
    const valor = objeto[campo];
    return valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '');
  });
}

module.exports = {
  textoValido,
  inteiroPositivo,
  numeroNaoNegativo,
  emailValido,
  dataISOValida,
  dataHoraValida,
  somenteDigitos,
  cpfValido,
  normalizarEmail,
  normalizarStatus,
  exigirCampos
};
