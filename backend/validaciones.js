const { body, matchedData, param, query, validationResult } = require('express-validator');

const validar = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errors: errores.array() });
  }
  next();
};

const cuerpo = (permitidos, requeridos = permitidos) => body().custom((valor) => {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    throw new Error('El cuerpo debe ser un objeto JSON');
  }

  const desconocidos = Object.keys(valor).filter((campo) => !permitidos.includes(campo));
  if (desconocidos.length) {
    throw new Error(`Campos no admitidos: ${desconocidos.join(', ')}`);
  }

  const faltantes = requeridos.filter((campo) => !Object.hasOwn(valor, campo));
  if (faltantes.length) {
    throw new Error(`Faltan campos obligatorios: ${faltantes.join(', ')}`);
  }

  return true;
});

const sinConsulta = [
  query().custom((valor) => {
    if (Object.keys(valor).length) {
      throw new Error('Este recurso no admite parámetros de consulta');
    }
    return true;
  }),
  validar,
];

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('id debe ser un entero positivo').toInt(),
  validar,
];

const listaQuery = (permitidos = []) => [
  query().custom((valor) => {
    const desconocidos = Object.keys(valor).filter(
      (campo) => !['limit', 'offset', ...permitidos].includes(campo),
    );
    if (desconocidos.length) {
      throw new Error(`Parámetros de consulta no admitidos: ${desconocidos.join(', ')}`);
    }
    return true;
  }),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100').toInt(),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset debe ser un entero no negativo').toInt(),
  ...permitidos.map((campo) => query(campo).optional().isInt({ min: 1 }).withMessage(`${campo} debe ser un entero positivo`).toInt()),
  validar,
];

const datosValidados = (req, ubicaciones) => matchedData(req, { locations: ubicaciones });

module.exports = { body, cuerpo, datosValidados, idParam, listaQuery, sinConsulta, validar };
