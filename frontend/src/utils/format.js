export const formatCLP = (amount) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount)

export const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const formatFileSize = (bytes) => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const ESTADOS = {
  'Pendiente':   { color: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-500' },
  'En proceso':  { color: 'bg-blue-100 text-blue-700 border-blue-200',      dot: 'bg-blue-500' },
  'Impresa':     { color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  'Entregada':   { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'Cancelada':   { color: 'bg-rose-100 text-rose-700 border-rose-200',      dot: 'bg-rose-500' },
}

export const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export const CURSOS = [
  '1°A','1°B','1°C','1°D',
  '2°A','2°B','2°C','2°D',
  '3°A','3°B','3°C','3°D',
  '4°A','4°B','4°C','4°D',
]
