from datetime import datetime
from src.utils.time_utils import get_now_arg
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from src.db import Base

class Zona(Base):
    __tablename__ = "zonas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String, unique=True)
    polygon_geojson: Mapped[str] = mapped_column(Text) # GeoJSON string
    dias_operativos: Mapped[list] = mapped_column(JSON, default=list) # List of strings ["Lunes", ...]
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=get_now_arg)

    # Relationships
    # rutas: Mapped[List["RutaDia"]] = relationship("RutaDia", back_populates="zona")


class RutaDia(Base):
    __tablename__ = "rutas_dia"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    dia_semana: Mapped[int] = mapped_column(Integer) # 0=Monday ... 6=Sunday
    zona_id: Mapped[int] = mapped_column(ForeignKey("zonas.id"))
    chofer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("choferes.id"), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    zona: Mapped["Zona"] = relationship("Zona")
    chofer: Mapped[Optional["src.models.users.Chofer"]] = relationship("src.models.users.Chofer")


class GeocodeCache(Base):
    __tablename__ = "geocode_cache"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    query_hash: Mapped[str] = mapped_column(String, unique=True, index=True)
    direccion_normalizada: Mapped[str] = mapped_column(String)
    lat: Mapped[float] = mapped_column()
    lng: Mapped[float] = mapped_column()
    raw_json: Mapped[dict] = mapped_column(JSON)
    creado_en: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
