"""initial

Revision ID: 0001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Enums
    # We must explicitly create them if using postgresql dialect and Enums
    # However, create_table handles it usually if using sa.Enum with specific values.
    # But for cleaner SQL, often separate type creation is needed.
    # We will use sa.Enum(..., name='...') inline.
    
    # 1. Usuarios
    op.create_table('usuarios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('rol', sa.Enum('ADMIN', 'RECEPCIONISTA', 'CHOFER', name='rol'), nullable=False),
        sa.Column('activo', sa.Boolean(), nullable=False),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_usuarios_email'), 'usuarios', ['email'], unique=True)
    op.create_index(op.f('ix_usuarios_id'), 'usuarios', ['id'], unique=False)

    # 2. Choferes
    op.create_table('choferes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('telefono', sa.String(), nullable=False),
        sa.Column('patente', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('usuario_id')
    )
    op.create_index(op.f('ix_choferes_id'), 'choferes', ['id'], unique=False)

    # 3. Zonas
    op.create_table('zonas',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(), nullable=False),
        sa.Column('polygon_geojson', sa.Text(), nullable=False),
        sa.Column('activo', sa.Boolean(), nullable=False),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nombre')
    )
    op.create_index(op.f('ix_zonas_id'), 'zonas', ['id'], unique=False)

    # 4. RutasDia
    op.create_table('rutas_dia',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('dia_semana', sa.Integer(), nullable=False),
        sa.Column('zona_id', sa.Integer(), nullable=False),
        sa.Column('chofer_id', sa.Integer(), nullable=True),
        sa.Column('activo', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['chofer_id'], ['choferes.id'], ),
        sa.ForeignKeyConstraint(['zona_id'], ['zonas.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_rutas_dia_id'), 'rutas_dia', ['id'], unique=False)

    # 5. GeocodeCache
    op.create_table('geocode_cache',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('query_hash', sa.String(), nullable=False),
        sa.Column('direccion_normalizada', sa.String(), nullable=False),
        sa.Column('lat', sa.Float(), nullable=False),
        sa.Column('lng', sa.Float(), nullable=False),
        sa.Column('raw_json', sa.JSON(), nullable=False),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_geocode_cache_id'), 'geocode_cache', ['id'], unique=False)
    op.create_index(op.f('ix_geocode_cache_query_hash'), 'geocode_cache', ['query_hash'], unique=True)

    # 6. Clientes
    op.create_table('clientes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(), nullable=False),
        sa.Column('telefono', sa.String(), nullable=False),
        sa.Column('direccion', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_clientes_id'), 'clientes', ['id'], unique=False)

    # 7. PedidoIndividual
    op.create_table('pedidos_individuales',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cliente_id', sa.Integer(), nullable=False),
        sa.Column('tipo_servicio', sa.Enum('RETIRO_ESCOMBROS', 'ENTREGA_VOLQUETE', 'DESAGOTE', name='tiposervicio'), nullable=False),
        sa.Column('direccion', sa.String(), nullable=False),
        sa.Column('lat', sa.Float(), nullable=True),
        sa.Column('lng', sa.Float(), nullable=True),
        sa.Column('zona_id', sa.Integer(), nullable=True),
        sa.Column('descripcion', sa.String(), nullable=True),
        sa.Column('costo', sa.Float(), nullable=False),
        sa.Column('estado', sa.Enum('CREADA', 'ASIGNADA', 'EN_CAMINO', 'ENTREGADO', 'FINALIZADO', name='estadopedido'), nullable=False),
        sa.Column('fecha_hora_recepcion', sa.DateTime(), nullable=False),
        sa.Column('fecha_hora_ejecucion', sa.DateTime(), nullable=True),
        sa.Column('recepcionista_id', sa.Integer(), nullable=True),
        sa.Column('chofer_id', sa.Integer(), nullable=True),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['chofer_id'], ['choferes.id'], ),
        sa.ForeignKeyConstraint(['cliente_id'], ['clientes.id'], ),
        sa.ForeignKeyConstraint(['recepcionista_id'], ['usuarios.id'], ),
        sa.ForeignKeyConstraint(['zona_id'], ['zonas.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pedidos_individuales_id'), 'pedidos_individuales', ['id'], unique=False)

    # 8. ServicioFrecuente
    op.create_table('servicios_frecuentes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('cliente_id', sa.Integer(), nullable=False),
        sa.Column('direccion', sa.String(), nullable=False),
        sa.Column('lat', sa.Float(), nullable=True),
        sa.Column('lng', sa.Float(), nullable=True),
        sa.Column('zona_id', sa.Integer(), nullable=True),
        sa.Column('telefono', sa.String(), nullable=False),
        sa.Column('cantidad_banios', sa.Integer(), nullable=False),
        sa.Column('costo_individual', sa.Float(), nullable=False),
        sa.Column('total', sa.Float(), nullable=False),
        sa.Column('fecha_inicio', sa.DateTime(), nullable=False),
        sa.Column('fecha_fin', sa.DateTime(), nullable=True),
        sa.Column('dias_limpieza', sa.JSON(), nullable=False),
        sa.Column('chofer_id', sa.Integer(), nullable=True),
        sa.Column('estado', sa.Enum('ACTIVO', 'PAUSADO', 'FINALIZADO', name='estadofrecuente'), nullable=False),
        sa.Column('creado_en', sa.DateTime(), nullable=False),
        sa.Column('actualizado_en', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['chofer_id'], ['choferes.id'], ),
        sa.ForeignKeyConstraint(['cliente_id'], ['clientes.id'], ),
        sa.ForeignKeyConstraint(['zona_id'], ['zonas.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_servicios_frecuentes_id'), 'servicios_frecuentes', ['id'], unique=False)

    # 9. Pagos
    op.create_table('pagos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('pedido_id', sa.Integer(), nullable=True),
        sa.Column('frecuente_id', sa.Integer(), nullable=True),
        sa.Column('monto', sa.Float(), nullable=False),
        sa.Column('metodo_pago', sa.Enum('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', name='metodopago'), nullable=False),
        sa.Column('fecha', sa.DateTime(), nullable=False),
        sa.Column('registrado_por', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['frecuente_id'], ['servicios_frecuentes.id'], ),
        sa.ForeignKeyConstraint(['pedido_id'], ['pedidos_individuales.id'], ),
        sa.ForeignKeyConstraint(['registrado_por'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pagos_id'), 'pagos', ['id'], unique=False)


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_index(op.f('ix_pagos_id'), table_name='pagos')
    op.drop_table('pagos')
    
    op.drop_index(op.f('ix_servicios_frecuentes_id'), table_name='servicios_frecuentes')
    op.drop_table('servicios_frecuentes')
    
    op.drop_index(op.f('ix_pedidos_individuales_id'), table_name='pedidos_individuales')
    op.drop_table('pedidos_individuales')
    
    op.drop_index(op.f('ix_clientes_id'), table_name='clientes')
    op.drop_table('clientes')
    
    op.drop_index(op.f('ix_geocode_cache_query_hash'), table_name='geocode_cache')
    op.drop_index(op.f('ix_geocode_cache_id'), table_name='geocode_cache')
    op.drop_table('geocode_cache')
    
    op.drop_index(op.f('ix_rutas_dia_id'), table_name='rutas_dia')
    op.drop_table('rutas_dia')
    
    op.drop_index(op.f('ix_zonas_id'), table_name='zonas')
    op.drop_table('zonas')
    
    op.drop_index(op.f('ix_choferes_id'), table_name='choferes')
    op.drop_table('choferes')
    
    op.drop_index(op.f('ix_usuarios_email'), table_name='usuarios')
    op.drop_index(op.f('ix_usuarios_id'), table_name='usuarios')
    op.drop_table('usuarios')
    
    # Drop Enums
    sa.Enum(name='metodopago').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='estadofrecuente').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='estadopedido').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='tiposervicio').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='rol').drop(op.get_bind(), checkfirst=True)
