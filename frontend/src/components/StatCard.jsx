export default function StatCard({ icon: Icon, label, value, sub, color = 'primary', trend }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className="stat-card animate-slide-up">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
