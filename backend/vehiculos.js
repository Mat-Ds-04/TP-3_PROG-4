const express = require('express');
const { body, cuerpo, datosValidados, idParam, listaQuery, sinConsulta, validar } = require('./validaciones');
const pool = require('./db');

const router = express.Router();
const columnas = 'id, marca, modelo, patente, anio, capacidad_carga AS capacidadCarga';
const campos = ['marca', 'modelo', 'patente', 'anio', 'capacidadCarga'];

const datosVehiculo = [
  cuerpo(campos),
  body('marca').trim().isLength({ min: 1, max: 100 }).withMessage('marca es obligatoria y no debe superar 100 caracteres'),
  body('modelo').trim().isLength({ min: 1, max: 100 }).withMessage('modelo es obligatorio y no debe superar 100 caracteres'),
  body('patente').trim().isLength({ min: 1, max: 20 }).withMessage('patente es obligatoria y no debe superar 20 caracteres'),
  body('anio').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('anio no es válido').toInt(),
  body('capacidadCarga').isFloat({ gt: 0, max: 99999999.99 })
    .withMessage('capacidadCarga debe ser mayor que cero')
    .bail()
    .custom((valor) => /^\d+(?:\.\d{1,2})?$/.test(String(valor)))
    .withMessage('capacidadCarga admite hasta dos decimales')
    .toFloat(),
  validar,
];

router.get('/', listaQuery(), async (req, res) => {
  const { limit = 50, offset = 0 } = datosValidados(req, ['query']);
  const [vehiculos] = await pool.execute(
    `SELECT ${columnas} FROM vehiculos ORDER BY id LIMIT ? OFFSET ?`,
    [limit, offset],
  );
  res.json({ data: vehiculos, pagination: { limit, offset } });
});

router.get('/:id', [...idParam, ...sinConsulta], async (req, res) => {
  const { id } = datosValidados(req, ['params']);
  const [vehiculos] = await pool.execute(`SELECT ${columnas} FROM vehiculos WHERE id = ?`, [id]);
  if (!vehiculos.length) return res.status(404).json({ error: 'Vehículo no encontrado' });
  res.json({ data: vehiculos[0] });
});

router.post('/', sinConsulta, datosVehiculo, async (req, res) => {
  const { marca, modelo, patente, anio, capacidadCarga } = datosValidados(req, ['body']);
  const [resultado] = await pool.execute(
    'INSERT INTO vehiculos (marca, modelo, patente, anio, capacidad_carga) VALUES (?, ?, ?, ?, ?)',
    [marca, modelo, patente, anio, capacidadCarga],
  );
  res.status(201).json({ data: { id: resultado.insertId, marca, modelo, patente, anio, capacidadCarga } });
});

router.put('/:id', [...idParam, ...sinConsulta, ...datosVehiculo], async (req, res) => {
  const { id } = datosValidados(req, ['params']);
  const { marca, modelo, patente, anio, capacidadCarga } = datosValidados(req, ['body']);
  const [resultado] = await pool.execute(
    'UPDATE vehiculos SET marca = ?, modelo = ?, patente = ?, anio = ?, capacidad_carga = ? WHERE id = ?',
    [marca, modelo, patente, anio, capacidadCarga, id],
  );
  if (!resultado.affectedRows) {
    const [existentes] = await pool.execute('SELECT id FROM vehiculos WHERE id = ?', [id]);
    if (!existentes.length) return res.status(404).json({ error: 'Vehículo no encontrado' });
  }
  res.json({ data: { id, marca, modelo, patente, anio, capacidadCarga } });
});

router.delete('/:id', [...idParam, ...sinConsulta], async (req, res) => {
  const { id } = datosValidados(req, ['params']);
  const [resultado] = await pool.execute('DELETE FROM vehiculos WHERE id = ?', [id]);
  if (!resultado.affectedRows) return res.status(404).json({ error: 'Vehículo no encontrado' });
  res.status(204).end();
});

module.exports = router;
