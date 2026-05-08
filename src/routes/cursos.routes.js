const express = require('express');

const {
  criarCurso,
  listarCursos
} = require('../controllers/cursos.controller');

const router = express.Router();

router.get('/', listarCursos);
router.post('/', criarCurso);

module.exports = router;
