const express = require('express');

const {
  criarAluno,
  listarAlunos
} = require('../controllers/alunos.controller');

const router = express.Router();

router.get('/', listarAlunos);
router.post('/', criarAluno);

module.exports = router;
