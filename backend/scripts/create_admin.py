import sys
import os
from passlib.context import CryptContext

# Añadir el directorio raíz al path para importar los módulos de la aplicación
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.base import SessionLocal
from app.models import User, Staff

# Configuración para hash de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    db = SessionLocal()
    try:
        # Verificar si ya existe un admin
        admin = db.query(User).filter_by(email="admin@lymbus.com").first()
        
        if admin:
            print("El usuario administrador ya existe.")
            return
        
        # Hash de la contraseña
        hashed_password = pwd_context.hash("admin123")
        
        # Crear el usuario admin
        admin = User(
            email="admin@lymbus.com",
            hashed_password=hashed_password,
            first_name="Admin",
            last_name="Lymbus",
            is_active=True,
            is_admin=True
        )
        db.add(admin)
        db.flush()  # Para obtener el ID
        
        # Crear el perfil de staff
        staff = Staff(
            user_id=admin.id,
            position="Director",
            department="Administración"
        )
        db.add(staff)
        
        db.commit()
        print("Usuario administrador creado correctamente.")
        
    finally:
        db.close()

if __name__ == "__main__":
    create_admin() 