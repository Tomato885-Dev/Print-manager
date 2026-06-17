import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import {
  HiOutlinePrinter, HiOutlineUsers, HiOutlineDocumentDuplicate,
  HiOutlineCurrencyDollar, HiOutlineExclamationCircle, HiOutlineClock,
  HiOutlineArrowRight, HiOutlineRefresh
} from 'react-icons/hi'
import api from '../utils/api'
import { formatCLP, MESES } from '../utils/format'
import StatCard from '../components/StatCard'

const COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16']

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [graficoCurso, setGraficoCurso] = useState([])
  const [graficoMes, setGraficoMes] = useState([])
  const [topEstudiantes, setTopEstudiantes] = useState([])
  const [usoSemestral, setUsoSemestral] = useState([])
  const [loading, setLoading] = useState(true)

  const cargar = async () => {
    setLoading(true)
    try {
      const [s, gc, gm, te, us] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/grafico/por-curso'),
        api.get('/admin/grafico/por-mes'),
        api.get('/admin/grafico/top-estudiantes'),
        api.get('/admin/grafico/uso-semestral'),
      ])
      setStats(s.data)
      setGraficoCurso(gc.data)
      setGraficoMes(gm.data.map(r => ({ ...r, mes: MESES[parseInt(r.mes) - 1] })))
      setTopEstudiantes(te.data)
      setUsoSemestral(us.data.map(r => ({ ...r, label: `${r.semestre.split(' ')[0]} ${r.anio}` })))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
          <p className="text-slate-500 text-sm mt-1">
            {stats?.semestre_actual?.semestre} {stats?.semestre_actual?.anio}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={cargar} className="btn-secondary">
            <HiOutlineRefresh className="w-4 h-4" /> Actualizar
          </button>
          <Link to="/admin/solicitudes" className="btn-primary">
            Ver solicitudes <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats generales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={HiOutlinePrinter} label="Total Solicitudes" value={stats?.total_solicitudes ?? 0} color="primary" />
        <StatCard icon={HiOutlineUsers} label="Estudiantes" value={stats?.total_estudiantes ?? 0} color="emerald" />
        <StatCard icon={HiOutlineDocumentDuplicate} label="Hojas Impresas" value={stats?.total_hojas ?? 0} color="violet" />
        <StatCard icon={HiOutlineCurrencyDollar} label="Total Recaudado" value={formatCLP(stats?.total_recaudado ?? 0)} color="amber" />
        <StatCard icon={HiOutlineExclamationCircle} label="Excedieron Límite" value={stats?.estudiantes_excedidos ?? 0} color="rose" />
        <StatCard icon={HiOutlineClock} label="Pendientes" value={stats?.pendientes ?? 0} color="slate" />
      </div>

      {/* Semestre actual highlight */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white border-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-primary-200 text-sm font-medium">Semestre actual</p>
            <h3 className="text-xl font-bold mt-0.5">{stats?.semestre_actual?.semestre} {stats?.semestre_actual?.anio}</h3>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-primary-200 text-xs">Hojas impresas</p>
              <p className="text-2xl font-bold">{stats?.semestre_actual?.hojas ?? 0}</p>
            </div>
            <div>
              <p className="text-primary-200 text-xs">Recaudado</p>
              <p className="text-2xl font-bold">{formatCLP(stats?.semestre_actual?.recaudado ?? 0)}</p>
            </div>
            <div>
              <p className="text-primary-200 text-xs">En proceso</p>
              <p className="text-2xl font-bold">{stats?.en_proceso ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos fila 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Por curso */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Hojas por Curso</h3>
          {graficoCurso.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Sin datos aún</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={graficoCurso} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="curso" tick={{ fontSize: 11, fill: '#94a3b8' }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '13px' }} />
                <Bar dataKey="hojas" name="Hojas" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por mes */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Solicitudes por Mes</h3>
          {graficoMes.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Sin datos aún</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={graficoMes} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '13px' }} />
                <Legend />
                <Line type="monotone" dataKey="solicitudes" name="Solicitudes" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="hojas" name="Hojas" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Gráficos fila 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top estudiantes */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Top 10 Estudiantes (hojas)</h3>
          {topEstudiantes.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Sin datos aún</div>
          ) : (
            <div className="space-y-3">
              {topEstudiantes.slice(0, 8).map((e, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-700 truncate">{e.nombre}</span>
                      <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{e.hojas} hojas</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(e.hojas / topEstudiantes[0].hojas) * 100}%`,
                          backgroundColor: COLORS[i % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-10 text-right">{e.curso}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Uso semestral */}
        <div className="card">
          <h3 className="font-semibold text-slate-800 mb-4">Uso por Semestre</h3>
          {usoSemestral.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Sin datos aún</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={usoSemestral} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} angle={-20} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '13px' }} />
                <Legend />
                <Bar dataKey="hojas" name="Hojas" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="solicitudes" name="Solicitudes" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
