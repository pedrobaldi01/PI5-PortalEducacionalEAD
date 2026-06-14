module.exports = function asyncHandler(funcao) {
  return function executarAssincrono(req, res, next) {
    Promise.resolve(funcao(req, res, next)).catch(next);
  };
};
