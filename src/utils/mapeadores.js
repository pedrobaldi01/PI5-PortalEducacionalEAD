function formatarData(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  return String(valor).slice(0, 10);
}

function formatarDataHora(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor.toISOString();
  return valor;
}

function formatarUsuario(usuario) {
  return {
    id: usuario.usuario_id,
    nome: usuario.nome,
    cpf: usuario.cpf,
    dataNascimento: formatarData(usuario.data_nascimento),
    email: usuario.email,
    telefone: usuario.telefone,
    endereco: usuario.endereco,
    login: usuario.login,
    tipo: usuario.tipo,
    perfil: usuario.tipo ? usuario.tipo.toLowerCase() : null,
    status: usuario.status,
    alunoId: usuario.aluno_id || null,
    professorId: usuario.professor_id || null,
    dataCadastro: formatarDataHora(usuario.data_cadastro)
  };
}

module.exports = { formatarData, formatarDataHora, formatarUsuario };
