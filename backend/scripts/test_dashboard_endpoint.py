import sys
import os
import json
import requests
from datetime import datetime

# Añadir el directorio raíz al path para importar los módulos de la aplicación
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.auth import create_access_token

API_URL = "http://localhost:8001/api"

def test_dashboard_endpoint():
    # Obtener token para el usuario administrador
    auth_response = requests.post(
        f"{API_URL}/auth/token",
        data={
            "username": "admin@lymbus.com", 
            "password": "admin123"
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if auth_response.status_code != 200:
        print(f"Error de autenticación: {auth_response.status_code}")
        print(auth_response.text)
        return
    
    token_data = auth_response.json()
    token = token_data.get("access_token")
    
    # Obtener la fecha actual en formato YYYY-MM-DD
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Realizar llamada al endpoint del dashboard
    dashboard_response = requests.get(
        f"{API_URL}/access/stats/dashboard",
        params={"date": today},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print(f"Status code: {dashboard_response.status_code}")
    
    if dashboard_response.status_code == 200:
        data = dashboard_response.json()
        print(json.dumps(data, indent=2))
    else:
        print(f"Error al consultar el endpoint: {dashboard_response.text}")

if __name__ == "__main__":
    test_dashboard_endpoint() 