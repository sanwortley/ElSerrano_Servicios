from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from src.db import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    accion = Column(String)  # LOGIN, CREATE_ORDER, DELETE_CLIENT, etc.
    recurso = Column(String) # pedidos, clientes, auth
    recurso_id = Column(Integer, nullable=True)
    detalles = Column(JSON, nullable=True) # Datos anteriores o metadata
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario")
