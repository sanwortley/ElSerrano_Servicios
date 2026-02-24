import React, { useState, useEffect } from 'react';
import { MapPin, Truck, CheckCircle, Navigation, Phone, RefreshCcw } from 'lucide-react';
import api from '../api/axios';

interface DriverData {
    fecha: string;
    zona_de_hoy: { nombre: string } | null;
    pedidos: any[];
    frecuentes: any[];
}

export const ChoferPanel: React.FC = () => {
    const [data, setData] = useState<DriverData | null>(null);
    const [loading, setLoading] = useState(true);
    const [reportingService, setReportingService] = useState<any | null>(null);

    useEffect(() => {
        fetchHoy();
    }, []);

    const fetchHoy = async () => {
        try {
            const res = await api.get('/chofer/hoy');
            setData(res.data);
        } catch (err) {
            console.error("Error fetching hoy", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando hoja de ruta...</div>;

    const allServices = [
        ...(data?.pedidos || []).map((p: any) => ({ ...p, _tipo: 'Individual' })),
        ...(data?.frecuentes || []).map((f: any) => ({ ...f, _tipo: 'Recurrente' }))
    ];

    return (
        <div style={{ padding: '0 1rem', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{
                backgroundColor: 'black',
                color: 'white',
                padding: '2rem',
                marginBottom: '3rem',
                borderRadius: '4px',
                border: '1px solid #333',
                borderLeft: '8px solid var(--primary-color)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 className="heading-brand" style={{ fontSize: '3rem', margin: 0, lineHeight: 0.9 }}>HOJA DE RUTA</h1>
                        <p style={{ color: 'var(--primary-color)', fontWeight: 800, letterSpacing: '0.2em', marginTop: '0.5rem', textTransform: 'uppercase' }}>
                            {data?.fecha || 'Cargando...'}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Zona Operativa</p>
                        <p className="heading-brand" style={{ fontSize: '1.5rem', color: 'white', margin: 0 }}>{(data?.zona_de_hoy?.nombre || 'GENERAL').toUpperCase()}</p>
                        <button
                            onClick={fetchHoy}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: 'rgba(255, 84, 0, 0.1)',
                                border: '1px solid var(--primary-color)',
                                color: 'white',
                                fontSize: '0.7rem',
                                padding: '0.4rem 0.8rem',
                                marginTop: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 800,
                                borderRadius: '2px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'var(--primary-color)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 84, 0, 0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <RefreshCcw size={14} /> ACTUALIZAR
                        </button>
                    </div>
                </div>
                <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)' }}>
                    A SU SERVICIO... SIEMPRE
                </p>
            </div>

            <ShiftControl onUpdate={fetchHoy} />

            <ExpenseRecorder onUpdate={fetchHoy} />

            <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem' }}>
                <div className="card card-instagram" style={{ flex: 1, textAlign: 'center', backgroundColor: '#050505', border: '1px solid #222' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>PENDIENTES</p>
                    <p style={{ fontSize: '2.5rem', fontFamily: 'Anton', color: 'var(--primary-color)', margin: 0 }}>
                        {allServices.filter(s => s.estado !== 'COMPLETADA').length}
                    </p>
                </div>
                <div className="card card-instagram" style={{ flex: 1, textAlign: 'center', backgroundColor: '#050505', border: '1px solid #222' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800 }}>COMPLETADOS</p>
                    <p style={{ fontSize: '2.5rem', fontFamily: 'Anton', color: 'white', margin: 0 }}>
                        {allServices.filter(s => s.estado === 'COMPLETADA').length}
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '2rem' }}>
                {allServices.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '5rem', backgroundColor: '#050505', border: '2px dashed #222' }}>
                        <Truck size={60} color="#222" style={{ marginBottom: '1.5rem' }} />
                        <p className="heading-brand" style={{ color: '#444', fontSize: '1.2rem' }}>No hay servicios asignados</p>
                    </div>
                ) : (
                    allServices.map((service, idx) => (
                        <OrderCard key={`${service._tipo}-${service.id}`} service={service} onUpdate={fetchHoy} index={idx + 1} onReport={setReportingService} />
                    ))
                )}
            </div>

            {reportingService && (
                <ReportPaymentModal
                    service={reportingService}
                    onClose={() => setReportingService(null)}
                    onSuccess={() => {
                        setReportingService(null);
                        fetchHoy();
                    }}
                />
            )}
        </div>
    );
};

const ShiftControl: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
    const [status, setStatus] = useState<{ active: boolean; inicio?: string } | null>(null);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/chofer/shift/status');
            setStatus(res.data);
        } catch (err) {
            console.error("Error fetching shift status", err);
        }
    };

    const handleStart = async () => {
        try {
            await api.post('/chofer/shift/start');
            fetchStatus();
            onUpdate();
        } catch (err) {
            alert("Error al iniciar turno");
        }
    };

    const handleStop = async () => {
        if (!confirm("¿Desea finalizar su turno de hoy?")) return;
        try {
            await api.post('/chofer/shift/stop');
            fetchStatus();
            onUpdate();
        } catch (err) {
            alert("Error al finalizar turno");
        }
    };

    return (
        <div className="card" style={{
            backgroundColor: '#050505',
            border: '1px solid #222',
            padding: '1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Estado de Turno</p>
                <h3 style={{ fontSize: '1.5rem', color: 'white', fontFamily: 'Anton', margin: 0 }}>
                    {status?.active ? 'TRABAJANDO' : 'FUERA DE TURNO'}
                </h3>
                {status?.active && status.inicio && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--primary-color)', marginTop: '0.25rem' }}>
                        Iniciado: {new Date(status.inicio).toLocaleTimeString()}
                    </p>
                )}
            </div>
            <div>
                {!status?.active ? (
                    <button className="btn btn-primary" onClick={handleStart} style={{ padding: '0.75rem 2rem', fontWeight: 800, color: 'white' }}>
                        INICIAR TURNO
                    </button>
                ) : (
                    <button className="btn" onClick={handleStop} style={{ padding: '0.75rem 2rem', backgroundColor: '#ef4444', color: 'white', fontWeight: 800, border: 'none' }}>
                        FINALIZAR TURNO
                    </button>
                )}
            </div>
        </div>
    );
};

