const express = require('express');
const router = express.Router();
const { getDb, getSemestre, getAnio } = require('../database');

// GET /api/admin/stats - Estadísticas generales
router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    const ahora = new Date();
    const semestre = getSemestre(ahora);
    const anio = getAnio(ahora);

    const total_solicitudes = db.prepare('SELECT COUNT(*) as cnt FROM solicitudes').get().cnt;
    const total_estudiantes = db.prepare("SELECT COUNT(DISTINCT LOWER(TRIM(nombre)) || '|' || LOWER(TRIM(curso))) as cnt FROM solicitudes").get().cnt;
    const total_hojas = db.prepare("SELECT COALESCE(SUM(paginas),0) as total FROM solicitudes WHERE estado != 'Cancelada'").get().total;
    const total_recaudado = db.prepare("SELECT COALESCE(SUM(monto_cobrado),0) as total FROM solicitudes WHERE estado != 'Cancelada'").get().total;
    const pendientes = db.prepare("SELECT COUNT(*) as cnt FROM solicitudes WHERE estado = 'Pendiente'").get().cnt;
    const en_proceso = db.prepare("SELECT COUNT(*) as cnt FROM solicitudes WHERE estado = 'En proceso'").get().cnt;

    const estudiantes_excedidos = db.prepare(`
      SELECT COUNT(DISTINCT LOWER(TRIM(nombre)) || '|' || LOWER(TRIM(curso))) as cnt
      FROM solicitudes
      WHERE semestre = ? AND anio = ? AND hojas_excedidas > 0 AND estado != 'Cancelada'
    `).get(semestre, anio).cnt;

    // Stats del semestre actual
    const hojas_semestre = db.prepare(`
      SELECT COALESCE(SUM(paginas),0) as total FROM solicitudes
      WHERE semestre = ? AND anio = ? AND estado != 'Cancelada'
    `).get(semestre, anio).total;

    const recaudado_semestre = db.prepare(`
      SELECT COALESCE(SUM(monto_cobrado),0) as total FROM solicitudes
      WHERE semestre = ? AND anio = ? AND estado != 'Cancelada'
    `).get(semestre, anio).total;

    res.json({
      total_solicitudes,
      total_estudiantes,
      total_hojas,
      total_recaudado,
      pendientes,
      en_proceso,
      estudiantes_excedidos,
      semestre_actual: { semestre, anio, hojas: hojas_semestre, recaudado: recaudado_semestre }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/grafico/por-curso
router.get('/grafico/por-curso', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT curso, COUNT(*) as solicitudes, COALESCE(SUM(paginas),0) as hojas
      FROM solicitudes WHERE estado != 'Cancelada'
      GROUP BY LOWER(TRIM(curso))
      ORDER BY hojas DESC LIMIT 15
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/grafico/por-mes
router.get('/grafico/por-mes', (req, res) => {
  try {
    const db = getDb();
    const anio = req.query.anio || new Date().getFullYear();
    const rows = db.prepare(`
      SELECT 
        strftime('%m', fecha_creacion) as mes,
        COUNT(*) as solicitudes,
        COALESCE(SUM(paginas),0) as hojas
      FROM solicitudes
      WHERE anio = ? AND estado != 'Cancelada'
      GROUP BY mes ORDER BY mes
    `).all(parseInt(anio));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/grafico/top-estudiantes
router.get('/grafico/top-estudiantes', (req, res) => {
  try {
    const db = getDb();
    const { semestre, anio } = req.query;
    let where = "WHERE estado != 'Cancelada'";
    const params = [];
    if (semestre) { where += ' AND semestre = ?'; params.push(semestre); }
    if (anio) { where += ' AND anio = ?'; params.push(parseInt(anio)); }

    const rows = db.prepare(`
      SELECT nombre, curso, 
        COALESCE(SUM(paginas),0) as hojas,
        COALESCE(SUM(monto_cobrado),0) as monto
      FROM solicitudes ${where}
      GROUP BY LOWER(TRIM(nombre)), LOWER(TRIM(curso))
      ORDER BY hojas DESC LIMIT 10
    `).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/grafico/uso-semestral
router.get('/grafico/uso-semestral', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT semestre, anio,
        COUNT(*) as solicitudes,
        COALESCE(SUM(paginas),0) as hojas,
        COALESCE(SUM(monto_cobrado),0) as recaudado
      FROM solicitudes WHERE estado != 'Cancelada'
      GROUP BY semestre, anio ORDER BY anio, semestre
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/logs
router.get('/logs', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM admin_logs ORDER BY fecha DESC LIMIT 100').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/configuracion
router.get('/configuracion', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM configuracion').all();
    const cfg = {};
    rows.forEach(r => cfg[r.clave] = r.valor);
    res.json(cfg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/configuracion
router.put('/configuracion', (req, res) => {
  try {
    const db = getDb();
    const { hojas_gratuitas, precio_excedente } = req.body;
    if (hojas_gratuitas) {
      db.prepare("UPDATE configuracion SET valor = ? WHERE clave = 'hojas_gratuitas'").run(String(parseInt(hojas_gratuitas)));
    }
    if (precio_excedente) {
      db.prepare("UPDATE configuracion SET valor = ? WHERE clave = 'precio_excedente'").run(String(parseInt(precio_excedente)));
    }
    res.json({ mensaje: 'Configuración actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
