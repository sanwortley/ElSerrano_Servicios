from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Float, DateTime, ForeignKey, Enum, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db import Base
from src.models.enums import TipoServicio, EstadoPedido, EstadoFrecuente, MetodoPago
from src.utils.time_utils import get_now_arg

class Cliente(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String)
    telefono: Mapped[str] = mapped_column(String)
    direccion: Mapped[str] = mapped_column(String)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    cuit: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relationships
    # pedidos: Mapped[List["PedidoIndividual"]] = relationship("PedidoIndividual", back_populates="cliente")
    # frecuentes: Mapped[List["ServicioFrecuente"]] = relationship("ServicioFrecuente", back_populates="cliente")


class PedidoIndividual(Base):
    __tablename__ = "pedidos_individuales"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"))
    tipo_servicio: Mapped[str] = mapped_column(String) # Stored as string to avoid migration conflicts
    direccion: Mapped[str] = mapped_column(String)
    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    zona_id: Mapped[Optional[int]] = mapped_column(ForeignKey("zonas.id"), nullable=True)
    descripcion: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    costo: Mapped[float] = mapped_column(Float)
    estado: Mapped[EstadoPedido] = mapped_column(Enum(EstadoPedido), default=EstadoPedido.CREADA)
    
    fecha_hora_recepcion: Mapped[datetime] = mapped_column(DateTime, default=get_now_arg)
    fecha_hora_ejecucion: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    recepcionista_id: Mapped[Optional[int]] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    chofer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("choferes.id"), nullable=True)
    orden_en_ruta: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=get_now_arg)
    actualizado_en: Mapped[datetime] = mapped_column(DateTime, default=get_now_arg, onupdate=get_now_arg)

    # Relationships
    cliente: Mapped["Cliente"] = relationship("Cliente")
    zona: Mapped[Optional["src.models.geo.Zona"]] = relationship("src.models.geo.Zona")
    recepcionista: Mapped[Optional["src.models.users.Usuario"]] = relationship("src.models.users.Usuario")
    chofer: Mapped[Optional["src.models.users.Chofer"]] = relationship("src.models.users.Chofer")
    pagos: Mapped[List["Pago"]] = relationship("Pago", back_populates="pedido")


class ServicioFrecuente(Base):
    __tablename__ = "servicios_frecuentes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cliente_id: Mapped[int] = mapped_column(ForeignKey("clientes.id"))
    tipo_servicio: Mapped[str] = mapped_column(String, default="Alquiler de baños químicos")
    direccion: Mapped[str] = mapped_column(String)
    lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    zona_id: Mapped[Optional[int]] = mapped_column(ForeignKey("zonas.id"), nullable=True)
    telefono: Mapped[str] = mapped_column(String)
    cantidad: Mapped[int] = mapped_column(Integer, default=1)
    costo_individual: Mapped[float] = mapped_column(Float)
    total: Mapped[float] = mapped_column(Float) # Server side calc
    
    fecha_inicio: Mapped[datetime] = mapped_column(DateTime)
    fecha_fin: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    dias_semana: Mapped[list] = mapped_column(JSON) # List of strings ["Lunes", ...]
    dia_saliente: Mapped[Optional[str]] = mapped_column(String, nullable=True) # Specific exit day
    
    chofer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("choferes.id"), nullable=True)
    estado: Mapped[EstadoFrecuente] = mapped_column(Enum(EstadoFrecuente), default=EstadoFrecuente.ACTIVO)
    orden_en_ruta: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=get_now_arg)
    actualizado_en: Mapped[datetime] = mapped_column(DateTime, default=get_now_arg, onupdate=get_now_arg)

    # Relationships
    cliente: Mapped["Cliente"] = relationship("Cliente")
    zona: Mapped[Optional["src.models.geo.Zona"]] = relationship("src.models.geo.Zona")
    chofer: Mapped[Optional["src.models.users.Chofer"]] = relationship("src.models.users.Chofer")
    pagos: Mapped[List["Pago"]] = relationship("Pago", back_populates="frecuente")


class Pago(Base):
    __tablename__ = "pagos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    pedido_id: Mapped[Optional[int]] = mapped_column(ForeignKey("pedidos_individuales.id"), nullable=True)
    frecuente_id: Mapped[Optional[int]] = mapped_column(ForeignKey("servicios_frecuentes.id"), nullable=True)
    monto: Mapped[float] = mapped_column(Float)
    metodo_pago: Mapped[MetodoPago] = mapped_column(Enum(MetodoPago))
    fecha: Mapped[datetime] = mapped_column(DateTime, default=get_now_arg)
    registrado_por: Mapped[Optional[int]] = mapped_column(ForeignKey("usuarios.id"), nullable=True)

    # Relationships
    pedido: Mapped[Optional["PedidoIndividual"]] = relationship("PedidoIndividual", back_populates="pagos")
    frecuente: Mapped[Optional["ServicioFrecuente"]] = relationship("ServicioFrecuente", back_populates="pagos")
    registrador: Mapped[Optional["src.models.users.Usuario"]] = relationship("src.models.users.Usuario")


class Gasto(Base):
    __tablename__ = "gastos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    monto: Mapped[float] = mapped_column(Float)
    categoria: Mapped[str] = mapped_column(String) # E.g. "Combustible", "Viáticos"
    descripcion: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    fecha: Mapped[datetime] = mapped_column(DateTime, default=get_now_arg)
    
    chofer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("choferes.id"), nullable=True)
    registrado_por: Mapped[int] = mapped_column(ForeignKey("usuarios.id"))

    # Relationships
    chofer: Mapped[Optional["src.models.users.Chofer"]] = relationship("src.models.users.Chofer")
    registrador: Mapped["src.models.users.Usuario"] = relationship("src.models.users.Usuario")
