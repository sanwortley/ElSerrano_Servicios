import React, { useState, useEffect } from 'react';
import { History, Filter, Search, MapPin, Truck, DollarSign } from 'lucide-react';
import api from '../api/axios';
import { PaymentModal } from '../components/PaymentModal';

interface Pedido {
    id: number;
    cliente: { nombre: string; direccion: string };
    tipo_servicio: string;
    direccion: string;
    costo: number;
    estado: string;
    fecha_hora_ejecucion: string;
    chofer?: { id: number; usuario: { nombre: string } };
    pagos?: any[];
}

export const Historial: React.FC = () => {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Todos');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);

    useEffect(() => {
        fetchPedidos();
    }, []);

    const fetchPedidos = async () => {
        try {
            const res = await api.get('/pedidos/');
            setPedidos(res.data);
        } catch (err) {
            console.error("Error fetching historial", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredPedidos = pedidos.filter(p => {
        const matchesFilter = filter === 'Todos' || p.estado === filter;
        const matchesSearch =
            (p.cliente?.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (p.direccion?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (p.tipo_servicio?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div style={{ padding: '0 1rem' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                marginBottom: '3rem',
                background: 'rgba(255, 84, 0, 0.05)',
                padding: '1.5rem',
                borderRadius: '4px',
                border: '1px solid #222'
            }}>
                <History size={40} color="var(--primary-color)" />
                <div>
                    <h1 className="heading-brand" style={{ fontSize: '2.5rem', margin: 0, color: 'white', lineHeight: 1 }}>HISTORIAL DE SERVICIOS</h1>
                    <p style={{ color: 'var(--primary-color)', fontWeight: 800, letterSpacing: '0.1em', marginTop: '0.25rem' }}>LOGÍSTICA Y CONTROL V2.0</p>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="card card-instagram" style={{ marginBottom: '3rem', padding: '1.5rem', backgroundColor: '#000', border: '1px solid #333' }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <label className="form-label" style={{ color: 'var(--text-muted)' }}>BÚSQUEDA RÁPIDA</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--primary-color)' }} />
                            <input
                                type="text"
                                className="form-control"
                                style={{ paddingLeft: '3rem' }}
                                placeholder="CLIENTE, DIRECCIÓN O SERVICIO..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ width: '220px' }}>
                        <label className="form-label" style={{ color: 'var(--text-muted)' }}>FILTRAR POR ESTADO</label>
                        <div style={{ position: 'relative' }}>
                            <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--primary-color)' }} />
                            <select
                                className="form-control"
                                style={{ paddingLeft: '3rem' }}
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option>Todos</option>
                                <option>CREADA</option>
                                <option>ASIGNADA</option>
                                <option>EN_CAMINO</option>
                                <option>COMPLETADA</option>
                                <option>CANCELADA</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#000', border: '1px solid #222' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ backgroundColor: '#050505', borderBottom: '2px solid #222' }}>
                        <tr>
                            <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>ID</th>
                            <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>CLIENTE / DIRECCIÓN</th>
                            <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>SERVICIO</th>
                            <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>FECHA</th>
                            <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>OPERADOR</th>
                            <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>ESTADO</th>
                            <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>CARGANDO DATOS...</td>
                            </tr>
                        ) : filteredPedidos.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>SIN REGISTROS</td>
                            </tr>
                        ) : (
                            filteredPedidos.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #111', transition: 'all 0.2s' }} className="table-row-hover">
                                    <td style={{ padding: '1.5rem', fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 800 }}>#{p.id}</td>
                                    <td style={{ padding: '1.5rem' }}>
                                        <div style={{ fontWeight: 800, color: 'white', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{p.cliente?.nombre || 'S/D'}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <MapPin size={12} color="var(--primary-color)" /> {p.direccion}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem', fontSize: '0.85rem', color: 'white', fontWeight: 700 }}>{p.tipo_servicio.toUpperCase()}</td>
                                    <td style={{ padding: '1.5rem' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600 }}>
                                            {p.fecha_hora_ejecucion ? new Date(p.fecha_hora_ejecucion).toLocaleDateString('es-AR') : 'PENDIENTE'}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {p.fecha_hora_ejecucion ? new Date(p.fecha_hora_ejecucion).toLocaleTimeString('es-AR') : '--:--'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem' }}>
                                        {p.chofer ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
                                                <Truck size={14} color="var(--primary-color)" /> {p.chofer.usuario.nombre.toUpperCase()}
                                            </div>
                                        ) : (
                                            <span style={{ color: '#333', fontSize: '0.75rem', fontWeight: 800 }}>SIN ASIGNAR</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1.5rem' }}>
                                        <span className={`badge ${p.estado === 'COMPLETADA' ? 'badge-success' :
                                            p.estado === 'CANCELADA' ? 'badge-danger' :
                                                p.estado === 'EN_CAMINO' ? 'badge-primary' : 'badge-warning'
                                            }`}>
                                            {p.estado}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.5rem' }}>
                                        {p.estado !== 'CANCELADA' && (
                                            <button
                                                className="btn"
                                                disabled={p.pagos && p.pagos.length > 0}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    fontSize: '0.75rem',
                                                    background: (p.pagos && p.pagos.length > 0) ? '#333' : '#059669',
                                                    color: (p.pagos && p.pagos.length > 0) ? '#666' : 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: (p.pagos && p.pagos.length > 0) ? 'not-allowed' : 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    fontWeight: 700
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!p.pagos || p.pagos.length === 0) {
                                                        setSelectedPedido(p);
                                                    }
                                                }}
                                            >
                                                <DollarSign size={14} /> {(p.pagos && p.pagos.length > 0) ? 'COBRADO' : 'COBRAR'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4rem', fontWeight: 800, letterSpacing: '0.2em' }}>
                EL SERRANO SERVICIOS • A SU SERVICIO... SIEMPRE
            </p>
            {
                selectedPedido && (
                    <PaymentModal
                        pedidoId={selectedPedido.id}
                        clienteNombre={selectedPedido.cliente?.nombre || 'CLIENTE'}
                        montoSugerido={selectedPedido.costo}
                        onClose={() => setSelectedPedido(null)}
                        onSuccess={() => {
                            fetchPedidos();
                            setSelectedPedido(null);
                        }}
                    />
                )
            }
        </div >
    );
};
