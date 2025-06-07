import sys
import os
import random
from datetime import datetime, timedelta

# Añadir el directorio raíz al path para importar los módulos de la aplicación
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models.base import SessionLocal
from app.models import Student, AccessLog, AccessType, AuthorizedBy, Staff

def crear_registros_acceso():
    db = SessionLocal()
    try:
        # Obtener todos los alumnos
        alumnos = db.query(Student).all()
        if not alumnos:
            print("No hay alumnos en la base de datos.")
            return
        
        # Obtener un miembro del staff para autorizar los accesos
        staff = db.query(Staff).first()
        if not staff:
            print("No hay personal registrado para autorizar accesos.")
            return
        
        # Fecha base (hoy)
        hoy = datetime.now().replace(hour=7, minute=0, second=0, microsecond=0)
        entradas_creadas = 0
        salidas_creadas = 0
        
        # Para cada alumno, decidir aleatoriamente si hoy asistió o no
        for alumno in alumnos:
            # 80% de probabilidad de asistencia
            if random.random() < 0.8:
                # Hora de entrada aleatoria entre 7:00 AM y 8:30 AM
                minutos_entrada = random.randint(0, 90)  # 90 minutos = 1h30m
                hora_entrada = hoy + timedelta(minutes=minutos_entrada)
                
                # Crear registro de entrada
                entrada = AccessLog(
                    student_id=alumno.id,
                    access_type=AccessType.ENTRADA,
                    timestamp=hora_entrada,
                    authorized_by=AuthorizedBy.MANUAL,
                    authorized_by_staff_id=staff.id,
                    notes="Entrada registrada automáticamente"
                )
                db.add(entrada)
                entradas_creadas += 1
                
                # 70% de probabilidad de que ya haya salido (para simular alumnos presentes)
                if random.random() < 0.7:
                    # Hora de salida aleatoria entre 1:00 PM y 3:00 PM
                    hora_base_salida = hoy.replace(hour=13, minute=0)
                    minutos_salida = random.randint(0, 120)  # 120 minutos = 2h
                    hora_salida = hora_base_salida + timedelta(minutes=minutos_salida)
                    
                    # Crear registro de salida
                    salida = AccessLog(
                        student_id=alumno.id,
                        access_type=AccessType.SALIDA,
                        timestamp=hora_salida,
                        authorized_by=AuthorizedBy.MANUAL,
                        authorized_by_staff_id=staff.id,
                        notes="Salida registrada automáticamente"
                    )
                    db.add(salida)
                    salidas_creadas += 1
        
        db.commit()
        print(f"Se han creado {entradas_creadas} registros de entrada y {salidas_creadas} registros de salida.")
        
    finally:
        db.close()

if __name__ == "__main__":
    crear_registros_acceso() 