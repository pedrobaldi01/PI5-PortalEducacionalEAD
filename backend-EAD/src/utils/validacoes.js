function textoValido(valor) {
  return typeof valor === 'string' && valor.trim() !== '';
}

function numeroPositivo(valor) {
  const numero = Number(valor);
  return !Number.isNaN(numero) && numero > 0;
}

function existeLogin(login, usuarios) {
  return usuarios.some((usuario) => usuario.login === login);
}

function removerSenha(usuario) {
  const { senha, ...usuarioSemSenha } = usuario;
  return usuarioSemSenha;
}

module.exports = {
  textoValido,
  numeroPositivo,
  existeLogin,
  removerSenha
};
