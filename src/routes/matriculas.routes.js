const express = require('express');

const {
  criarMatricula,
  listarMatriculas
} = require('../controllers/matriculas.controller');

const router = express.Router();

router.get('/', listarMatriculas);
router.post('/', criarMatricula);

module.exports = router;
