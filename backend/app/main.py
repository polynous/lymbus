from fastapi import FastAPI, Request, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
import json
import logging
from typing import List, Dict, Set
from datetime import datetime

from app.models import create_tables
from app.database import engine
from app.routes import auth, access, invitations, notifications, teacher, pickup

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Lymbus API",
    description="API para la plataforma Lymbus de logística escolar",
    version="0.1.0"
)

# Configuración de CORS mejorada
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://localhost:(3000|3004)|http://127\.0\.0\.1:(3000|3004)",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str = None):
        await websocket.accept()
        self.active_connections.append(websocket)
        if client_id:
            self.user_connections[client_id] = websocket
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket, client_id: str = None):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if client_id and client_id in self.user_connections:
            del self.user_connections[client_id]
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for conn in disconnected:
            if conn in self.active_connections:
                self.active_connections.remove(conn)

    async def send_to_user(self, user_id: str, message: str):
        if user_id in self.user_connections:
            try:
                await self.user_connections[user_id].send_text(message)
            except Exception as e:
                logger.error(f"Error sending message to user {user_id}: {e}")
                # Remove disconnected user
                del self.user_connections[user_id]

manager = ConnectionManager()

# Global exception handler to provide more details on errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global exception: {str(exc)}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

@app.get("/test-cors")
def test_cors():
    return {"message": "CORS test endpoint", "origins": [
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3004", 
        "http://127.0.0.1:3004"
    ]}

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API de Lymbus - Plataforma de logística escolar"}

# WebSocket endpoint for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_text()
            try:
                # Parse JSON message
                message = json.loads(data)
                message_type = message.get("type", "unknown")
                
                # Handle ping/heartbeat
                if message_type == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.now().isoformat()
                    }))
                    
                # Handle other message types as needed
                elif message_type == "subscribe":
                    # Client wants to subscribe to specific events
                    await websocket.send_text(json.dumps({
                        "type": "subscribed",
                        "timestamp": datetime.now().isoformat()
                    }))
                    
                else:
                    # Echo unknown messages for debugging
                    await websocket.send_text(json.dumps({
                        "type": "echo",
                        "original": message,
                        "timestamp": datetime.now().isoformat()
                    }))
                    
            except json.JSONDecodeError:
                # Handle non-JSON messages
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON format",
                    "timestamp": datetime.now().isoformat()
                }))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket connection closed by client")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# Function to broadcast real-time updates (can be called from other routes)
async def broadcast_update(event_type: str, data: dict):
    """Broadcast real-time updates to all connected clients"""
    message = json.dumps({
        "type": event_type,
        "data": data,
        "timestamp": datetime.now().isoformat()
    })
    await manager.broadcast(message)

# Registrar rutas
app.include_router(auth.router, prefix="/api/auth", tags=["autenticación"])
app.include_router(access.router, prefix="/api/access", tags=["control-acceso"])
app.include_router(invitations.router, prefix="/api/invitations", tags=["invitaciones"])
app.include_router(notifications.router, prefix="/api", tags=["notificaciones"])
app.include_router(teacher.router, prefix="/api/teacher", tags=["profesor"])
app.include_router(pickup.router, prefix="/api/pickup", tags=["recogidas"])

# Crear tablas en la base de datos al iniciar
@app.on_event("startup")
def startup_db_client():
    create_tables(engine)

# Health check endpoint with WebSocket info
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "websocket_connections": len(manager.active_connections),
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 