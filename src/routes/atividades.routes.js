const express = require('express');

const {
  criarAtividade,
  listarAtividades
} = require('../controllers/atividades.controller');

const router = express.Router();

router.get('/', listarAtividades);
router.post('/', criarAtividade);

module.exports = router;
