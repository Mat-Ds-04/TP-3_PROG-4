const express = require('express');
const { body, cuerpo, datosValidados, idParam, listaQuery, sinConsulta, validar } = require('./validaciones');
const pool = require('./db');

const router = express.Router();
const joins = `FROM viajes v
  INNER JOIN vehiculos ve ON ve.id = v.vehiculo_id
  INNER JOIN conductores co ON co.id = v.conductor_id`;
const columnas = `v.id, v.vehiculo_id AS vehiculoId, v.conductor_id AS conductorId,
  v.fecha_salida AS fechaSalida, v.fecha_llegada AS fechaLlegada,
  v.origen, v.destino, v.kilometros, v.observaciones,
  ve.patente AS patenteVehiculo, co.nombre AS nombreConductor, co.apellido AS apellidoConductor`;
const campos = [
  'vehiculoId',
  'conductorId',
  'fechaSalida',
  'fechaLlegada',
  'origen',
  'destino',
  'kilometros',
  'observaciones',
];
const camposRequeridos = ['vehiculoId', 'conductorId', 'fechaSalida', 'origen', 'destino', 'kilometros'];

const fechaSql = (valor) => {
  if (/Z$|[+-]\d{2}:\d{2}$/.test(valor)) {
    return new Date(valor).toISOString().slice(0, 19).replace('T', ' ');
  }
  const fecha = valor.replace('T', ' ');
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(fecha) ? `${fecha}:00` : fecha;
};

const datosViaje = [
  cuerpo(campos, camposRequeridos),
  body('vehiculoId').isInt({ min: 1 }).withMessage('vehiculoId debe ser un entero positivo').toInt(),
  body('conductorId').isInt({ min: 1 }).withMessage('conductorId debe ser un entero positivo').toInt(),
  body('fechaSalida').isISO8601({ strict: true, strictSeparator: true }).withMessage('fechaSalida debe ser una fecha y hora válida'),
  body('fechaLlegada').optional({ values: 'null' })
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('fechaLlegada debe ser una fecha y hora válida')
    .bail()
    .custom((fecha, { req }) => {
      if (!Date.parse(fecha) || !Date.parse(req.body.fechaSalida)) return true;
      return Date.parse(fecha) >= Date.parse(req.body.fechaSalida);
    })
    .withMessage('fechaLlegada no puede ser anterior a fechaSalida'),
  body('origen').trim().isLength({ min: 1, max: 150 }).withMessage('origen es obligatorio y no debe superar 150 caracteres'),
  body('destino').trim().isLength({ min: 1, max: 150 }).withMessage('destino es obligatorio y no debe superar 150 caracteres'),
  body('kilometros').isFloat({ gt: 0, max: 99999999.99 })
    .withMessage('kilometros debe ser mayor que cero')
    .bail()
    .custom((valor) => /^\d+(?:\.\d{1,2})?$/.test(String(valor)))
    .withMessage('kilometros admite hasta dos decimales')
    .toFloat(),
  body('observaciones').optional({ values: 'null' }).isString().isLength({ max: 5000 })
    .withMessage('observaciones no debe superar 5000 caracteres'),
  validar,
];

const obtenerViaje = async (id) => {
  const [viajes] = await pool.execute(`SELECT ${columnas} ${joins} WHERE v.id = ?`, [id]);
  return viajes[0];
};

