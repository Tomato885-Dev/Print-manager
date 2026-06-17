const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const { getDb } = require('../database');

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// GET /api/export/solicitudes
router.get('/solicitudes', (req, res) => {
  try {
    const db = getDb();
    const { semestre, anio, estado } = req.query;
    let where = [];
    const params = [];
    if (semestre) { where.push('semestre = ?'); params.push(semestre); }
    if (anio) { where.push('anio = ?'); params.push(parseInt(anio)); }
    if (estado) { where.push('estado = ?'); params.push(estado); }
    const whereStr = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const rows = db.prepare(`SELECT * FROM solicitudes ${whereStr} ORDER BY fecha_creacion DESC`).all(...params);

    // Hoja 1: Detalle completo
    const detalleData = rows.map(r => ({
      'ID': r.id,
      'Nombre': r.nombre,
      'Curso': r.curso,
      'N° Lista': r.numero_lista || '',
      'Correo': r.correo || '',
      'Fecha': new Date(r.fecha_creacion).toLocaleString('es-CL'),
      'Semestre': r.semestre,
      'Año': r.anio,
      'Páginas': r.paginas,
      'Acumulado Semestre': r.acumulado_semestre,
      'Hojas Excedidas': r.hojas_excedidas,
      'Monto Cobrado ($CLP)': r.monto_cobrado,
      'Estado': r.estado,
      'Archivo': r.archivo_nombre || '',
      'Observaciones': r.observaciones || ''
    }));

    // Hoja 2: Resumen por estudiante
    const resumenMap = {};
    rows.filter(r => r.estado !== 'Cancelada').forEach(r => {
      const key = `${r.nombre.trim().toLowerCase()}|${r.curso.trim().toLowerCase()}|${r.semestre}|${r.anio}`;
      if (!resumenMap[key]) {
        resumenMap[key] = { Nombre: r.nombre, Curso: r.curso, Semestre: r.semestre, Año: r.anio, Solicitudes: 0, 'Total Páginas': 0, 'Hojas Excedidas': 0, 'Total Cobrado ($CLP)': 0 };
      }
      resumenMap[key].Solicitudes++;
      resumenMap[key]['Total Páginas'] += r.paginas;
      resumenMap[key]['Hojas Excedidas'] += r.hojas_excedidas;
      resumenMap[key]['Total Cobrado ($CLP)'] += r.monto_cobrado;
    });

    const resumenData = Object.values(resumenMap).sort((a,b) => b['Total Páginas'] - a['Total Páginas']);

    // Hoja 3: Estadísticas generales
    const statsData = [
      { 'Métrica': 'Total de solicitudes', 'Valor': rows.length },
      { 'Métrica': 'Solicitudes Pendientes', 'Valor': rows.filter(r=>r.estado==='Pendiente').length },
      { 'Métrica': 'Solicitudes Entregadas', 'Valor': rows.filter(r=>r.estado==='Entregada').length },
      { 'Métrica': 'Solicitudes Canceladas', 'Valor': rows.filter(r=>r.estado==='Cancelada').length },
      { 'Métrica': 'Total de páginas impresas', 'Valor': rows.filter(r=>r.estado!=='Cancelada').reduce((s,r)=>s+r.paginas,0) },
      { 'Métrica': 'Total recaudado ($CLP)', 'Valor': rows.filter(r=>r.estado!=='Cancelada').reduce((s,r)=>s+r.monto_cobrado,0) },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalleData), 'Solicitudes Detalladas');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumenData), 'Resumen por Estudiante');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(statsData), 'Estadísticas');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `impresiones_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
