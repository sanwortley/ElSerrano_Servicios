# El Serrano - Sistema de Gestión Logística

Sistema integral para la gestión de servicios de volquetes, áridos y mantenimiento de pozos.

## 🚀 Inicio Rápido

Para iniciar el sistema completo (Backend + Frontend), simplemente haz doble clic en el archivo:
`EJECUTAR_SISTEMA.bat`

---

## 🛠 Estructura del Proyecto

- **/backend**: API construida con FastAPI y PostgreSQL. Contiene la lógica de negocio y geolocalización.
- **/frontend**: Interfaz de usuario dinámica construida con React y Vite.
- **/_mantenimiento**: Scripts de utilidad para base de datos, diagnósticos y herramientas de testing.
- **/_logs**: Registro de errores y salidas de auditoría del sistema.
- **/alembic**: Gestor de migraciones de la base de datos.

## ⚙ Requisitos
- Python 3.10+
- Node.js 18+
- PostgreSQL con extensión PostGIS

## 🌐 Servicios Principales
- **Geocoding & Zones**: Detección automática de zonas operativas mediante Nominatim.
- **Gestión de Servicios**: Carga de pedidos individuales y abonos frecuentes.
- **Hoja de Ruta**: Asignación dinámica de recorridos para choferes.

---

## 🔒 Seguridad Profesional Implementada
El sistema cuenta con niveles de seguridad bancaria:
- **Rate Limiting**: Protección contra ataques de fuerza bruta en el login (máximo 5 intentos por minuto).
- **Auditoría de Acciones**: Registro histórico de quién creó, modificó o borró cada pedido (ver tabla `audit_logs`).
- **Encabezados de Seguridad**: Protección contra Clickjacking, XSS e Inyección de contenido mediante HSTS y CSP.
- **Sesiones Seguras**: Tokens JWT con expiración controlada y protección de interceptores de datos.
- **Geocoding Policy**: Respeto de User-Agent y caché para cumplimiento de políticas de uso de datos.