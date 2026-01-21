from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from src.models.enums import Rol, TipoServicio, EstadoPedido, EstadoFrecuente, MetodoPago

# --- Auth & Users ---
class UserBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, kw_only=True)
    email: EmailStr
    nombre: str
    rol: Rol = Rol.RECEPCIONISTA
    activo: bool = True

class UserCreate(UserBase):
    password: str
    telefono: Optional[str] = None
    patente: Optional[str] = None

class UserRead(UserBase):
    id: int
    creado_en: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    rol: Optional[Rol] = None
    user_id: Optional[int] = None

class LoginRequest(BaseModel):
    email: str
    password: str

# --- Chofer ---
class ChoferBase(BaseModel):
    telefono: str
    patente: str

class ChoferCreate(ChoferBase):
    usuario_id: int

class ChoferRead(ChoferBase):
    id: int
    usuario: UserRead
    
    class Config:
        from_attributes = True

# --- Zonas & Geo ---
class ZonaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, kw_only=True)
    nombre: str
    polygon_geojson: str 
    dias_operativos: List[str] = Field(default_factory=list)
    activo: bool = True

class ZonaCreate(ZonaBase):
    pass

class ZonaRead(ZonaBase):
    id: int
    creado_en: datetime
    
    class Config:
        from_attributes = True

class RutaDiaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, kw_only=True)
    dia_semana: int # 0-6
    zona_id: int
    chofer_id: Optional[int] = None
    activo: bool = True

class RutaDiaCreate(RutaDiaBase):
    pass

class RutaDiaRead(RutaDiaBase):
    id: int
    zona: ZonaRead
    chofer: Optional[ChoferRead] = None
    
    class Config:
        from_attributes = True

# --- Business ---
class ClienteBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, kw_only=True)
    nombre: str
    telefono: str
    direccion: str
    email: Optional[str] = None
    cuit: Optional[str] = None

class ClienteCreate(ClienteBase):
    pass

class ClienteRead(ClienteBase):
    id: int
    
    class Config:
        from_attributes = True

class PedidoBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, kw_only=True)
    cliente_id: int
    tipo_servicio: TipoServicio
    direccion: str
    costo: float
    descripcion: Optional[str] = None
    zona_id: Optional[int] = None
    fecha_hora_ejecucion: Optional[datetime] = None

    @field_validator('fecha_hora_ejecucion', mode='after')
    @classmethod
    def ensure_naive_pedido(cls, v: Optional[datetime]):
        if v and v.tzinfo is not None:
            return v.replace(tzinfo=None)
        return v

class PedidoCreate(PedidoBase):
    pass

class PedidoRead(PedidoBase):
    id: int
    estado: EstadoPedido
    fecha_hora_recepcion: datetime
    cliente: ClienteRead
    lat: Optional[float] = None
    lng: Optional[float] = None
    zona_id: Optional[int] = None
    chofer_id: Optional[int] = None
    fecha_hora_ejecucion: Optional[datetime] = None
    zona: Optional[ZonaRead] = None
    chofer: Optional[ChoferRead] = None
    
    class Config:
        from_attributes = True

class FrecuenteBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, kw_only=True)
    cliente_id: int
    direccion: str
    telefono: str
    tipo_servicio: str
    cantidad: int
    fecha_inicio: datetime
    dias_semana: List[str] # ["Lunes", "Martes"]
    dia_saliente: Optional[str] = None
    fecha_fin: Optional[datetime] = None
    costo_individual: float = 0.0

    @field_validator('fecha_inicio', 'fecha_fin', mode='after')
    @classmethod
    def ensure_naive(cls, v: Optional[datetime]):
        if v and v.tzinfo is not None:
            return v.replace(tzinfo=None)
        return v

class FrecuenteCreate(FrecuenteBase):
    pass

class FrecuenteRead(FrecuenteBase):
    id: int
    estado: EstadoFrecuente
    total: float
    cliente: ClienteRead
    lat: Optional[float] = None
    lng: Optional[float] = None
    zona_id: Optional[int] = None
    chofer_id: Optional[int] = None
    zona: Optional[ZonaRead] = None
    chofer: Optional[ChoferRead] = None
    
    class Config:
        from_attributes = True

class PagoCreate(BaseModel):
    monto: float
    metodo_pago: MetodoPago
    pedido_id: Optional[int] = None
    frecuente_id: Optional[int] = None
    
    @field_validator('monto')
    def validate_target(cls, v, info):
        # We can implement specific validation here if needed
        return v

class PagoRead(BaseModel):
    id: int
    monto: float
    metodo_pago: MetodoPago
    fecha: datetime
    registrado_por: Optional[int] = None
    
    class Config:
        from_attributes = True
class SesionTrabajoBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, kw_only=True)
    chofer_id: int
    inicio: datetime
    fin: Optional[datetime] = None
    total_horas: Optional[float] = None

class SesionTrabajoRead(SesionTrabajoBase):
    id: int
    chofer_nombre: Optional[str] = None

class GastoBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, kw_only=True)
    monto: float
    categoria: str
    descripcion: Optional[str] = None
    fecha: datetime = Field(default_factory=datetime.utcnow)
    chofer_id: Optional[int] = None

class GastoCreate(GastoBase):
    pass

class GastoRead(GastoBase):
    id: int
    registrado_por: int
