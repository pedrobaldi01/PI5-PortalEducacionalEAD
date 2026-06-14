function permitirPerfis(...perfisPermitidos) {
  const normalizados = perfisPermitidos.map((perfil) =>
    String(perfil).trim().toLocaleLowerCase('pt-BR')
  );

  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ erro: 'Usuário não autenticado.' });
    }

    const perfilAtual = String(req.usuario.tipo || '')
      .trim()
      .toLocaleLowerCase('pt-BR');

    if (!normalizados.includes(perfilAtual)) {
      return res.status(403).json({
        erro: 'Você não possui permissão para realizar esta operação.'
      });
    }

    return next();
  };
}

module.exports = permitirPerfis;
