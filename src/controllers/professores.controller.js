const { executar, transacao } = require('../database/conexao');
const { formatarDataHora } = require('../utils/mapeadores');
const { gerarHashSenha } = require('../utils/senhas');
const {
  textoValido,
  emailValido,
  cpfValido,
  somenteDigitos,
  normalizarEmail,
  exigirCampos
} = require('../utils/validacoes');
const AppError = require('../utils/app-error');
const { obterId } = require('../utils/controller-helpers');

function formatarProfessor(linha) {
  return {
    id: linha.professor_id,
    usuarioId: linha.usuario_id,
    nome: linha.nome,
    cpf: linha.cpf,
    especialidade: linha.especialidade,
    email: linha.email,
    telefone: linha.telefone,
    endereco: linha.endereco,
    login: linha.login,
    status: linha.status,
    criadoEm: formatarDataHora(linha.data_cadastro)
  };
}

const selectBase = `
  SELECT p.professor_id, p.especialidade, u.usuario_id, u.nome, u.cpf,
         u.email, u.telefone, u.endereco, u.login, u.status, u.data_cadastro
    FROM Professor p
    JOIN Usuario u ON u.usuario_id = p.usuario_id
`;

async function buscarRegistro(id) {
  const linhas = await executar(`${selectBase} WHERE p.professor_id = ? LIMIT 1`, [id]);
  if (!linhas[0]) throw new AppError(404, 'Professor não encontrado.');
  return linhas[0];
}

async function listarProfessores(_req, res) {
  const linhas = await executar(`${selectBase} WHERE u.status = 'Ativo' ORDER BY u.nome`);
  return res.status(200).json({ total: linhas.length, dados: linhas.map(formatarProfessor) });
}

async function buscarProfessorPorId(req, res) {
  const registro = await buscarRegistro(obterId(req.params.id));
  return res.status(200).json({ dados: formatarProfessor(registro) });
}

async function buscarMeuPerfil(req, res) {
  if (!req.usuario.professor_id) throw new AppError(404, 'Perfil de professor não encontrado.');
  const registro = await buscarRegistro(req.usuario.professor_id);
  return res.status(200).json({ dados: formatarProfessor(registro) });
}

async function criarProfessor(req, res) {
  const faltantes = exigirCampos(req.body, [
    'nome', 'cpf', 'especialidade', 'email', 'telefone', 'login', 'senha'
  ]);
  if (faltantes.length) throw new AppError(400, `Campos obrigatórios: ${faltantes.join(', ')}.`);

  const cpf = somenteDigitos(req.body.cpf);
  const email = normalizarEmail(req.body.email);
  if (!cpfValido(cpf)) throw new AppError(400, 'CPF inválido.');
  if (!emailValido(email)) throw new AppError(400, 'E-mail inválido.');
  if (String(req.body.senha).length < 6) throw new AppError(400, 'A senha deve possuir ao menos 6 caracteres.');

  const dados = await transacao(async (conexao) => {
    const [duplicados] = await conexao.execute(
      'SELECT usuario_id FROM Usuario WHERE login = ? OR email = ? OR cpf = ? LIMIT 1',
      [req.body.login.trim(), email, cpf]
    );
    if (duplicados.length) throw new AppError(409, 'Login, e-mail ou CPF já cadastrado.');

    const [usuarioResultado] = await conexao.execute(
      `INSERT INTO Usuario
        (nome, cpf, email, telefone, endereco, login, senha, tipo)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Professor')`,
      [
        req.body.nome.trim(), cpf, email, req.body.telefone.trim(),
        textoValido(req.body.endereco) ? req.body.endereco.trim() : null,
        req.body.login.trim(), await gerarHashSenha(req.body.senha)
      ]
    );

    const [professorResultado] = await conexao.execute(
      'INSERT INTO Professor (usuario_id, especialidade) VALUES (?, ?)',
      [usuarioResultado.insertId, req.body.especialidade.trim()]
    );

    const [linhas] = await conexao.execute(
      `${selectBase} WHERE p.professor_id = ? LIMIT 1`,
      [professorResultado.insertId]
    );
    return linhas[0];
  });

  return res.status(201).json({ mensagem: 'Professor criado com sucesso.', dados: formatarProfessor(dados) });
}

async function atualizarProfessor(req, res) {
  const professorId = obterId(req.params.id);
  const atual = await buscarRegistro(professorId);
  const body = req.body;
  const camposUsuario = [];
  const valoresUsuario = [];

  if (Object.hasOwn(body, 'nome')) {
    if (!textoValido(body.nome)) throw new AppError(400, 'Nome inválido.');
    camposUsuario.push('nome = ?'); valoresUsuario.push(body.nome.trim());
  }
  if (Object.hasOwn(body, 'cpf')) {
    const cpf = somenteDigitos(body.cpf);
    if (!cpfValido(cpf)) throw new AppError(400, 'CPF inválido.');
    camposUsuario.push('cpf = ?'); valoresUsuario.push(cpf);
  }
  if (Object.hasOwn(body, 'email')) {
    if (!emailValido(body.email)) throw new AppError(400, 'E-mail inválido.');
    camposUsuario.push('email = ?'); valoresUsuario.push(normalizarEmail(body.email));
  }
  for (const [api, banco] of [['telefone', 'telefone'], ['endereco', 'endereco'], ['login', 'login']]) {
    if (Object.hasOwn(body, api)) {
      if (api !== 'endereco' && !textoValido(body[api])) throw new AppError(400, `${api} inválido.`);
      camposUsuario.push(`${banco} = ?`); valoresUsuario.push(textoValido(body[api]) ? body[api].trim() : null);
    }
  }
  if (Object.hasOwn(body, 'status')) {
    if (!['Ativo', 'Inativo'].includes(body.status)) throw new AppError(400, 'Status deve ser Ativo ou Inativo.');
    camposUsuario.push('status = ?'); valoresUsuario.push(body.status);
  }
  if (Object.hasOwn(body, 'senha')) {
    if (String(body.senha).length < 6) throw new AppError(400, 'A senha deve possuir ao menos 6 caracteres.');
    camposUsuario.push('senha = ?'); valoresUsuario.push(await gerarHashSenha(body.senha));
  }

  await transacao(async (conexao) => {
    if (camposUsuario.length) {
      valoresUsuario.push(atual.usuario_id);
      await conexao.execute(`UPDATE Usuario SET ${camposUsuario.join(', ')} WHERE usuario_id = ?`, valoresUsuario);
    }

    if (Object.hasOwn(body, 'especialidade')) {
      if (!textoValido(body.especialidade)) throw new AppError(400, 'Especialidade inválida.');
      await conexao.execute('UPDATE Professor SET especialidade = ? WHERE professor_id = ?', [body.especialidade.trim(), professorId]);
    }
  });

  if (!camposUsuario.length && !Object.hasOwn(body, 'especialidade')) {
    throw new AppError(400, 'Nenhum campo reconhecido para atualização.');
  }

  const atualizado = await buscarRegistro(professorId);
  return res.status(200).json({ mensagem: 'Professor atualizado com sucesso.', dados: formatarProfessor(atualizado) });
}

async function removerProfessor(req, res) {
  const registro = await buscarRegistro(obterId(req.params.id));
  await executar("UPDATE Usuario SET status = 'Inativo' WHERE usuario_id = ?", [registro.usuario_id]);
  return res.status(200).json({ mensagem: 'Professor inativado com sucesso.' });
}

module.exports = {
  listarProfessores,
  buscarProfessorPorId,
  buscarMeuPerfil,
  criarProfessor,
  atualizarProfessor,
  removerProfessor
};
