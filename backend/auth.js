const bcrypt = require('bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const pool = require('./db');
const { body, cuerpo, datosValidados, sinConsulta, validar } = require('./validaciones');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
}

passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
  },
  (payload, done) => {
    if (!payload.sub) return done(null, false);

    pool.execute('SELECT id, nombre, email FROM usuarios WHERE id = ?', [payload.sub])
      .then(([usuarios]) => {
        if (!usuarios.length) return done(null, false);
        done(null, usuarios[0]);
      })
      .catch(done);
  },
));

const router = express.Router();
const autenticar = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (error, usuario) => {
    if (error) return next(error);
    if (!usuario) return res.status(401).json({ error: 'Se requiere autenticación' });
    req.user = usuario;
    next();
  })(req, res, next);
};
const credencialesRegistro = [
  cuerpo(['nombre', 'email', 'contrasena']),
  body('nombre').trim().isLength({ min: 2, max: 100 }).withMessage('nombre debe tener entre 2 y 100 caracteres'),
  body('email').trim().isEmail().isLength({ max: 255 }).withMessage('email debe ser válido y no superar 255 caracteres').toLowerCase(),
  body('contrasena').isString().isLength({ min: 8, max: 72 })
    .withMessage('contrasena debe tener entre 8 y 72 caracteres')
    .bail()
    .custom((valor) => Buffer.byteLength(valor, 'utf8') <= 72)
    .withMessage('contrasena no puede superar 72 bytes'),
  validar,
];
const credencialesInicio = [
  cuerpo(['email', 'contrasena']),
  body('email').trim().isEmail().isLength({ max: 255 }).withMessage('email debe ser válido y no superar 255 caracteres').toLowerCase(),
  body('contrasena').isString().isLength({ min: 1, max: 72 }).withMessage('contrasena no es válida'),
  validar,
];

router.post('/register', sinConsulta, credencialesRegistro, async (req, res) => {
  const { nombre, email, contrasena } = datosValidados(req, ['body']);
  const hash = await bcrypt.hash(contrasena, 10);
  const [resultado] = await pool.execute(
    'INSERT INTO usuarios (nombre, email, contrasena) VALUES (?, ?, ?)',
    [nombre, email, hash],
  );

  res.status(201).json({ data: { id: resultado.insertId, nombre, email } });
});

router.post('/login', sinConsulta, credencialesInicio, async (req, res) => {
  const { email, contrasena } = datosValidados(req, ['body']);
  const [usuarios] = await pool.execute(
    'SELECT id, nombre, email, contrasena FROM usuarios WHERE email = ?',
    [email],
  );

  if (!usuarios.length || !(await bcrypt.compare(contrasena, usuarios[0].contrasena))) {
    return res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }

  const usuario = usuarios[0];
  const token = jwt.sign(
    { nombre: usuario.nombre, email: usuario.email },
    process.env.JWT_SECRET,
    { subject: String(usuario.id), expiresIn: '4h' },
  );
  res.json({ data: { token, user: { id: usuario.id, nombre: usuario.nombre, email: usuario.email } } });
});

router.get('/me', autenticar, sinConsulta, (req, res) => {
  res.json({ data: req.user });
});

module.exports = { autenticar, router };
