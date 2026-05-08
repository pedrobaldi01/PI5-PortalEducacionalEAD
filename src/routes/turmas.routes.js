const express = require('express');

const {
  criarTurma,
  listarTurmas
} = require('../controllers/turmas.controller');

const router = express.Router();

router.get('/', listarTurmas);
router.post('/', criarTurma);

module.exports = router;
