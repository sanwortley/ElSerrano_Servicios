# Guía de Ejecución - El Serrano Servicios

Para ejecutar el sistema completo, necesitas abrir **dos terminales** por separado. Una para el "cerebro" (Backend) y otra para la "pantalla" (Frontend).

## 📋 Requisitos Previos
Asegúrate de tener instalado:
- **Python 3.11+**
- **Node.js** (para el frontend)
- **PostgreSQL** (base de datos corriendo)

---

## 🖥️ Terminal 1: Backend (Servidor)
Esta terminal se encargará de procesar los datos y conectar con la base de datos.

1. **Abrir la terminal** en la carpeta raíz del proyecto (`c:\ElSerranoServicios`).
2. **Activar el entorno virtual**:
   ```powershell
   .venv\Scripts\activate
   ```
   *(Verás que aparece `(.venv)` al principio de la línea).*

3. **Iniciar el servidor**:
   ```powershell
   uvicorn backend.src.app:app --reload
   ```
   ✅ **Listo:** Deberías ver mensajes diciendo `Application startup complete`. El servidor estará escuchando en `http://localhost:8000`.

---

## 🎨 Terminal 2: Frontend (Web)
Esta terminal mostrará la página web.

1. **Abrir una SEGUNDA terminal** en la carpeta raíz.
2. **Entrar a la carpeta del frontend**:
   ```powershell
   cd frontend
   ```
3. **Iniciar la web**:
   ```powershell
   npm run dev
   ```
   ✅ **Listo:** Verás un link como `http://localhost:5173`. Ábrelo en tu navegador.

---

## 🔑 Credenciales por Defecto
Una vez que abras la web, inicia sesión con:

- **Email:** `admin@admin.com`
- **Contraseña:** `admin`

---

## 💡 Solución de Problemas Comunes

- **Error: "No se pudo conectar con el servidor"**: Significa que la **Terminal 1** (Backend) no está corriendo o dio error. Revisa esa terminal.
- **Error: "pip no reconocido" o librerías faltantes**: Asegúrate de haber activado el entorno virtual (`.venv\Scripts\activate`) y ejecutar `pip install -r requirements.txt`.
