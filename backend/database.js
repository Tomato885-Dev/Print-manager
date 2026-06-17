const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'database.sqlite');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS solicitudes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      curso TEXT NOT NULL,
      numero_lista INTEGER,
      correo TEXT,
      paginas INTEGER NOT NULL,
      observaciones TEXT,
      archivo_nombre TEXT,
      archivo_ruta TEXT,
      archivo_tipo TEXT,
      archivo_tamanio INTEGER,
      estado TEXT NOT NULL DEFAULT 'Pendiente',
      semestre TEXT NOT NULL,
      anio INTEGER NOT NULL,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP,
      acumulado_semestre INTEGER DEFAULT 0,
      hojas_excedidas INTEGER DEFAULT 0,
      monto_cobrado INTEGER DEFAULT 0,
      created_by TEXT DEFAULT 'estudiante'
    );

    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accion TEXT NOT NULL,
      solicitud_id INTEGER,
      detalles TEXT,
      fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
      usuario TEXT DEFAULT 'admin'
    );

    CREATE TABLE IF NOT EXISTS configuracion (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL,
      descripcion TEXT
    );

    INSERT OR IGNORE INTO configuracion (clave, valor, descripcion) VALUES
      ('hojas_gratuitas', '20', 'Número de hojas gratuitas por semestre'),
      ('precio_excedente', '150', 'Precio en CLP por hoja excedente');
  `);
}

function getSemestre(fecha) {
  const mes = fecha.getMonth() + 1;
  return mes >= 3 && mes <= 7 ? 'Primer Semestre' : 'Segundo Semestre';
}

function getAnio(fecha) {
  return fecha.getFullYear();
}

function calcularCosto(db, nombre, curso, nuevasPaginas) {
  const config = db.prepare('SELECT clave, valor FROM configuracion').all();
  const cfgMap = {};
  config.forEach(c => cfgMap[c.clave] = parseInt(c.valor));

  const hojas_gratuitas = cfgMap.hojas_gratuitas || 20;
  const precio_excedente = cfgMap.precio_excedente || 150;

  const ahora = new Date();
  const semestre = getSemestre(ahora);
  const anio = getAnio(ahora);

  const row = db.prepare(`
    SELECT COALESCE(SUM(paginas), 0) as total
    FROM solicitudes
    WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(?))
    AND LOWER(TRIM(curso)) = LOWER(TRIM(?))
    AND semestre = ? AND anio = ?
    AND estado != 'Cancelada'
  `).get(nombre, curso, semestre, anio);

  const acumulado_previo = row ? row.total : 0;
  const nuevo_acumulado = acumulado_previo + nuevasPaginas;

  let hojas_excedidas = 0;
  let monto_cobrado = 0;

  if (nuevo_acumulado > hojas_gratuitas) {
    const excedido_previo = Math.max(0, acumulado_previo - hojas_gratuitas);
    const excedido_nuevo = Math.max(0, nuevo_acumulado - hojas_gratuitas);
    hojas_excedidas = excedido_nuevo - excedido_previo;
    monto_cobrado = hojas_excedidas * precio_excedente;
  }

  return {
    acumulado_previo,
    nuevo_acumulado,
    hojas_gratuitas,
    hojas_excedidas,
    monto_cobrado,
    precio_excedente,
    semestre,
    anio
  };
}

module.exports = { getDb, getSemestre, getAnio, calcularCosto };
