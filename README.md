# 🖨️ PrintManager — Sistema de Gestión de Impresiones

Sistema web completo para administrar las impresiones de estudiantes en un colegio. Permite a los alumnos solicitar impresiones y al personal gestionar, controlar y registrar todas las impresiones del semestre.

---

## 📋 Características

- **Formulario de solicitud** para estudiantes con validaciones
- **Control de límite semestral** (20 hojas gratuitas, $150 CLP por hoja excedente)
- **Cálculo automático** del costo antes de confirmar
- **Gestión de semestres** automática (Marzo-Julio / Agosto-Diciembre)
- **5 estados** de seguimiento con cambio desde la tabla
- **Dashboard** con estadísticas y 4 tipos de gráficos (Recharts)
- **Exportación Excel** con 3 hojas (detalle, resumen, estadísticas)
- **Gestión de archivos** con descarga y eliminación
- **Notificaciones toast** y animaciones suaves
- **Diseño responsive** (desktop, tablet, móvil)

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router, React Icons, Recharts |
| Backend | Node.js, Express |
| Base de datos | SQLite (better-sqlite3) |
| Archivos | Multer |
| Exportación | XLSX |
| Notificaciones | react-hot-toast |

---

## 📁 Estructura del proyecto

```
print-manager/
├── backend/
│   ├── middleware/
│   │   └── upload.js          # Configuración Multer
│   ├── routes/
│   │   ├── solicitudes.js     # CRUD solicitudes
│   │   ├── admin.js           # Stats y gráficos
│   │   └── export.js          # Exportación Excel
│   ├── uploads/               # Archivos subidos (creado automáticamente)
│   ├── database.js            # SQLite + funciones de negocio
│   ├── server.js              # Entrada del servidor
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx     # Sidebar + header
│   │   │   ├── EstadoBadge.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── CalcPreview.jsx
│   │   ├── pages/
│   │   │   ├── NuevaSolicitud.jsx   # Formulario estudiante
│   │   │   ├── Dashboard.jsx        # Panel admin con gráficos
│   │   │   ├── Solicitudes.jsx      # Tabla + filtros
│   │   │   └── SolicitudDetalle.jsx # Detalle individual
│   │   ├── utils/
│   │   │   ├── api.js         # Axios configurado
│   │   │   └── format.js      # Helpers de formato
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── package.json               # Scripts raíz
└── README.md
```

---

## 🚀 Instalación y ejecución

### Requisitos previos

- **Node.js** v18 o superior
- **npm** v9 o superior

### Paso 1: Clonar / abrir el proyecto en VS Code

Abre la carpeta `print-manager` en Visual Studio Code.

### Paso 2: Instalar dependencias del backend

```bash
cd backend
npm install
```

### Paso 3: Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

### Paso 4: Ejecutar el backend

Abre una terminal en VS Code y ejecuta:

```bash
cd backend
npm run dev
```

El backend correrá en **http://localhost:3001**

### Paso 5: Ejecutar el frontend

Abre **otra terminal** en VS Code y ejecuta:

```bash
cd frontend
npm run dev
```

El frontend correrá en **http://localhost:5173**

### Paso 6: Abrir en el navegador

Navega a **http://localhost:5173**

---

## 📖 Uso del sistema

### Para estudiantes — Nueva Solicitud (`/nueva-solicitud`)

1. Completa nombre, curso y cantidad de páginas
2. El sistema calcula automáticamente el costo en tiempo real
3. Adjunta el archivo (PDF, DOCX, JPG o PNG, máx. 20MB)
4. Haz clic en "Enviar Solicitud"

### Para administradores — Dashboard (`/admin`)

- Visualiza estadísticas generales y del semestre actual
- Revisa gráficos de uso por curso, mes, semestre y top estudiantes
- Accede a la gestión completa de solicitudes

### Gestión de solicitudes (`/admin/solicitudes`)

- Busca por nombre o usa filtros por curso, estado, semestre y año
- Cambia el estado directamente desde la tabla
- Exporta a Excel con el botón correspondiente
- Haz clic en el ícono de ojo para ver el detalle completo

---

## ⚙️ Configuración

La base de datos se crea automáticamente al iniciar el backend (`database.sqlite`).

Valores configurables por defecto:
- **Hojas gratuitas por semestre:** 20
- **Precio por hoja excedente:** $150 CLP

Estos se pueden ajustar vía la API: `PUT /api/admin/configuracion`

---

## 🌐 API Endpoints

### Solicitudes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/solicitudes/calcular` | Calcular costo previo |
| POST | `/api/solicitudes` | Crear solicitud (multipart/form-data) |
| GET | `/api/solicitudes` | Listar con filtros y paginación |
| GET | `/api/solicitudes/:id` | Obtener por ID |
| PATCH | `/api/solicitudes/:id/estado` | Cambiar estado |
| GET | `/api/solicitudes/:id/descargar` | Descargar archivo |
| DELETE | `/api/solicitudes/:id/archivo` | Eliminar archivo |

### Admin
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/stats` | Estadísticas generales |
| GET | `/api/admin/grafico/por-curso` | Datos gráfico cursos |
| GET | `/api/admin/grafico/por-mes` | Datos gráfico meses |
| GET | `/api/admin/grafico/top-estudiantes` | Top estudiantes |
| GET | `/api/admin/grafico/uso-semestral` | Uso por semestre |
| GET | `/api/admin/configuracion` | Ver configuración |
| PUT | `/api/admin/configuracion` | Actualizar configuración |

### Exportación
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/export/solicitudes` | Exportar Excel (acepta filtros) |

---

## 🔒 Seguridad (preparado para futuras mejoras)

La arquitectura está preparada para agregar:
- Sistema de login con JWT
- Roles de usuario (admin / encargado / estudiante)
- Protección de rutas en frontend y backend
- Registro de acciones administrativas (tabla `admin_logs` ya existe)

---

## 📝 Notas de desarrollo

- La base de datos SQLite se almacena en `backend/database.sqlite`
- Los archivos subidos se guardan en `backend/uploads/`
- El semestre se determina automáticamente según el mes del servidor
- Los archivos solo pueden eliminarse cuando la solicitud está en estado "Cancelada"
