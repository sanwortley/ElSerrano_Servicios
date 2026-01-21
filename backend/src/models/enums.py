from enum import Enum

class Rol(str, Enum):
    ADMIN = "ADMIN"
    RECEPCIONISTA = "RECEPCIONISTA"
    CHOFER = "CHOFER"

class TipoServicio(str, Enum):
    DESAGOTE_DESTAPE = "Desagotes y destapes de cañerías"
    MOVIMIENTO_SUELO = "Movimiento de suelo"
    EVENTA_ARIDOS = "Venta de áridos, piedras y rellenos"
    VOLQUETES_CONTENEDORES = "Volquetes y contenedores para obra"
    ALQUILER_OBRADORES = "Alquiler de obradores"
    BANOS_QUIMICOS = "Alquiler de baños químicos"
    OTROS = "Otros"

class EstadoPedido(str, Enum):
    CREADA = "CREADA"
    ASIGNADA = "ASIGNADA"
    EN_CAMINO = "EN_CAMINO"
    ENTREGADO = "ENTREGADO"
    COMPLETADA = "COMPLETADA"
    CANCELADA = "CANCELADA"
    FINALIZADO = "FINALIZADO"

class EstadoFrecuente(str, Enum):
    ACTIVO = "ACTIVO"
    PAUSADO = "PAUSADO"
    FINALIZADO = "FINALIZADO"

class MetodoPago(str, Enum):
    EFECTIVO = "EFECTIVO"
    TRANSFERENCIA = "TRANSFERENCIA"
    CHEQUE = "CHEQUE"