const ExpenseRecorder: React.FC<{ onUpdate: () => void }> = ({ onUpdate }) => {
    const [show, setShow] = useState(false);
    const [formData, setFormData] = useState({ monto: 0, categoria: 'Combustible', descripcion: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.monto <= 0) {
            alert("El monto debe ser mayor a 0");
            return;
        }
        try {
            await api.post('/chofer/gastos', formData);
            alert("Gasto registrado con éxito");
            setShow(false);
            setFormData({ monto: 0, categoria: 'Combustible', descripcion: '' });
            onUpdate();
        } catch (err: any) {
            console.error("Error al registrar gasto", err);
            alert(err.response?.data?.detail || "Error al registrar gasto");
        }
    };

    return (
        <div style={{ marginBottom: '2rem' }}>
            {!show ? (
                <button
                    onClick={() => setShow(true)}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: '#111',
                        border: '1px solid #333',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        letterSpacing: '0.1em'
                    }}
                >
                    ➕ REGISTRAR GASTO (COMBUSTIBLE, VIÁTICOS, OTROS)
                </button>
            ) : (
                <div className="card" style={{ backgroundColor: '#0A0A0A', border: '1px solid var(--primary-color)' }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">MONTO ($)</label>
                                <input
                                    type="number" className="form-control" required
                                    value={formData.monto}
                                    onChange={e => setFormData({ ...formData, monto: Number(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">CATEGORÍA</label>
                                <select
                                    className="form-control"
                                    value={formData.categoria}
                                    onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                                >
                                    <option value="Combustible">COMBUSTIBLE</option>
                                    <option value="Viáticos">VIÁTICOS</option>
                                    <option value="Reparación">REPARACIÓN</option>
                                    <option value="Otros">OTROS</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">DESCRIPCIÓN</label>
                            <input
                                className="form-control"
                                value={formData.descripcion}
                                onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                placeholder="Especifique el gasto..."
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>GUARDAR GASTO</button>
                            <button type="button" className="btn" style={{ background: '#222', color: 'white' }} onClick={() => setShow(false)}>CANCELAR</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

const OrderCard: React.FC<{ service: any; onUpdate: () => void; index: number; onReport: (s: any) => void }> = ({ service, onUpdate, index, onReport }) => {
    const isCompleted = service.estado === 'COMPLETADA' || service.estado === 'FINALIZADO';
    const isPendingPayment = service.estado === 'PAGO_PENDIENTE';

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            const endpoint = service._tipo === 'Individual'
                ? `/pedidos/${service.id}/estado`
                : `/frecuentes/${service.id}/estado`;
            await api.patch(endpoint, null, { params: { estado: newStatus } });
            onUpdate();
        } catch (err) {
            alert("Error al actualizar estado");
        }
    };

    return (
        <div className="card card-instagram" style={{
            opacity: (isCompleted || isPendingPayment) ? 0.6 : 1,
            backgroundColor: (isCompleted || isPendingPayment) ? '#050505' : '#0A0A0A',
            border: (isCompleted || isPendingPayment) ? '1px solid #111' : '1px solid #333',
            transition: 'all 0.3s'
        }}>
            <div className="chevron-decoration" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{
                        width: '45px', height: '45px', backgroundColor: isCompleted ? '#222' : 'var(--primary-color)', color: 'white',
                        borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 400,
                        fontFamily: 'Anton', fontSize: '1.5rem', boxShadow: '4px 4px 0px rgba(0,0,0,0.5)'
                    }}>
                        {index}
                    </div>
                    <div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-color)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{service._tipo}</span>
                        <h3 className="heading-brand" style={{ fontSize: '1.8rem', color: 'white', margin: 0, lineHeight: 1 }}>{(service.cliente?.nombre || 'CLIENTE').toUpperCase()}</h3>
                    </div>
                </div>
                <div className={`badge ${isCompleted ? 'badge-success' : isPendingPayment ? 'badge-warning' : 'badge-warning'}`}>{service.estado}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                <div>
                    <p style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white', fontSize: '1.1rem', fontWeight: 600 }}>
                        <MapPin size={24} color="var(--primary-color)" /> {service.direccion}
                    </p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                        <Phone size={18} /> {service.cliente.telefono || service.telefono}
                    </p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.25rem' }}>COBRO</p>
                    <p style={{ fontSize: '2rem', color: 'white', fontFamily: 'Anton', margin: 0 }}>
                        ${(service.costo || service.costo_individual || 0).toLocaleString()}
                    </p>
                </div>
            </div>

            {isPendingPayment && (
                <div style={{ backgroundColor: '#111', padding: '1rem', borderRadius: '4px', marginBottom: '1rem', border: '1px dashed #333' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 800 }}>PAGO REPORTADO - ESPERANDO APROBACIÓN</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Monto: ${service.monto_reportado} ({service.metodo_reportado})</p>
                </div>
            )}

            {!(isCompleted || isPendingPayment) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid #222', paddingTop: '1.5rem' }}>
                    {service.estado !== 'EN_CAMINO' ? (
                        <button
                            className="btn btn-primary"
                            style={{ padding: '1rem' }}
                            onClick={() => handleUpdateStatus('EN_CAMINO')}
                        >
                            <Navigation size={20} /> INICIAR VIAJE
                        </button>
                    ) : (
                        <button
                            className="btn btn-success"
                            style={{ padding: '1rem', background: '#10b981' }}
                            onClick={() => onReport(service)}
                        >
                            <CheckCircle size={20} /> FINALIZADO / COBRAR
                        </button>
                    )}
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(service.direccion)}`}
                        target="_blank"
                        className="btn"
                        style={{ background: '#111', border: '1px solid #333', color: 'white', padding: '1rem' }}
                    >
                        🗾 VER MAPA
                    </a>
                </div>
            )}
        </div>
    );
};

const ReportPaymentModal: React.FC<{ service: any; onClose: () => void; onSuccess: () => void }> = ({ service, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        monto: service.costo || service.costo_individual || 0,
        metodo: 'EFECTIVO',
        observaciones: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            await api.post('/chofer/report-payment', {
                id: service.id,
                tipo: service._tipo,
                monto: Number(formData.monto),
                metodo: formData.metodo,
                observaciones: formData.observaciones
            });
            alert("Pago reportado con éxito. Pendiente de aprobación.");
            onSuccess();
        } catch (err) {
            console.error(err);
            alert("Error al reportar pago");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
            <div className="card card-instagram" style={{ background: '#000', border: '2px solid #333', padding: '2rem', width: '100%', maxWidth: '500px' }}>
                <h2 className="heading-brand" style={{ fontSize: '1.5rem', color: 'white', marginBottom: '1.5rem' }}>REPORTAR FINALIZACIÓN</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">MONTO COBRADO ($)</label>
                        <input type="number" className="form-control" value={formData.monto} onChange={e => setFormData({ ...formData, monto: Number(e.target.value) })} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">MÉTODO DE PAGO</label>
                        <select className="form-control" value={formData.metodo} onChange={e => setFormData({ ...formData, metodo: e.target.value })}>
                            <option value="EFECTIVO">EFECTIVO</option>
                            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                            <option value="TARJETA">TARJETA</option>
                            <option value="MERCADO_PAGO">MERCADO PAGO</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label className="form-label">OBSERVACIONES / COMENTARIOS</label>
                        <textarea
                            className="form-control"
                            style={{ height: '80px', paddingTop: '0.5rem' }}
                            value={formData.observaciones}
                            onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                            placeholder="Ej: Cliente pagó propina, o algún detalle del servicio..."
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>CANCELAR</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'PROCESANDO...' : 'REPORTAR PAGO'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
