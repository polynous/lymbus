import sys
import os
import random
from passlib.context import CryptContext

# Añadir el directorio raíz al path para importar los módulos de la aplicación
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.base import SessionLocal
from app.models import User, Guardian, Student, guardian_student
from sqlalchemy import insert

# Configuración para hash de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Lista de relaciones
relaciones = ["padre", "madre", "abuelo", "abuela", "tío", "tía", "tutor legal"]

# Lista de nombres y apellidos para generar datos aleatorios
nombres = [
    "Roberto", "Carmen", "Jorge", "Silvia", "Héctor", "Adriana", "Francisco", "Patricia",
    "Antonio", "Verónica", "José", "Laura", "Manuel", "Teresa", "Ricardo", "Claudia",
    "Javier", "Cristina", "Fernando", "Marta", "Miguel", "Rosa", "Pedro", "Alicia",
    "Guillermo", "Alejandra", "Juan", "Susana", "Carlos", "María", "Alberto", "Ana",
    "Mario", "Elena", "Arturo", "Beatriz", "Raúl", "Lourdes", "Daniel", "Mónica"
]

apellidos = [
    "García", "Rodríguez", "López", "Martínez", "González", "Pérez", "Sánchez", "Ramírez",
    "Torres", "Flores", "Rivera", "Gómez", "Díaz", "Cruz", "Hernández", "Reyes", "Morales",
    "Jiménez", "Ortiz", "Vargas", "Romero", "Navarro", "Mendoza", "Ramos", "Castillo",
    "Moreno", "Castro", "Ruiz", "Alvarez", "Suárez", "Vázquez", "Gutiérrez", "Aguilar",
    "Molina", "Silva", "Rojas", "Medina", "Cortés", "Delgado", "Herrera"
]

def crear_tutores():
    db = SessionLocal()
    try:
        # Obtener todos los alumnos
        alumnos = db.query(Student).all()
        
        if not alumnos:
            print("No hay alumnos en la base de datos.")
            return
        
        tutores_creados = 0
        emails_usados = set()
        
        # Crear un padre y una madre para cada grupo familiar (apellido)
        familias = {}
        
        # Agrupar alumnos por apellido
        for alumno in alumnos:
            apellido = alumno.last_name.split()[0]  # Tomamos el primer apellido
            if apellido not in familias:
                familias[apellido] = []
            familias[apellido].append(alumno)
        
        # Crear tutores para cada familia
        for apellido, hijos in familias.items():
            # Crear padre (usuario + guardian)
            hashed_password = pwd_context.hash("password123")
            
            # Generar email único para el padre
            nombre_padre = random.choice(nombres)
            base_email_padre = f"{nombre_padre.lower()}.{apellido.lower()}"
            email_padre = f"{base_email_padre}@ejemplo.com"
            count = 1
            while email_padre in emails_usados:
                email_padre = f"{base_email_padre}{count}@ejemplo.com"
                count += 1
            emails_usados.add(email_padre)
            
            usuario_padre = User(
                email=email_padre,
                hashed_password=hashed_password,
                first_name=nombre_padre,
                last_name=apellido,
                is_active=True,
                is_admin=False
            )
            db.add(usuario_padre)
            db.flush()
            
            guardian_padre = Guardian(
                user_id=usuario_padre.id,
                relationship_type="padre",
                phone=f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
            )
            db.add(guardian_padre)
            db.flush()
            
            # Crear madre (usuario + guardian)
            nombre_madre = random.choice(nombres)
            base_email_madre = f"{nombre_madre.lower()}.{apellido.lower()}"
            email_madre = f"{base_email_madre}@ejemplo.com"
            count = 1
            while email_madre in emails_usados:
                email_madre = f"{base_email_madre}{count}@ejemplo.com"
                count += 1
            emails_usados.add(email_madre)
            
            usuario_madre = User(
                email=email_madre,
                hashed_password=hashed_password,
                first_name=nombre_madre,
                last_name=apellido,
                is_active=True,
                is_admin=False
            )
            db.add(usuario_madre)
            db.flush()
            
            guardian_madre = Guardian(
                user_id=usuario_madre.id,
                relationship_type="madre",
                phone=f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
            )
            db.add(guardian_madre)
            db.flush()
            
            # Asociar tutores con alumnos
            for hijo in hijos:
                # Insertar relación padre-hijo
                db.execute(
                    insert(guardian_student).values(
                        guardian_id=guardian_padre.id, 
                        student_id=hijo.id
                    )
                )
                
                # Insertar relación madre-hijo
                db.execute(
                    insert(guardian_student).values(
                        guardian_id=guardian_madre.id, 
                        student_id=hijo.id
                    )
                )
            
            tutores_creados += 2  # Padre y madre
        
        db.commit()
        print(f"Se han creado {tutores_creados} tutores para {len(alumnos)} alumnos.")
        
        # Mostrar algunos tutores de ejemplo
        tutores = db.query(Guardian).join(User).limit(5).all()
        print("\nMuestra de tutores creados:")
        for tutor in tutores:
            alumnos_del_tutor = db.query(Student).join(guardian_student).filter(guardian_student.c.guardian_id == tutor.id).all()
            hijos_str = ", ".join([alumno.first_name for alumno in alumnos_del_tutor])
            print(f"ID: {tutor.id}, Nombre: {tutor.user.first_name} {tutor.user.last_name}, Relación: {tutor.relationship_type}, Hijos: {hijos_str}")
        
    finally:
        db.close()

if __name__ == "__main__":
    crear_tutores() 