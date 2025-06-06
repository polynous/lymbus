import sys
import os
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Añadir el directorio raíz al path para importar los módulos de la aplicación
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.base import SessionLocal, engine
from app.models import Student, Classroom, School, GradeLevel
from app.models.base import Base

# Lista de nombres y apellidos para generar datos aleatorios
nombres = [
    "Ana", "Luis", "María", "Carlos", "Sofía", "Juan", "Valentina", "Diego", "Camila", "José",
    "Isabella", "Daniel", "Mariana", "Miguel", "Gabriela", "Alejandro", "Valeria", "David", "Lucía", "Fernando",
    "Emma", "Javier", "Natalia", "Santiago", "Regina", "Andrés", "Paula", "Ricardo", "Ximena", "Eduardo",
    "Renata", "Francisco", "Andrea", "Gabriel", "Sara", "Pablo", "Fernanda", "Emilio", "Daniela", "Sebastián",
    "Miranda", "Manuel", "Carolina", "Jorge", "Samantha", "Óscar", "Laura", "Mateo", "Julia", "Alberto"
]

apellidos = [
    "García", "Rodríguez", "López", "Martínez", "González", "Pérez", "Sánchez", "Ramírez", "Torres", "Flores",
    "Rivera", "Gómez", "Díaz", "Cruz", "Hernández", "Reyes", "Morales", "Jiménez", "Ortiz", "Vargas",
    "Romero", "Navarro", "Mendoza", "Ramos", "Castillo", "Moreno", "Castro", "Ruiz", "Alvarez", "Suárez",
    "Vázquez", "Gutiérrez", "Aguilar", "Molina", "Silva", "Rojas", "Medina", "Cortés", "Delgado", "Herrera",
    "Arias", "Acosta", "Guerrero", "Contreras", "Campos", "Fuentes", "Cabrera", "Miranda", "Carrillo", "Soto"
]

def generar_matricula(db: Session):
    """Genera una matrícula aleatoria con formato A12345 y verifica que no exista ya"""
    while True:
        matricula = f"A{random.randint(10000, 99999)}"
        # Verificar que la matrícula no exista ya
        alumno_existente = db.query(Student).filter_by(enrollment_id=matricula).first()
        if not alumno_existente:
            return matricula

def eliminar_alumnos_existentes(db: Session):
    """Elimina todos los alumnos existentes en la base de datos"""
    num_eliminados = db.query(Student).delete()
    db.commit()
    return num_eliminados

def crear_escuela_si_no_existe(db: Session):
    """Crea una escuela si no existe ninguna"""
    escuela = db.query(School).first()
    if not escuela:
        escuela = School(
            name="Colegio Lymbus",
            address="Av. Principal 123",
            city="Ciudad de México",
            state="CDMX",
            postal_code="01000",
            country="México",
            phone="555-123-4567",
            email="info@colegiolymbus.edu.mx",
            website="www.colegiolymbus.edu.mx",
            director_name="Dr. Roberto Gómez"
        )
        db.add(escuela)
        db.commit()
    return escuela

def crear_salones(db: Session, escuela_id: int):
    """Crea salones para cada grado y grupo"""
    grupos = ["A", "B"]
    salones = {}
    
    for grado in GradeLevel:
        for grupo in grupos:
            nombre_salon = f"{grado.value} {grupo}"
            salon = db.query(Classroom).filter_by(name=nombre_salon).first()
            if not salon:
                salon = Classroom(
                    school_id=escuela_id,
                    name=nombre_salon,
                    grade_level=grado
                )
                db.add(salon)
            salones.setdefault(grado.value, []).append(salon)
    
    db.commit()
    return salones

def crear_alumnos(db: Session, salones):
    """Crea al menos 50 alumnos distribuidos en diferentes grados y grupos"""
    alumnos_creados = 0
    alumnos_por_salon = {}
    
    # Distribuir aprox. 3-4 alumnos por salón para tener al menos 50 en total
    for grado, lista_salones in salones.items():
        for salon in lista_salones:
            # Entre 3 y 4 alumnos por salón
            num_alumnos = random.randint(3, 4)
            alumnos_por_salon[salon.id] = num_alumnos
    
    # Asegurarse de que haya al menos 50 alumnos en total
    total_alumnos = sum(alumnos_por_salon.values())
    if total_alumnos < 50:
        # Agregar alumnos adicionales aleatoriamente
        alumnos_adicionales = 50 - total_alumnos
        salon_ids = list(alumnos_por_salon.keys())
        for _ in range(alumnos_adicionales):
            salon_id = random.choice(salon_ids)
            alumnos_por_salon[salon_id] = alumnos_por_salon[salon_id] + 1
    
    # Crear los alumnos
    for salon_id, num_alumnos in alumnos_por_salon.items():
        salon = db.query(Classroom).filter_by(id=salon_id).first()
        for _ in range(num_alumnos):
            # Generar datos del alumno
            nombre = random.choice(nombres)
            apellido_paterno = random.choice(apellidos)
            apellido_materno = random.choice(apellidos)
            fecha_nacimiento = datetime.now() - timedelta(days=365 * random.randint(5, 18))
            genero = random.choice(["M", "F"])
            
            alumno = Student(
                first_name=nombre,
                last_name=f"{apellido_paterno} {apellido_materno}",
                enrollment_id=generar_matricula(db),
                date_of_birth=fecha_nacimiento.date(),
                gender=genero,
                classroom_id=salon_id,
                school_id=salon.school_id,
                medical_notes=f"alumno de {salon.name}"
            )
            db.add(alumno)
            alumnos_creados += 1
    
    db.commit()
    return alumnos_creados

def main():
    db = SessionLocal()
    try:
        # Eliminar alumnos existentes
        num_eliminados = eliminar_alumnos_existentes(db)
        if num_eliminados > 0:
            print(f"Se han eliminado {num_eliminados} alumnos existentes.")
        
        # Crear la escuela si no existe
        escuela = crear_escuela_si_no_existe(db)
        
        # Crear salones para cada grado y grupo
        salones = crear_salones(db, escuela.id)
        
        # Crear alumnos
        num_alumnos = crear_alumnos(db, salones)
        
        print(f"Se han creado {num_alumnos} alumnos correctamente.")
        
        # Listar algunos alumnos como muestra
        alumnos = db.query(Student).limit(10).all()
        print("\nMuestra de alumnos creados:")
        for alumno in alumnos:
            salon = db.query(Classroom).filter_by(id=alumno.classroom_id).first()
            print(f"ID: {alumno.id}, Nombre: {alumno.first_name} {alumno.last_name}, Matrícula: {alumno.enrollment_id}, Salón: {salon.name}")
        
        # Mostrar total por grado y grupo
        print("\nDistribución de alumnos por salón:")
        salones_con_alumnos = db.query(Classroom).all()
        for salon in salones_con_alumnos:
            count = db.query(Student).filter_by(classroom_id=salon.id).count()
            if count > 0:
                print(f"Salón: {salon.name} - {count} alumnos")
        
    finally:
        db.close()

if __name__ == "__main__":
    main() 