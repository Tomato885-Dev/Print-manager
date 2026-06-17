import { ESTADOS } from '../utils/format'

export default function EstadoBadge({ estado }) {
  const cfg = ESTADOS[estado] || { color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' }
  return (
    <span className={`badge border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
      {estado}
    </span>
  )
}
