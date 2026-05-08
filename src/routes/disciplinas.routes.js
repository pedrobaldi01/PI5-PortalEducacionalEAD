const express = require('express');

const {
  criarDisciplina,
  listarDisciplinas
} = require('../controllers/disciplinas.controller');

const router = express.Router();

router.get('/', listarDisciplinas);
router.post('/', criarDisciplina);

module.exports = router;
