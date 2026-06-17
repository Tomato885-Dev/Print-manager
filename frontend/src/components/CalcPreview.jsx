import { HiOutlineInformationCircle, HiOutlineExclamationCircle, HiOutlineCheckCircle } from 'react-icons/hi'
import { formatCLP } from '../utils/format'

export default function CalcPreview({ calculo, nuevasPaginas }) {
  if (!calculo) return null

  const { acumulado_previo, nuevo_acumulado, hojas_gratuitas, hojas_excedidas, monto_cobrado } = calculo
  const gratisPrevias = Math.min(acumulado_previo, hojas_gratuitas)
  const gratisNuevas = Math.max(0, Math.min(nuevasPaginas, hojas_gratuitas - acumulado_previo))
  const excedido = hojas_excedidas > 0
  const sinCosto = monto_cobrado === 0

  return (
    <div className={`rounded-2xl border p-5 animate-slide-up ${excedido ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
      <div className="flex items-start gap-3">
        {excedido
          ? <HiOutlineExclamationCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          : <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        }
        <div className="flex-1">
          <h4 className={`text-sm font-semibold mb-3 ${excedido ? 'text-amber-800' : 'text-emerald-800'}`}>
            Resumen de Hojas — {calculo.semestre} {calculo.anio}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/70 rounded-xl p-3">
              <p className="text-xs text-slate-500">Acumulado anterior</p>
              <p className="text-lg font-bold text-slate-800">{acumulado_previo} <span className="text-xs font-normal">hojas</span></p>
            </div>
            <div className="bg-white/70 rounded-xl p-3">
              <p className="text-xs text-slate-500">Nueva solicitud</p>
              <p className="text-lg font-bold text-slate-800">+{nuevasPaginas} <span className="text-xs font-normal">hojas</span></p>
            </div>
            <div className="bg-white/70 rounded-xl p-3">
              <p className="text-xs text-slate-500">Total acumulado</p>
              <p className="text-lg font-bold text-slate-800">{nuevo_acumulado} <span className="text-xs font-normal">/ {hojas_gratuitas}</span></p>
            </div>
            <div className={`rounded-xl p-3 ${excedido ? 'bg-amber-200/50' : 'bg-white/70'}`}>
              <p className="text-xs text-slate-500">Hojas excedidas</p>
              <p className={`text-lg font-bold ${excedido ? 'text-amber-700' : 'text-slate-800'}`}>{hojas_excedidas}</p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Uso del cupo gratuito</span>
              <span>{Math.min(nuevo_acumulado, hojas_gratuitas)}/{hojas_gratuitas}</span>
            </div>
            <div className="h-2 bg-white/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${excedido ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, (nuevo_acumulado / hojas_gratuitas) * 100)}%` }}
              />
            </div>
          </div>

          {/* Monto a pagar */}
          <div className={`mt-4 p-3 rounded-xl border flex items-center justify-between ${excedido ? 'bg-amber-100 border-amber-300' : 'bg-white/70 border-transparent'}`}>
            <div>
              <p className="text-xs font-medium text-slate-600">Total a pagar por excedente</p>
              {excedido && <p className="text-xs text-amber-600">{hojas_excedidas} hoja(s) × {formatCLP(calculo.precio_excedente)}</p>}
            </div>
            <p className={`text-xl font-bold ${excedido ? 'text-amber-700' : 'text-emerald-700'}`}>
              {excedido ? formatCLP(monto_cobrado) : 'Gratis'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
