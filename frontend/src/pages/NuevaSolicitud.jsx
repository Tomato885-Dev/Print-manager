import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  HiOutlineUser, HiOutlineAcademicCap, HiOutlineMail, HiOutlineDocumentText,
  HiOutlineUpload, HiOutlineX, HiOutlineCheckCircle, HiOutlinePrinter,
  HiOutlineHashtag, HiOutlineAnnotation
} from 'react-icons/hi'
import api from '../utils/api'
import { CURSOS, formatFileSize } from '../utils/format'
import CalcPreview from '../components/CalcPreview'

const TIPOS_PERMITIDOS = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
const EXT_LABEL = 'PDF, DOCX, JPG, PNG (máx. 20MB)'

export default function NuevaSolicitud() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    nombre: '', curso: '', numero_lista: '', correo: '',
    paginas: '', observaciones: ''
  })
  const [archivo, setArchivo] = useState(null)
  const [errors, setErrors] = useState({})
  const [calculo, setCalculo] = useState(null)
  const [calculando, setCalculando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [dragging, setDragging] = useState(false)

  // Calcular costo automático cuando cambian nombre, curso o páginas
  useEffect(() => {
    if (!form.nombre.trim() || !form.curso || !form.paginas) { setCalculo(null); return }
    const paginas = parseInt(form.paginas)
    if (isNaN(paginas) || paginas <= 0) { setCalculo(null); return }

    const t = setTimeout(async () => {
      setCalculando(true)
      try {
        const { data } = await api.get('/solicitudes/calcular', {
          params: { nombre: form.nombre.trim(), curso: form.curso, paginas }
        })
        setCalculo(data)
      } catch { setCalculo(null) }
      finally { setCalculando(false) }
    }, 600)
    return () => clearTimeout(t)
  }, [form.nombre, form.curso, form.paginas])

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const validateFile = (file) => {
    if (!file) return 'Debes seleccionar un archivo'
    if (!TIPOS_PERMITIDOS.includes(file.type)) return 'Tipo de archivo no permitido. Solo PDF, DOCX, JPG o PNG.'
    if (file.size > 20 * 1024 * 1024) return 'El archivo supera el límite de 20MB'
    return null
  }

  const handleFile = (file) => {
    const err = validateFile(file)
    if (err) { toast.error(err); return }
    setArchivo(file)
    setErrors(prev => ({ ...prev, archivo: null }))
  }

  const onFileChange = (e) => e.target.files[0] && handleFile(e.target.files[0])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }, [])

  const validate = () => {
    const errs = {}
    if (!form.nombre.trim()) errs.nombre = 'El nombre es obligatorio'
    if (!form.curso) errs.curso = 'Selecciona un curso'
    const p = parseInt(form.paginas)
    if (!form.paginas || isNaN(p) || p <= 0) errs.paginas = 'Ingresa una cantidad válida de páginas'
    if (!archivo) errs.archivo = 'Debes adjuntar un archivo'
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) errs.correo = 'Correo inválido'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); toast.error('Completa los campos requeridos'); return }

    setEnviando(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
      fd.append('archivo', archivo)

      await api.post('/solicitudes', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setEnviado(true)
      toast.success('¡Solicitud enviada correctamente!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEnviando(false)
    }
  }

  if (enviado) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-slide-up">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <HiOutlineCheckCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Solicitud enviada!</h2>
        <p className="text-slate-500 mb-8">Tu solicitud de impresión fue recibida. El personal te avisará cuando esté lista.</p>
        <div className="flex gap-3 justify-center">
          <button className="btn-primary" onClick={() => { setEnviado(false); setForm({ nombre:'',curso:'',numero_lista:'',correo:'',paginas:'',observaciones:'' }); setArchivo(null); setCalculo(null) }}>
            <HiOutlinePrinter className="w-4 h-4" /> Nueva solicitud
          </button>
          <button className="btn-secondary" onClick={() => navigate('/admin/solicitudes')}>
            Ver solicitudes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Solicitar Impresión</h1>
        <p className="text-slate-500 mt-1">Completa el formulario para enviar tu solicitud de impresión</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos del estudiante */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <HiOutlineUser className="w-4 h-4 text-primary-500" /> Datos del Estudiante
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nombre completo <span className="text-rose-500">*</span></label>
              <input className={`input-field ${errors.nombre ? 'border-rose-400 focus:ring-rose-400' : ''}`}
                placeholder="Ej: María González López"
                value={form.nombre} onChange={e => set('nombre', e.target.value)} />
              {errors.nombre && <p className="text-xs text-rose-500 mt-1">{errors.nombre}</p>}
            </div>
            <div>
              <label className="label">Curso <span className="text-rose-500">*</span></label>
              <select className={`input-field ${errors.curso ? 'border-rose-400 focus:ring-rose-400' : ''}`}
                value={form.curso} onChange={e => set('curso', e.target.value)}>
                <option value="">Seleccionar curso...</option>
                {CURSOS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.curso && <p className="text-xs text-rose-500 mt-1">{errors.curso}</p>}
            </div>
            <div>
              <label className="label">N° de lista <span className="text-slate-400 text-xs">(opcional)</span></label>
              <input className="input-field" type="number" min="1" max="50"
                placeholder="Ej: 15"
                value={form.numero_lista} onChange={e => set('numero_lista', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Correo institucional <span className="text-slate-400 text-xs">(opcional)</span></label>
              <input className={`input-field ${errors.correo ? 'border-rose-400 focus:ring-rose-400' : ''}`}
                type="email" placeholder="alumno@colegio.cl"
                value={form.correo} onChange={e => set('correo', e.target.value)} />
              {errors.correo && <p className="text-xs text-rose-500 mt-1">{errors.correo}</p>}
            </div>
          </div>
        </div>

        {/* Detalles de impresión */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <HiOutlineDocumentText className="w-4 h-4 text-primary-500" /> Detalles de Impresión
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label">Cantidad de páginas <span className="text-rose-500">*</span></label>
              <input className={`input-field ${errors.paginas ? 'border-rose-400 focus:ring-rose-400' : ''}`}
                type="number" min="1" max="500" placeholder="Ej: 5"
                value={form.paginas} onChange={e => set('paginas', e.target.value)} />
              {errors.paginas && <p className="text-xs text-rose-500 mt-1">{errors.paginas}</p>}
            </div>
            <div>
              <label className="label">Observaciones <span className="text-slate-400 text-xs">(opcional)</span></label>
              <textarea className="input-field resize-none" rows="3"
                placeholder="Ej: Imprimir a doble cara, tamaño carta..."
                value={form.observaciones} onChange={e => set('observaciones', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Cálculo automático */}
        {calculando && (
          <div className="card flex items-center gap-3 text-sm text-slate-500">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            Calculando costo...
          </div>
        )}
        {calculo && !calculando && (
          <CalcPreview calculo={calculo} nuevasPaginas={parseInt(form.paginas)} />
        )}

        {/* Subida de archivo */}
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <HiOutlineUpload className="w-4 h-4 text-primary-500" /> Archivo a Imprimir
          </h3>
          {!archivo ? (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                ${dragging ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'}
                ${errors.archivo ? 'border-rose-300' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <HiOutlineUpload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700">Arrastra tu archivo aquí</p>
              <p className="text-xs text-slate-400 mt-1">o haz clic para seleccionar</p>
              <p className="text-xs text-slate-400 mt-2">{EXT_LABEL}</p>
              <input ref={fileInputRef} type="file" className="hidden"
                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
                onChange={onFileChange} />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl border border-primary-200">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <HiOutlineDocumentText className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{archivo.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(archivo.size)}</p>
              </div>
              <button type="button" onClick={() => setArchivo(null)}
                className="p-1.5 hover:bg-primary-200 rounded-lg transition-colors">
                <HiOutlineX className="w-4 h-4 text-primary-700" />
              </button>
            </div>
          )}
          {errors.archivo && <p className="text-xs text-rose-500 mt-2">{errors.archivo}</p>}
        </div>

        {/* Submit */}
        <button type="submit" disabled={enviando} className="btn-primary w-full justify-center py-3 text-base">
          {enviando ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</>
          ) : (
            <><HiOutlinePrinter className="w-5 h-5" /> Enviar Solicitud de Impresión</>
          )}
        </button>
      </form>
    </div>
  )
}
