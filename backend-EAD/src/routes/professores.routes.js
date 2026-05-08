const express = require('express');

const {
  criarProfessor,
  listarProfessores
} = require('../controllers/professores.controller');

const router = express.Router();

router.get('/', listarProfessores);
router.post('/', criarProfessor);

module.exports = router;
