import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  HiOutlinePrinter, HiOutlineChartBar, HiOutlineClipboardList,
  HiOutlineMenuAlt2, HiOutlineX, HiOutlineCog, HiOutlineAcademicCap
} from 'react-icons/hi'

const navItems = [
  { to: '/nueva-solicitud', icon: HiOutlinePrinter, label: 'Nueva Solicitud', desc: 'Solicitar impresión' },
  { to: '/admin', icon: HiOutlineChartBar, label: 'Dashboard', desc: 'Estadísticas', end: true },
  { to: '/admin/solicitudes', icon: HiOutlineClipboardList, label: 'Solicitudes', desc: 'Gestionar todas' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-100 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <HiOutlinePrinter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm leading-tight">PrintManager</h1>
              <p className="text-xs text-slate-500">Sistema de Impresiones</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-3">Menú</p>
          {navItems.map(({ to, icon: Icon, label, desc, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                    ${isActive ? 'bg-primary-600' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{label}</div>
                    <div className="text-xs text-slate-400">{desc}</div>
                  </div>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <HiOutlineAcademicCap className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-700">Colegio</p>
              <p className="text-xs text-slate-400">Sistema v1.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-4 lg:px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <HiOutlineX className="w-5 h-5" /> : <HiOutlineMenuAlt2 className="w-5 h-5" />}
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-slate-900">
              {location.pathname === '/nueva-solicitud' && 'Nueva Solicitud de Impresión'}
              {location.pathname === '/admin' && 'Panel de Administración'}
              {location.pathname === '/admin/solicitudes' && 'Gestión de Solicitudes'}
              {location.pathname.startsWith('/admin/solicitudes/') && 'Detalle de Solicitud'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-soft"></div>
            <span className="text-xs text-slate-500 hidden sm:block">Sistema en línea</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
