const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload');
const { getDb, calcularCosto, getSemestre, getAnio } = require('../database');

// GET /api/solicitudes/calcular - Calcular costo antes de enviar
router.get('/calcular', (req, res) => {
  const { nombre, curso, paginas } = req.query;
  if (!nombre || !curso || !paginas) {
    return res.status(400).json({ error: 'Faltan parámetros: nombre, curso, paginas' });
  }
  const paginasNum = parseInt(paginas);
  if (isNaN(paginasNum) || paginasNum <= 0) {
    return res.status(400).json({ error: 'La cantidad de páginas debe ser un número positivo' });
  }
  try {
    const db = getDb();
    const resultado = calcularCosto(db, nombre, curso, paginasNum);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/solicitudes - Crear nueva solicitud
router.post('/', upload.single('archivo'), (req, res) => {
  const { nombre, curso, numero_lista, correo, paginas, observaciones } = req.body;

  // Validaciones
  if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
  if (!curso || !curso.trim()) return res.status(400).json({ error: 'El curso es obligatorio' });
  const paginasNum = parseInt(paginas);
  if (!paginas || isNaN(paginasNum) || paginasNum <= 0) {
    return res.status(400).json({ error: 'La cantidad de páginas debe ser un número positivo' });
  }
  if (!req.file) return res.status(400).json({ error: 'Debes subir un archivo para imprimir' });

  try {
    const db = getDb();
    const calculo = calcularCosto(db, nombre.trim(), curso.trim(), paginasNum);

    const stmt = db.prepare(`
      INSERT INTO solicitudes 
        (nombre, curso, numero_lista, correo, paginas, observaciones,
         archivo_nombre, archivo_ruta, archivo_tipo, archivo_tamanio,
         estado, semestre, anio, acumulado_semestre, hojas_excedidas, monto_cobrado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      nombre.trim(),
      curso.trim(),
      numero_lista ? parseInt(numero_lista) : null,
      correo ? correo.trim() : null,
      paginasNum,
      observaciones ? observaciones.trim() : null,
      req.file.originalname,
      req.file.filename,
      req.file.mimetype,
      req.file.size,
      calculo.semestre,
      calculo.anio,
      calculo.nuevo_acumulado,
      calculo.hojas_excedidas,
      calculo.monto_cobrado
    );

    // Log
    db.prepare(`INSERT INTO admin_logs (accion, solicitud_id, detalles, usuario) VALUES (?, ?, ?, ?)`)
      .run('SOLICITUD_CREADA', result.lastInsertRowid, `${nombre} - ${curso} - ${paginasNum} páginas`, 'estudiante');

    const nuevaSolicitud = db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ mensaje: 'Solicitud creada exitosamente', solicitud: nuevaSolicitud, calculo });
  } catch (err) {
    // Borrar archivo si falla la BD
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/solicitudes - Listar con filtros
router.get('/', (req, res) => {
  const { nombre, curso, estado, semestre, anio, fecha_desde, fecha_hasta, page = 1, limit = 50 } = req.query;
  try {
    const db = getDb();
    let where = [];
    let params = [];

    if (nombre) { where.push("LOWER(nombre) LIKE ?"); params.push(`%${nombre.toLowerCase()}%`); }
    if (curso) { where.push("LOWER(curso) LIKE ?"); params.push(`%${curso.toLowerCase()}%`); }
    if (estado) { where.push("estado = ?"); params.push(estado); }
    if (semestre) { where.push("semestre = ?"); params.push(semestre); }
    if (anio) { where.push("anio = ?"); params.push(parseInt(anio)); }
    if (fecha_desde) { where.push("DATE(fecha_creacion) >= ?"); params.push(fecha_desde); }
    if (fecha_hasta) { where.push("DATE(fecha_creacion) <= ?"); params.push(fecha_hasta); }

    const whereStr = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const total = db.prepare(`SELECT COUNT(*) as cnt FROM solicitudes ${whereStr}`).get(...params);
    const rows = db.prepare(`SELECT * FROM solicitudes ${whereStr} ORDER BY fecha_creacion DESC LIMIT ? OFFSET ?`).all(...params, parseInt(limit), offset);

    res.json({ solicitudes: rows, total: total.cnt, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/solicitudes/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(parseInt(req.params.id));
    if (!row) return res.status(404).json({ error: 'Solicitud no encontrada' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/solicitudes/:id/estado
router.patch('/:id/estado', (req, res) => {
  const { estado } = req.body;
  const estados_validos = ['Pendiente', 'En proceso', 'Impresa', 'Entregada', 'Cancelada'];
  if (!estados_validos.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Válidos: ${estados_validos.join(', ')}` });
  }
  try {
    const db = getDb();
    const solicitud = db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(parseInt(req.params.id));
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });

    db.prepare(`UPDATE solicitudes SET estado = ?, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(estado, parseInt(req.params.id));

    db.prepare(`INSERT INTO admin_logs (accion, solicitud_id, detalles, usuario) VALUES (?, ?, ?, ?)`)
      .run('CAMBIO_ESTADO', solicitud.id, `${solicitud.estado} → ${estado}`, 'admin');

    const actualizada = db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(parseInt(req.params.id));
    res.json({ mensaje: 'Estado actualizado', solicitud: actualizada });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/solicitudes/:id/archivo
router.delete('/:id/archivo', (req, res) => {
  try {
    const db = getDb();
    const solicitud = db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(parseInt(req.params.id));
    if (!solicitud) return res.status(404).json({ error: 'Solicitud no encontrada' });
    if (solicitud.estado !== 'Cancelada') {
      return res.status(400).json({ error: 'Solo se pueden eliminar archivos de solicitudes Canceladas' });
    }
    if (solicitud.archivo_ruta) {
      const filePath = path.join(__dirname, '..', 'uploads', solicitud.archivo_ruta);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      db.prepare(`UPDATE solicitudes SET archivo_ruta = NULL, archivo_nombre = NULL, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(solicitud.id);
    }
    res.json({ mensaje: 'Archivo eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/solicitudes/:id/descargar
router.get('/:id/descargar', (req, res) => {
  try {
    const db = getDb();
    const solicitud = db.prepare('SELECT * FROM solicitudes WHERE id = ?').get(parseInt(req.params.id));
    if (!solicitud || !solicitud.archivo_ruta) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    const filePath = path.join(__dirname, '..', 'uploads', solicitud.archivo_ruta);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'El archivo ya no existe en el servidor' });
    res.download(filePath, solicitud.archivo_nombre);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
