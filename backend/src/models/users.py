from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db import Base
from src.models.enums import Rol
from src.utils.time_utils import get_now_arg

class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    rol: Mapped[Rol] = mapped_column(Enum(Rol), default=Rol.RECEPCIONISTA)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=get_now_arg)

    # Relationships
    chofer_perfil: Mapped[Optional["Chofer"]] = relationship("Chofer", back_populates="usuario", uselist=False)
    # pedidos_registrados: Mapped[List["PedidoIndividual"]] = relationship("PedidoIndividual", back_populates="recepcionista")
    # pagos_registrados: Mapped[List["Pago"]] = relationship("Pago", back_populates="registrado_por")


class SesionTrabajo(Base):
    __tablename__ = "sesiones_trabajo"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    chofer_id: Mapped[int] = mapped_column(ForeignKey("choferes.id"))
    inicio: Mapped[datetime] = mapped_column(DateTime, default=get_now_arg)
    fin: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    total_horas: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    chofer: Mapped["Chofer"] = relationship("Chofer", back_populates="sesiones")


class Chofer(Base):
    __tablename__ = "choferes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), unique=True)
    telefono: Mapped[str] = mapped_column(String)
    patente: Mapped[str] = mapped_column(String)
    zona_gastos: Mapped[Optional[str]] = mapped_column(String, nullable=True) # E.g. "Zona de viáticos"

    # Relationships
    usuario: Mapped["Usuario"] = relationship("Usuario", back_populates="chofer_perfil")
    sesiones: Mapped[List["SesionTrabajo"]] = relationship("SesionTrabajo", back_populates="chofer")
    # rutas: Mapped[List["RutaDia"]] = relationship("RutaDia", back_populates="chofer")
    # pedidos: Mapped[List["PedidoIndividual"]] = relationship("PedidoIndividual", back_populates="chofer")
    # frecuentes: Mapped[List["ServicioFrecuente"]] = relationship("ServicioFrecuente", back_populates="chofer")
