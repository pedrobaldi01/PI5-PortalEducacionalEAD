const express = require('express');

const {
  criarEnvioAtividade,
  listarEnviosAtividades
} = require('../controllers/enviosAtividades.controller');

const router = express.Router();

router.get('/', listarEnviosAtividades);
router.post('/', criarEnvioAtividade);

module.exports = router;
