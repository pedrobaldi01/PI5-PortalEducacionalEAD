const memoria = {
  usuarios: [
    {
      id: 1,
      nome: 'Administrador',
      login: 'admin',
      senha: '123456',
      perfil: 'administrador',
      origemId: null
    }
  ],
  sessoes: [],
  alunos: [],
  professores: [],
  cursos: [],
  disciplinas: [],
  turmas: []
};

const contadores = {
  usuarios: 2,
  alunos: 1,
  professores: 1,
  cursos: 1,
  disciplinas: 1,
  turmas: 1
};

function gerarId(colecao) {
  const id = contadores[colecao];
  contadores[colecao] += 1;
  return id;
}

module.exports = {
  memoria,
  gerarId
};
