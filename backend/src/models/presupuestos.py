from sqlalchemy import Column, Integer, String, DateTime, Text
from datetime import datetime
from src.db import Base

class Presupuesto(Base):
    __tablename__ = "presupuestos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    telefono = Column(String)
    direccion = Column(String)
    tipo_servicio = Column(String)
    descripcion = Column(Text)
    estado = Column(String, default="PENDIENTE") # PENDIENTE, CONTACTADO, CERRADO
    timestamp = Column(DateTime, default=datetime.utcnow)
