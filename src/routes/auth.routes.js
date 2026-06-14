const express = require('express');
const asyncHandler = require('../utils/async-handler');
const autenticar = require('../middlewares/auth.middleware');
const controller = require('../controllers/auth.controller');

const router = express.Router();
router.post('/login', asyncHandler(controller.login));
router.get('/me', autenticar, controller.verPerfil);
module.exports = router;
