import React, { useState, useEffect } from 'react';
import { ClipboardList, Truck, CheckCircle, Clock, MapPin, AlertCircle, DollarSign } from 'lucide-react';
import api from '../api/axios';
import { PaymentModal } from '../components/PaymentModal';
import { NuevaSolicitud } from './NuevaSolicitud';

interface Chofer {
    id: number;
    usuario: { nombre: string };
}

interface Pedido {
    id: number;
    cliente: { nombre: string; direccion: string };
    tipo_servicio: string;
    direccion: string;
    costo: number;
    estado: string;
    fecha_hora_ejecucion: string;
    chofer_id?: number;
    chofer?: { id: number; usuario: { nombre: string } };
    zona?: { id: number; nombre: string };
    monto_reportado?: number;
    metodo_reportado?: string;
    observaciones_chofer?: string;
}

export const Individuales: React.FC = () => {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [choferes, setChoferes] = useState<Chofer[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [pedRes, choRes] = await Promise.all([
                api.get('/pedidos/'),
                api.get('/chofer/choferes')
            ]);
            console.log('Pedidos recibidos:', pedRes.data);
            console.log('Choferes recibidos:', choRes.data);
            setPedidos(pedRes.data);
            setChoferes(choRes.data);
        } catch (err: any) {
            console.error("Error fetching data", err);
            console.error("Error detail:", err.response?.data);
            setMsg({ type: 'error', text: 'Error al cargar datos: ' + (err.response?.data?.detail || err.message) });
        } finally {
            setLoading(false);
        }
    };

    const handleAssignDriver = async (pedidoId: number, choferId: number | null) => {
        try {
            await api.patch(`/pedidos/${pedidoId}/chofer`, null, {
                params: { chofer_id: choferId || undefined }
            });
            setMsg({ type: 'success', text: 'Operador asignado con éxito' });
            fetchData();
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        } catch (err: any) {
            console.error("Assign error:", err);
            const errorDetail = err.response?.data?.detail;
            const errorMsg = typeof errorDetail === 'string' ? errorDetail : 'Error al asignar operador';
            setMsg({ type: 'error', text: errorMsg });
        }
    };

    const handleUpdateStatus = async (pedidoId: number, newStatus: string) => {
        try {
            await api.patch(`/pedidos/${pedidoId}/estado?estado=${newStatus}`);
            setMsg({ type: 'success', text: `Estado actualizado a ${newStatus}` });
            fetchData();
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        } catch (err: any) {
            console.error("Status update error:", err);
            const errorDetail = err.response?.data?.detail;
            const errorMsg = typeof errorDetail === 'string' ? errorDetail : 'Error al actualizar estado';
            setMsg({ type: 'error', text: errorMsg });
        }
    };

    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    const filteredPedidos = pedidos.filter(p => {
        const isHistory = ['COMPLETADA', 'CANCELADA', 'CARGA_TARDIA'].includes(p.estado);
        return activeTab === 'active' ? !isHistory : isHistory;
    });

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando gestión...</div>;

    return (
        <div style={{ padding: '0 1rem' }}>
            <div className="mobile-stack mobile-padding-sm" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '3rem',
                background: 'rgba(255, 84, 0, 0.05)',
                padding: '1.5rem',
                borderRadius: '4px',
                border: '1px solid #222',
                gap: '1.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <ClipboardList size={40} color="var(--primary-color)" />
                    <div>
                        <h1 className="heading-brand" style={{ fontSize: '2.5rem', margin: 0, color: 'white', lineHeight: 1 }}>GESTIÓN DE SERVICIOS</h1>
                        <p style={{ color: 'var(--primary-color)', fontWeight: 800, letterSpacing: '0.1em', marginTop: '0.25rem' }}>LOGÍSTICA INDIVIDUAL V2.0</p>
                    </div>
                </div>
                <button
                    className={`btn ${showForm ? 'btn-danger' : 'btn-primary'} mobile-full-width`}
                    onClick={() => setShowForm(!showForm)}
                    style={{ height: '3.5rem', padding: '0 2rem', fontWeight: 800 }}
                >
                    {showForm ? 'VOLVER AL LISTADO' : 'NUEVA SOLICITUD'}
                </button>
            </div>

            {showForm ? (
                <NuevaSolicitud onSuccess={() => { setShowForm(false); fetchData(); }} />
            ) : (
                <>
                    {msg.text && (
                        <div className={`badge ${msg.type === 'success' ? 'badge-success' : 'badge-danger'}`} style={{ width: '100%', padding: '1.5rem', marginBottom: '2rem', textAlign: 'center', borderRadius: '4px' }}>
                            {msg.text}
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <button
                            className={`btn ${activeTab === 'active' ? 'btn-primary' : ''}`}
                            style={{ border: activeTab === 'active' ? 'none' : '1px solid #333', background: activeTab === 'active' ? 'var(--primary-color)' : 'transparent', color: 'white' }}
                            onClick={() => setActiveTab('active')}
                        >
                            ACTIVOS
                        </button>
                        <button
                            className={`btn ${activeTab === 'history' ? 'btn-primary' : ''}`}
                            style={{ border: activeTab === 'history' ? 'none' : '1px solid #333', background: activeTab === 'history' ? '#333' : 'transparent', color: 'white' }}
                            onClick={() => setActiveTab('history')}
                        >
                            HISTORIAL
                        </button>
                    </div>

                    <div className="responsive-grid-cards">
                        {filteredPedidos.length === 0 ? (
                            <div className="card card-instagram" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', backgroundColor: '#000' }}>
                                <AlertCircle size={60} color="#222" style={{ marginBottom: '1.5rem' }} />
                                <p className="heading-brand" style={{ color: '#444', fontSize: '1.2rem' }}>No hay solicitudes pendientes</p>
                            </div>
                        ) : (
                            filteredPedidos.map(p => (
                                <div key={p.id} className="card card-instagram" style={{
                                    backgroundColor: activeTab === 'history' ? '#111' : '#0A0A0A',
                                    border: '1px solid #333',
                                    borderLeft: `8px solid ${getStatusColor(p.estado || '')}`,
                                    opacity: activeTab === 'history' ? 0.75 : 1,
                                    filter: activeTab === 'history' ? 'grayscale(100%)' : 'none'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                        <span className="heading-brand" style={{ fontSize: '1.5rem', color: 'var(--primary-color)' }}>#{p.id}</span>
                                        <span className={`badge ${getBadgeClass(p.estado || '')}`}>{p.estado}</span>
                                    </div>

                                    <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                                        <h3 className="heading-brand" style={{ fontSize: '1.6rem', color: 'white', margin: 0, lineHeight: 1 }}>{(p.cliente?.nombre || 'CLIENTE DESCONOCIDO').toUpperCase()}</h3>
                                        <p style={{ color: 'white', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                                            <MapPin size={18} color="var(--primary-color)" /> {p.direccion || p.cliente?.direccion}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #111', paddingTop: '1rem' }}>
                                            <div>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, margin: 0 }}>SERVICIO</p>
                                                <p style={{ margin: 0, color: 'white', fontWeight: 700 }}>{p.tipo_servicio.toUpperCase()}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, margin: 0 }}>COBRO</p>
                                                <p style={{ margin: 0, color: 'white', fontFamily: 'Anton', fontSize: '1.5rem' }}>${p.costo.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #111' }}>
                                            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                                <Clock size={14} /> {p.fecha_hora_ejecucion ? new Date(p.fecha_hora_ejecucion).toLocaleString('es-AR') : 'PENDIENTE'}
                                            </p>
                                            {p.zona && (
                                                <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'right', justifyContent: 'flex-end' }}>
                                                    📍 {p.zona.nombre}
                                                </p>
                                            )}
                                        </div>
                                        {p.estado === 'PAGO_PENDIENTE' && (
                                            <div style={{ backgroundColor: 'rgba(255, 84, 0, 0.1)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--primary-color)', marginTop: '1rem' }}>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 800, margin: '0 0 0.5rem 0' }}>AVISO DE COBRO DEL CHOFER</p>
                                                <p style={{ margin: 0, color: 'white', fontSize: '0.9rem' }}>Monto: <strong>${p.monto_reportado}</strong> | Metodo: <strong>{p.metodo_reportado}</strong></p>
                                                {p.observaciones_chofer && (
                                                    <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>"{p.observaciones_chofer}"</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ borderTop: '1px solid #222', paddingTop: '1.5rem' }}>
                                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                            <label className="form-label" style={{ color: 'var(--text-muted)' }}>ASIGNACIÓN DE OPERADOR</label>
                                            <select
                                                className="form-control"
                                                value={p.chofer_id || ''}
                                                onChange={(e) => handleAssignDriver(p.id, e.target.value ? Number(e.target.value) : null)}
                                            >
                                                <option value="">-- SELECCIONAR CHOFER --</option>
                                                {choferes.map(c => (
                                                    <option key={c.id} value={c.id}>{c.usuario.nombre.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {activeTab === 'active' ? (
                                            <div className="responsive-grid-2" style={{ gap: '1rem' }}>
                                                {(p.estado === 'CREADA' || p.estado === 'ASIGNADA') && (
                                                    <button
                                                        className="btn btn-primary"
                                                        style={{ padding: '0.75rem' }}
                                                        onClick={() => handleUpdateStatus(p.id, 'EN_CAMINO')}
                                                    >
                                                        <Truck size={18} /> INICIAR
                                                    </button>
                                                )}
                                                {p.estado === 'EN_CAMINO' && (
                                                    <button
                                                        className="btn btn-success"
                                                        style={{ padding: '0.75rem', background: '#10b981' }}
                                                        onClick={() => handleUpdateStatus(p.id, 'COMPLETADA')}
                                                    >
                                                        <CheckCircle size={18} /> COMPLETAR
                                                    </button>
                                                )}
                                                {p.estado !== 'COMPLETADA' && p.estado !== 'CANCELADA' && p.estado !== 'CARGA_TARDIA' && (
                                                    <button
                                                        className="btn"
                                                        style={{ padding: '0.75rem', background: '#059669', color: 'white', fontWeight: 800 }}
                                                        onClick={() => setSelectedPedido(p)}
                                                    >
                                                        <DollarSign size={18} /> COBRAR
                                                    </button>
                                                )}
                                                {p.estado !== 'COMPLETADA' && p.estado !== 'CARGA_TARDIA' && (
                                                    <button
                                                        className="btn btn-danger"
                                                        style={{ padding: '0.75rem' }}
                                                        onClick={() => handleUpdateStatus(p.id, 'CANCELADA')}
                                                    >
                                                        ANULAR
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#222', textAlign: 'center', borderRadius: '4px' }}>
                                                <p style={{ margin: 0, fontSize: '0.7rem', color: 'white', fontWeight: 800 }}>HISTÓRICO / ARCHIVADO</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4rem', fontWeight: 800, letterSpacing: '0.1em' }}>
                A SU SERVICIO... SIEMPRE
            </p>

            {
                selectedPedido && (
                    <PaymentModal
                        pedidoId={selectedPedido.id}
                        clienteNombre={selectedPedido.cliente?.nombre || 'CLIENTE'}
                        montoSugerido={selectedPedido.monto_reportado || selectedPedido.costo}
                        metodoSugerido={selectedPedido.metodo_reportado}
                        observaciones={selectedPedido.observaciones_chofer}
                        onClose={() => setSelectedPedido(null)}
                        onSuccess={fetchData}
                    />
                )
            }
        </div >
    );
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'COMPLETADA': return '#10b981';
        case 'CANCELADA': return '#ef4444';
        case 'EN_CAMINO': return '#2563eb';
        case 'ASIGNADA': return '#f59e0b';
        case 'CARGA_TARDIA': return '#d97706';
        default: return '#6366f1';
    }
};

const getBadgeClass = (status: string) => {
    switch (status) {
        case 'COMPLETADA': return 'badge-success';
        case 'CANCELADA': return 'badge-danger';
        case 'EN_CAMINO': return 'badge-primary';
        case 'ASIGNADA': return 'badge-warning';
        case 'CARGA_TARDIA': return 'badge-warning';
        default: return 'badge-info';
    }
};