router.get('/resumen', listaQuery(['vehiculoId', 'conductorId']), async (req, res) => {
  const filtros = datosValidados(req, ['query']);
  const condicionViajesVehiculo = ['v.vehiculo_id = ve.id'];
  const valoresViajesVehiculo = [];
  const condicionViajesConductor = ['v.conductor_id = co.id'];
  const valoresViajesConductor = [];
  if (filtros.conductorId) {
    condicionViajesVehiculo.push('v.conductor_id = ?');
    valoresViajesVehiculo.push(filtros.conductorId);
  }
  if (filtros.vehiculoId) {
    condicionViajesConductor.push('v.vehiculo_id = ?');
    valoresViajesConductor.push(filtros.vehiculoId);
  }
  const vehiculo = filtros.vehiculoId ? 'WHERE ve.id = ?' : '';
  const conductor = filtros.conductorId ? 'WHERE co.id = ?' : '';
  if (filtros.vehiculoId) valoresViajesVehiculo.push(filtros.vehiculoId);
  if (filtros.conductorId) valoresViajesConductor.push(filtros.conductorId);
  const [vehiculos] = await pool.execute(
    `SELECT ve.id, ve.patente, ve.marca, ve.modelo,
        COALESCE(SUM(v.kilometros), 0) AS totalKilometros
     FROM vehiculos ve
     LEFT JOIN viajes v ON ${condicionViajesVehiculo.join(' AND ')}
     ${vehiculo}
     GROUP BY ve.id, ve.patente, ve.marca, ve.modelo
     ORDER BY ve.id`,
    valoresViajesVehiculo,
  );
  const [conductores] = await pool.execute(
    `SELECT co.id, co.nombre, co.apellido,
        COALESCE(SUM(v.kilometros), 0) AS totalKilometros
     FROM conductores co
     LEFT JOIN viajes v ON ${condicionViajesConductor.join(' AND ')}
     ${conductor}
     GROUP BY co.id, co.nombre, co.apellido
     ORDER BY co.id`,
    valoresViajesConductor,
  );

  res.json({
    data: {
      vehiculos: vehiculos.map((vehiculoActual) => ({
        ...vehiculoActual,
        totalKilometros: Number(vehiculoActual.totalKilometros),
      })),
      conductores: conductores.map((conductorActual) => ({
        ...conductorActual,
        totalKilometros: Number(conductorActual.totalKilometros),
      })),
    },
  });
});

router.get('/', listaQuery(['vehiculoId', 'conductorId']), async (req, res) => {
  const filtros = datosValidados(req, ['query']);
  const condiciones = [];
  const valores = [];
  if (filtros.vehiculoId) {
    condiciones.push('v.vehiculo_id = ?');
    valores.push(filtros.vehiculoId);
  }
  if (filtros.conductorId) {
    condiciones.push('v.conductor_id = ?');
    valores.push(filtros.conductorId);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const limit = filtros.limit || 50;
  const offset = filtros.offset || 0;
  const [viajes] = await pool.execute(
    `SELECT ${columnas} ${joins} ${where} ORDER BY v.fecha_salida DESC, v.id DESC LIMIT ? OFFSET ?`,
    [...valores, limit, offset],
  );
  res.json({ data: viajes, pagination: { limit, offset } });
});

router.get('/:id', [...idParam, ...sinConsulta], async (req, res) => {
  const { id } = datosValidados(req, ['params']);
  const viaje = await obtenerViaje(id);
  if (!viaje) return res.status(404).json({ error: 'Viaje no encontrado' });
  res.json({ data: viaje });
});

router.post('/', sinConsulta, datosViaje, async (req, res) => {
  const datos = datosValidados(req, ['body']);
  const [resultado] = await pool.execute(
    `INSERT INTO viajes
      (vehiculo_id, conductor_id, fecha_salida, fecha_llegada, origen, destino, kilometros, observaciones)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      datos.vehiculoId,
      datos.conductorId,
      fechaSql(datos.fechaSalida),
      datos.fechaLlegada ? fechaSql(datos.fechaLlegada) : null,
      datos.origen,
      datos.destino,
      datos.kilometros,
      datos.observaciones || null,
    ],
  );
  res.status(201).json({ data: await obtenerViaje(resultado.insertId) });
});

router.put('/:id', [...idParam, ...sinConsulta, ...datosViaje], async (req, res) => {
  const { id } = datosValidados(req, ['params']);
  const datos = datosValidados(req, ['body']);
  const [resultado] = await pool.execute(
    `UPDATE viajes
     SET vehiculo_id = ?, conductor_id = ?, fecha_salida = ?, fecha_llegada = ?,
         origen = ?, destino = ?, kilometros = ?, observaciones = ?
     WHERE id = ?`,
    [
      datos.vehiculoId,
      datos.conductorId,
      fechaSql(datos.fechaSalida),
      datos.fechaLlegada ? fechaSql(datos.fechaLlegada) : null,
      datos.origen,
      datos.destino,
      datos.kilometros,
      datos.observaciones || null,
      id,
    ],
  );
  if (!resultado.affectedRows) {
    const [existentes] = await pool.execute('SELECT id FROM viajes WHERE id = ?', [id]);
    if (!existentes.length) return res.status(404).json({ error: 'Viaje no encontrado' });
  }
  res.json({ data: await obtenerViaje(id) });
});

router.delete('/:id', [...idParam, ...sinConsulta], async (req, res) => {
  const { id } = datosValidados(req, ['params']);
  const [resultado] = await pool.execute('DELETE FROM viajes WHERE id = ?', [id]);
  if (!resultado.affectedRows) return res.status(404).json({ error: 'Viaje no encontrado' });
  res.status(204).end();
});

module.exports = router;
