const express = require('express');
const { body, cuerpo, datosValidados, idParam, listaQuery, sinConsulta, validar } = require('./validaciones');
const pool = require('./db');

const router = express.Router();
const columnas = [
  'id',
  'nombre',
  'apellido',
  'numero_documento AS numeroDocumento',
  'numero_licencia AS numeroLicencia',
  'fecha_alta_licencia AS fechaAltaLicencia',
  'fecha_vencimiento_licencia AS fechaVencimientoLicencia',
].join(', ');
const campos = [
  'nombre',
  'apellido',
  'numeroDocumento',
  'numeroLicencia',
  'fechaAltaLicencia',
  'fechaVencimientoLicencia',
];

const datosConductor = [
  cuerpo(campos),
  body('nombre').trim().isLength({ min: 1, max: 100 }).withMessage('nombre es obligatorio y no debe superar 100 caracteres'),
  body('apellido').trim().isLength({ min: 1, max: 100 }).withMessage('apellido es obligatorio y no debe superar 100 caracteres'),
  body('numeroDocumento').trim().isLength({ min: 1, max: 30 }).withMessage('numeroDocumento es obligatorio y no debe superar 30 caracteres'),
  body('numeroLicencia').trim().isLength({ min: 1, max: 30 }).withMessage('numeroLicencia es obligatorio y no debe superar 30 caracteres'),
  body('fechaAltaLicencia').isDate({ format: 'YYYY-MM-DD', strictMode: true }).withMessage('fechaAltaLicencia debe tener formato YYYY-MM-DD'),
  body('fechaVencimientoLicencia').isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('fechaVencimientoLicencia debe tener formato YYYY-MM-DD')
    .bail()
    .custom((fecha, { req }) => fecha > req.body.fechaAltaLicencia)
    .withMessage('fechaVencimientoLicencia debe ser posterior a fechaAltaLicencia'),
  validar,
];

router.get('/', listaQuery(), async (req, res) => {
  const { limit = 50, offset = 0 } = datosValidados(req, ['query']);
  const [conductores] = await pool.execute(
    `SELECT ${columnas} FROM conductores ORDER BY id LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  res.json({ data: conductores, pagination: { limit, offset } });
});

router.get('/:id', [...idParam, ...sinConsulta], async (req, res) => {
  const { id } = datosValidados(req, ['params']);
  const [conductores] = await pool.execute(`SELECT ${columnas} FROM conductores WHERE id = ?`, [id]);
  if (!conductores.length) return res.status(404).json({ error: 'Conductor no encontrado' });
  res.json({ data: conductores[0] });
});

router.post('/', sinConsulta, datosConductor, async (req, res) => {
  const {
    nombre, apellido, numeroDocumento, numeroLicencia, fechaAltaLicencia, fechaVencimientoLicencia,
  } = datosValidados(req, ['body']);
  const [resultado] = await pool.execute(
    `INSERT INTO conductores
      (nombre, apellido, numero_documento, numero_licencia, fecha_alta_licencia, fecha_vencimiento_licencia)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nombre, apellido, numeroDocumento, numeroLicencia, fechaAltaLicencia, fechaVencimientoLicencia],
  );
  res.status(201).json({
    data: {
      id: resultado.insertId,
      nombre,
      apellido,
      numeroDocumento,
      numeroLicencia,
      fechaAltaLicencia,
      fechaVencimientoLicencia,
    },
  });
});

router.put('/:id', [...idParam, ...sinConsulta, ...datosConductor], async (req, res) => {
  const { id } = datosValidados(req, ['params']);
  const {
    nombre, apellido, numeroDocumento, numeroLicencia, fechaAltaLicencia, fechaVencimientoLicencia,
  } = datosValidados(req, ['body']);
  const [resultado] = await pool.execute(
    `UPDATE conductores
     SET nombre = ?, apellido = ?, numero_documento = ?, numero_licencia = ?,
         fecha_alta_licencia = ?, fecha_vencimiento_licencia = ?
     WHERE id = ?`,
    [nombre, apellido, numeroDocumento, numeroLicencia, fechaAltaLicencia, fechaVencimientoLicencia, id],
  );
  if (!resultado.affectedRows) {
    const [existentes] = await pool.execute('SELECT id FROM conductores WHERE id = ?', [id]);
    if (!existentes.length) return res.status(404).json({ error: 'Conductor no encontrado' });
  }
  res.json({
    data: {
      id,
      nombre,
      apellido,
      numeroDocumento,
      numeroLicencia,
      fechaAltaLicencia,
      fechaVencimientoLicencia,
    },
  });
});

router.delete('/:id', [...idParam, ...sinConsulta], async (req, res) => {
  const { id } = datosValidados(req, ['params']);
  const [resultado] = await pool.execute('DELETE FROM conductores WHERE id = ?', [id]);
  if (!resultado.affectedRows) return res.status(404).json({ error: 'Conductor no encontrado' });
  res.status(204).end();
});

module.exports = router;
