# Lymbus - Plataforma de Logística Escolar

Lymbus es una plataforma digital diseñada para transformar la logística escolar, enfocándose en la seguridad, eficiencia y comunicación dentro de las instituciones educativas. Esta plataforma proporciona un control integral de acceso y salida de estudiantes mediante tecnologías como códigos QR y reconocimiento facial.

## Características Principales

- **Control de Ingresos y Salidas**: Gestión rápida y segura del acceso de alumnos, colaboradores, tutores y visitantes mediante códigos QR o reconocimiento facial.
- **Visibilidad y Monitoreo en Tiempo Real**: Monitoreo digital y automático de las entradas y salidas, con información en tiempo real sobre la ocupación del colegio.
- **Comunicación Directa con Padres de Familia**: Canales de comunicación eficientes a través de la aplicación.

## Estructura del Proyecto

- **Backend**: API desarrollada con FastAPI y SQLAlchemy (Python)
- **Frontend Web**: Aplicación web desarrollada con React
- **Frontend Móvil**: Aplicación móvil desarrollada con React Native

## Requisitos

### Backend
- Python 3.8+
- FastAPI
- SQLAlchemy
- Uvicorn
- Otras dependencias especificadas en `backend/requirements.txt`

## Configuración e Instalación

### Backend

1. Crear un entorno virtual:
```
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

2. Instalar dependencias:
```
cd backend
pip install -r requirements.txt
```

3. Ejecutar el servidor:
```
cd backend
uvicorn app.main:app --reload
```

4. Acceder a la documentación de la API:
```
http://localhost:8000/docs
```
### Frontend

1. Instalar dependencias de Node.js:
```bash
cd app
npm install
```
2. Ejecutar en modo desarrollo:
```bash
npm start
```
3. Generar la versión de producción:
```bash
npm run build
```

El archivo `netlify.toml` incluye la configuración necesaria para desplegar la aplicación web en Netlify.

### Variables de Entorno

Copiar los archivos `backend/env.example` y `app/env.example` a `.env` dentro de sus respectivas carpetas y completar los valores necesarios (`SECRET_KEY`, `DATABASE_URL`, `REACT_APP_API_URL`, etc.). Estos archivos se usarán tanto localmente como en producción.

### Despliegue con Docker

Se incluye un `Dockerfile` para el backend y un `docker-compose.yml` que levanta la API, una base de datos PostgreSQL y el frontend.
Para iniciar todo el entorno ejecuta:
```bash
docker-compose up --build
```

### Opciones de Despliegue

- **Render**: utiliza `backend/render.yaml` para desplegar la API con una base de datos gestionada.
- **Railway**: existe un `railway.toml` básico para lanzar la aplicación en Railway.
- **Netlify**: el frontend puede publicarse con la configuración incluida en `netlify.toml`.

## Licencia

El proyecto está disponible bajo los términos de la licencia MIT. Consulta el archivo `LICENSE` para más información.
