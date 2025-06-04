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

## Licencia

Este proyecto está licenciado bajo [LICENSE] - ver el archivo LICENSE para más detalles. 
