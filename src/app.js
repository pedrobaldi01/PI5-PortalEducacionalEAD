const express = require('express');
const path = require('node:path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimitModule = require('express-rate-limit');

const env = require('./config/env');
const autenticar = require('./middlewares/auth.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const alunosRoutes = require('./routes/alunos.routes');
const professoresRoutes = require('./routes/professores.routes');
const cursosRoutes = require('./routes/cursos.routes');
const disciplinasRoutes = require('./routes/disciplinas.routes');
const turmasRoutes = require('./routes/turmas.routes');
const matriculasRoutes = require('./routes/matriculas.routes');
const materiaisRoutes = require('./routes/materiais.routes');
const atividadesRoutes = require('./routes/atividades.routes');
const enviosAtividadesRoutes = require('./routes/enviosAtividades.routes');
const notasRoutes = require('./routes/notas.routes');
const avisosRoutes = require('./routes/avisos.routes');
const arquivosRoutes = require('./routes/arquivos.routes');

const rateLimit = rateLimitModule.rateLimit || rateLimitModule;
const app = express();

app.disable('x-powered-by');
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: env.corsOrigin === '*' ? true : env.corsOrigin,
  credentials: env.corsOrigin !== '*'
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const loginLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  limit: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de login. Aguarde e tente novamente.' }
});

app.get('/', (_req, res) => {
  res.status(200).json({
    mensagem: 'API EAD em execução.',
    health: '/health',
    login: 'POST /auth/login'
  });
});

app.use('/health', healthRoutes);
app.use('/auth/login', loginLimiter);
app.use('/auth', authRoutes);

app.use('/alunos', autenticar, alunosRoutes);
app.use('/professores', autenticar, professoresRoutes);
app.use('/cursos', autenticar, cursosRoutes);
app.use('/disciplinas', autenticar, disciplinasRoutes);
app.use('/turmas', autenticar, turmasRoutes);
app.use('/matriculas', autenticar, matriculasRoutes);
app.use('/materiais', autenticar, materiaisRoutes);
app.use('/atividades', autenticar, atividadesRoutes);
app.use('/envios-atividades', autenticar, enviosAtividadesRoutes);
app.use('/notas', autenticar, notasRoutes);
app.use('/avisos', autenticar, avisosRoutes);
app.use('/arquivos', autenticar, arquivosRoutes);

app.use((_req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

app.use(errorMiddleware);

module.exports = app;
