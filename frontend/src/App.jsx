import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import NuevaSolicitud from './pages/NuevaSolicitud'
import Dashboard from './pages/Dashboard'
import Solicitudes from './pages/Solicitudes'
import SolicitudDetalle from './pages/SolicitudDetalle'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/nueva-solicitud" replace />} />
        <Route path="nueva-solicitud" element={<NuevaSolicitud />} />
        <Route path="admin" element={<Dashboard />} />
        <Route path="admin/solicitudes" element={<Solicitudes />} />
        <Route path="admin/solicitudes/:id" element={<SolicitudDetalle />} />
        <Route path="*" element={<Navigate to="/nueva-solicitud" replace />} />
      </Route>
    </Routes>
  )
}
