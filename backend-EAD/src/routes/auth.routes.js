const express = require('express');

const {
  login,
  verPerfil
} = require('../controllers/auth.controller');

const autenticar = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/login', login);
router.get('/me', autenticar, verPerfil);

module.exports = router;
