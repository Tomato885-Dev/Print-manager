import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  HiOutlineArrowLeft, HiOutlineDownload, HiOutlineTrash, HiOutlineDocumentText,
  HiOutlineUser, HiOutlineCalendar, HiOutlineCurrencyDollar, HiOutlineExclamationCircle
} from 'react-icons/hi'
import api from '../utils/api'
import { formatCLP, formatDate, formatFileSize, ESTADOS } from '../utils/format'
import EstadoBadge from '../components/EstadoBadge'

export default function SolicitudDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [solicitud, setSolicitud] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  const cargar = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/solicitudes/${id}`)
      setSolicitud(data)
    } catch (err) {
      toast.error(err.message)
      navigate('/admin/solicitudes')
    } finally { setLoading(false) }
  }

  useEffect(() => { cargar() }, [id])

  const cambiarEstado = async (estado) => {
    setCambiandoEstado(true)
    try {
      await api.patch(`/solicitudes/${id}/estado`, { estado })
      toast.success(`Estado actualizado a "${estado}"`)
      cargar()
    } catch (err) { toast.error(err.message) }
    finally { setCambiandoEstado(false) }
  }

  const eliminarArchivo = async () => {
    if (!confirm('¿Eliminar el archivo de esta solicitud cancelada?')) return
    try {
      await api.delete(`/solicitudes/${id}/archivo`)
      toast.success('Archivo eliminado')
      cargar()
    } catch (err) { toast.error(err.message) }
  }

  const descargar = () => window.open(`/api/solicitudes/${id}/descargar`, '_blank')

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!solicitud) return null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/solicitudes" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <HiOutlineArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Solicitud #{solicitud.id}</h1>
          <p className="text-slate-500 text-sm">{formatDate(solicitud.fecha_creacion)}</p>
        </div>
        <EstadoBadge estado={solicitud.estado} />
      </div>

      {/* Datos del estudiante */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <HiOutlineUser className="w-4 h-4 text-primary-500" /> Datos del Estudiante
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoRow label="Nombre" value={solicitud.nombre} />
          <InfoRow label="Curso" value={solicitud.curso} />
          <InfoRow label="N° de lista" value={solicitud.numero_lista || '—'} />
          <InfoRow label="Correo" value={solicitud.correo || '—'} />
        </div>
      </div>

      {/* Detalles de la solicitud */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <HiOutlineDocumentText className="w-4 h-4 text-primary-500" /> Detalles de Impresión
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoRow label="Páginas solicitadas" value={`${solicitud.paginas} hojas`} highlight />
          <InfoRow label="Semestre" value={`${solicitud.semestre} ${solicitud.anio}`} />
          <InfoRow label="Acumulado semestre" value={`${solicitud.acumulado_semestre} hojas`} />
          <InfoRow label="Hojas excedidas" value={`${solicitud.hojas_excedidas}`} />
          {solicitud.observaciones && (
            <div className="sm:col-span-2">
              <InfoRow label="Observaciones" value={solicitud.observaciones} />
            </div>
          )}
        </div>

        {/* Costo */}
        {solicitud.monto_cobrado > 0 ? (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <HiOutlineExclamationCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Excedente a cobrar</p>
              <p className="text-xs text-amber-600">{solicitud.hojas_excedidas} hoja(s) excedida(s)</p>
            </div>
            <p className="ml-auto text-xl font-bold text-amber-700">{formatCLP(solicitud.monto_cobrado)}</p>
          </div>
        ) : (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <HiOutlineCurrencyDollar className="w-5 h-5 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-700">Sin costo — dentro del cupo gratuito</p>
          </div>
        )}
      </div>

      {/* Archivo */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <HiOutlineDocumentText className="w-4 h-4 text-primary-500" /> Archivo Adjunto
        </h3>
        {solicitud.archivo_nombre ? (
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <HiOutlineDocumentText className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-800 truncate">{solicitud.archivo_nombre}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(solicitud.archivo_tamanio)} · {solicitud.archivo_tipo}</p>
              <p className="text-xs text-slate-400">Subido el {formatDate(solicitud.fecha_creacion)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={descargar} className="btn-secondary px-3">
                <HiOutlineDownload className="w-4 h-4" /> Descargar
              </button>
              {solicitud.estado === 'Cancelada' && (
                <button onClick={eliminarArchivo} className="btn-danger px-3">
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">Archivo no disponible o eliminado</p>
        )}
      </div>

      {/* Cambiar estado */}
      <div className="card">
        <h3 className="font-semibold text-slate-800 mb-4">Cambiar Estado</h3>
        <div className="flex flex-wrap gap-2">
          {Object.keys(ESTADOS).map(est => (
            <button
              key={est}
              onClick={() => cambiarEstado(est)}
              disabled={cambiandoEstado || solicitud.estado === est}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                solicitud.estado === est
                  ? `${ESTADOS[est].color} border-current`
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              } disabled:cursor-not-allowed`}
            >
              {est}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, highlight }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
      <p className={`text-sm ${highlight ? 'font-bold text-primary-700 text-lg' : 'text-slate-800'}`}>{value}</p>
    </div>
  )
}
