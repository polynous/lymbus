import sys
import os

# Añadir el directorio raíz al path para importar los módulos de la aplicación
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.base import Base, engine
from app.models import User, Staff, Guardian, School, Classroom, Student, AccessLog

def recreate_tables():
    """Elimina todas las tablas y las vuelve a crear"""
    print("Eliminando todas las tablas...")
    Base.metadata.drop_all(bind=engine)
    
    print("Creando todas las tablas...")
    Base.metadata.create_all(bind=engine)
    
    print("Base de datos recreada correctamente.")

if __name__ == "__main__":
    recreate_tables() 