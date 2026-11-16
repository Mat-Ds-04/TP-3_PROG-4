require('dotenv').config();
const cors = require('cors');
const express = require('express');
const passport = require('passport');
const pool = require('./db');
const { router: authRouter, autenticar } = require('./auth');
const conductoresRouter = require('./conductores');
const vehiculosRouter = require('./vehiculos');
const viajesRouter = require('./viajes');

const app = express();
const origenesFrontend = new Set([
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
]);
app.use(cors({
  origin: (origen, callback) => {
    if (!origen || origenesFrontend.has(origen)) return callback(null, true);
    callback(new Error('Origen no permitido'));
  },
}));
app.use(express.json({ limit: '16kb' }));
app.use(passport.initialize());

app.get('/api/status', async (req, res) => {
  await pool.execute('SELECT 1');
  res.json({ data: { estado: 'activo', empresa: 'TransPort 3000 S.A' } });
});
app.use('/api/auth', authRouter);
app.use('/api/vehiculos', autenticar, vehiculosRouter);
app.use('/api/conductores', autenticar, conductoresRouter);
app.use('/api/viajes', autenticar, viajesRouter);

app.use((req, res) => res.status(404).json({ error: 'Recurso no encontrado' }));

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'El cuerpo debe contener JSON válido' });
  }
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos únicos' });
  }
  if (['ER_ROW_IS_REFERENCED_2', 'ER_ROW_IS_REFERENCED'].includes(error.code)) {
    return res.status(409).json({ error: 'No se puede eliminar el registro porque tiene viajes asociados' });
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(409).json({ error: 'El vehículo o conductor indicado ya no existe' });
  }
  console.error(error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

if (require.main === module) {
  const puerto = Number(process.env.PORT || 3001);
  const servidor = app.listen(puerto, () => {
    console.log(`API de TransPort 3000 S.A escuchando en el puerto ${puerto}`);
  });

  const cerrar = () => {
    servidor.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };
  process.on('SIGINT', cerrar);
  process.on('SIGTERM', cerrar);
}

module.exports = app;
