const express = require('express');

const {
  criarAluno,
  listarAlunos
} = require('../controllers/alunos.controller');

const permitirPerfis = require('../middlewares/perfil.middleware');

const router = express.Router();


router.get(
  '/',
  permitirPerfis('Administrador'),
  listarAlunos
);

router.post(
  '/',
  permitirPerfis('Administrador'),
  criarAluno
);

module.exports = router;