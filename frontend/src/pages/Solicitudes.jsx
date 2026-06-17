import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  HiOutlineSearch, HiOutlineFilter, HiOutlineDownload, HiOutlineRefresh,
  HiOutlineEye, HiOutlineX, HiOutlineChevronLeft, HiOutlineChevronRight
} from 'react-icons/hi'
import api from '../utils/api'
import { formatCLP, formatDate, ESTADOS, CURSOS } from '../utils/format'
import EstadoBadge from '../components/EstadoBadge'

const ESTADOS_LIST = ['', 'Pendiente', 'En proceso', 'Impresa', 'Entregada', 'Cancelada']
const SEMESTRES = ['', 'Primer Semestre', 'Segundo Semestre']
const ANIO_ACTUAL = new Date().getFullYear()

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [filtros, setFiltros] = useState({ nombre: '', curso: '', estado: '', semestre: '', anio: '' })
  const [showFiltros, setShowFiltros] = useState(false)
  const LIMIT = 20

  const cargar = useCallback(async (pg = page) => {
    setLoading(true)
    try {
      const params = { page: pg, limit: LIMIT }
      Object.entries(filtros).forEach(([k, v]) => v && (params[k] = v))
      const { data } = await api.get('/solicitudes', { params })
      setSolicitudes(data.solicitudes)
      setTotal(data.total)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }, [page, filtros])

  useEffect(() => { cargar() }, [cargar])

  const setFiltro = (k, v) => { setFiltros(prev => ({ ...prev, [k]: v })); setPage(1) }

  const resetFiltros = () => { setFiltros({ nombre: '', curso: '', estado: '', semestre: '', anio: '' }); setPage(1) }

  const cambiarEstado = async (id, estado) => {
    try {
      await api.patch(`/solicitudes/${id}/estado`, { estado })
      toast.success(`Estado cambiado a "${estado}"`)
      cargar()
    } catch (err) { toast.error(err.message) }
  }

  const exportar = () => {
    const params = new URLSearchParams()
    Object.entries(filtros).forEach(([k, v]) => v && params.append(k, v))
    window.open(`/api/export/solicitudes?${params}`, '_blank')
  }

  const totalPaginas = Math.ceil(total / LIMIT)
  const hayFiltros = Object.values(filtros).some(v => v)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Solicitudes</h1>
          <p className="text-slate-500 text-sm mt-1">{total} solicitud{total !== 1 ? 'es' : ''} encontrada{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => cargar()} className="btn-secondary">
            <HiOutlineRefresh className="w-4 h-4" />
          </button>
          <button onClick={() => setShowFiltros(!showFiltros)} className={`btn-secondary ${hayFiltros ? 'border-primary-300 text-primary-600' : ''}`}>
            <HiOutlineFilter className="w-4 h-4" /> Filtros {hayFiltros && `(activos)`}
          </button>
          <button onClick={exportar} className="btn-primary">
            <HiOutlineDownload className="w-4 h-4" /> Exportar Excel
          </button>
        </div>
      </div>

      {/* Búsqueda rápida */}
      <div className="relative">
        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className="input-field pl-11"
          placeholder="Buscar por nombre del estudiante..."
          value={filtros.nombre}
          onChange={e => setFiltro('nombre', e.target.value)}
        />
      </div>

      {/* Panel de filtros */}
      {showFiltros && (
        <div className="card animate-slide-up">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Curso</label>
              <select className="input-field" value={filtros.curso} onChange={e => setFiltro('curso', e.target.value)}>
                <option value="">Todos los cursos</option>
                {CURSOS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input-field" value={filtros.estado} onChange={e => setFiltro('estado', e.target.value)}>
                {ESTADOS_LIST.map(e => <option key={e} value={e}>{e || 'Todos los estados'}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Semestre</label>
              <select className="input-field" value={filtros.semestre} onChange={e => setFiltro('semestre', e.target.value)}>
                {SEMESTRES.map(s => <option key={s} value={s}>{s || 'Todos los semestres'}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Año</label>
              <select className="input-field" value={filtros.anio} onChange={e => setFiltro('anio', e.target.value)}>
                <option value="">Todos</option>
                {[ANIO_ACTUAL, ANIO_ACTUAL - 1, ANIO_ACTUAL - 2].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          {hayFiltros && (
            <button onClick={resetFiltros} className="mt-3 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
              <HiOutlineX className="w-3.5 h-3.5" /> Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="table-th">Estudiante</th>
                <th className="table-th">Curso</th>
                <th className="table-th">Páginas</th>
                <th className="table-th hidden md:table-cell">Semestre</th>
                <th className="table-th hidden lg:table-cell">Excedente</th>
                <th className="table-th hidden lg:table-cell">Cobrado</th>
                <th className="table-th">Estado</th>
                <th className="table-th hidden sm:table-cell">Fecha</th>
                <th className="table-th">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-16 text-slate-400">
                  <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : solicitudes.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16 text-slate-400">
                  <HiOutlineSearch className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  No se encontraron solicitudes
                </td></tr>
              ) : solicitudes.map(s => (
                <tr key={s.id} className="table-tr">
                  <td className="table-td">
                    <div className="font-medium text-slate-900">{s.nombre}</div>
                    {s.correo && <div className="text-xs text-slate-400">{s.correo}</div>}
                  </td>
                  <td className="table-td">
                    <span className="font-medium">{s.curso}</span>
                    {s.numero_lista && <span className="text-slate-400 text-xs"> #{s.numero_lista}</span>}
                  </td>
                  <td className="table-td">
                    <span className="font-semibold text-primary-700">{s.paginas}</span>
                  </td>
                  <td className="table-td hidden md:table-cell text-xs text-slate-500">{s.semestre}</td>
                  <td className="table-td hidden lg:table-cell">
                    {s.hojas_excedidas > 0 ? (
                      <span className="text-amber-600 font-medium">{s.hojas_excedidas} hj.</span>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="table-td hidden lg:table-cell">
                    {s.monto_cobrado > 0 ? (
                      <span className="font-medium text-emerald-700">{formatCLP(s.monto_cobrado)}</span>
                    ) : <span className="text-slate-400">Gratis</span>}
                  </td>
                  <td className="table-td">
                    <select
                      className="text-xs border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
                      value={s.estado}
                      onChange={e => cambiarEstado(s.id, e.target.value)}
                    >
                      {Object.keys(ESTADOS).map(est => <option key={est}>{est}</option>)}
                    </select>
                  </td>
                  <td className="table-td hidden sm:table-cell text-xs text-slate-500">{formatDate(s.fecha_creacion)}</td>
                  <td className="table-td">
                    <Link to={`/admin/solicitudes/${s.id}`} className="p-2 hover:bg-primary-50 text-primary-600 rounded-lg inline-flex">
                      <HiOutlineEye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Mostrando {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setPage(p => p - 1); cargar(page - 1) }}
                disabled={page === 1}
                className="btn-secondary px-3 py-2 disabled:opacity-40"
              >
                <HiOutlineChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-slate-700">{page} / {totalPaginas}</span>
              <button
                onClick={() => { setPage(p => p + 1); cargar(page + 1) }}
                disabled={page === totalPaginas}
                className="btn-secondary px-3 py-2 disabled:opacity-40"
              >
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
