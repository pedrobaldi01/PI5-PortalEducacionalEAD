
function permitirPerfis(...perfisPermitidos) {
  const perfisNormalizados = perfisPermitidos.map((perfil) =>
    String(perfil).trim().toLowerCase()
  );

  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        erro: 'Usuário não autenticado.'
      });
    }

    const perfilUsuario = String(
      req.usuario.tipo || req.usuario.perfil || ''
    )
      .trim()
      .toLowerCase();

    if (!perfisNormalizados.includes(perfilUsuario)) {
      return res.status(403).json({
        erro: 'Você não possui permissão para realizar esta operação.',
        perfilNecessario: perfisPermitidos,
        seuPerfil: req.usuario.tipo || req.usuario.perfil
      });
    }

    return next();
  };
}

module.exports = permitirPerfis;