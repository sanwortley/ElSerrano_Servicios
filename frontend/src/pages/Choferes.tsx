import React, { useState, useEffect } from 'react';
import { Truck, Plus, Shield, Trash2 } from 'lucide-react';
import api from '../api/axios';

interface Chofer {
    id: number;
    telefono: string;
    patente: string;
    usuario: {
        nombre: string;
        email: string;
    };
    zona_gastos?: string;
}

interface SesionTrabajo {
    id: number;
    chofer_id: number;
    chofer_nombre: string;
    inicio: string;
    fin: string | null;
    total_horas: number | null;
}

export const Choferes: React.FC = () => {
    const [choferes, setChoferes] = useState<Chofer[]>([]);
    const [sesiones, setSesiones] = useState<SesionTrabajo[]>([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '1234', // Default password for drivers
        telefono: '',
        patente: '',
        rol: 'CHOFER',
        zona_gastos: '',
        activo: true
    });

    const fetchChoferes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/chofer/choferes');
            setChoferes(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSesiones = async () => {
        try {
            const res = await api.get('/balances/chofer/sessions');
            setSesiones(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchChoferes();
        fetchSesiones();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/auth/users', formData);
            alert('Chofer creado con éxito');
            setShowForm(false);
            setFormData({
                nombre: '',
                email: '',
                password: '1234',
                telefono: '',
                patente: '',
                rol: 'CHOFER',
                zona_gastos: '',
                activo: true
            });
            fetchChoferes();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Error al crear chofer');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Está seguro de eliminar este chofer? Se eliminará también su usuario de acceso.')) return;
        try {
            await api.delete(`/chofer/${id}`);
            fetchChoferes();
        } catch (err: any) {
            alert(err.response?.data?.detail || 'Error al eliminar chofer');
        }
    };

    return (
        <div style={{ padding: '0 1rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '3rem',
                background: 'rgba(255, 84, 0, 0.05)',
                padding: '2rem',
                borderRadius: '4px',
                border: '1px solid #222'
            }}>
                <div>
                    <h1 className="heading-brand" style={{ fontSize: '3rem', margin: 0, color: 'white', lineHeight: 1 }}>GESTIÓN DE CHOFERES</h1>
                    <p style={{ color: 'var(--primary-color)', fontWeight: 800, letterSpacing: '0.1em', marginTop: '0.25rem' }}>LOGÍSTICA Y EQUIPO</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ height: '3.5rem', padding: '0 2rem' }}>
                    <Plus size={20} style={{ marginRight: '0.5rem' }} /> NUEVO CHOFER
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)', fontWeight: 800 }}>CARGANDO...</div>
            ) : (
                <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
                    {choferes.map(chofer => (
                        <div key={chofer.id} className="card card-instagram" style={{ backgroundColor: '#0A0A0A', border: '1px solid #333' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div style={{
                                    width: '64px', height: '64px',
                                    backgroundColor: '#111',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid var(--primary-color)'
                                }}>
                                    <Truck size={32} color="var(--primary-color)" />
                                </div>
                                <div>
                                    <h3 className="heading-brand" style={{ fontSize: '1.4rem', color: 'white', margin: 0 }}>{chofer.usuario.nombre.toUpperCase()}</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{chofer.usuario.email}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: '#050505', padding: '1.5rem', borderRadius: '4px' }}>
                                <div>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 800, margin: '0 0 0.25rem 0' }}>PATENTE / UNIDAD</p>
                                    <p style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '1.1rem', fontFamily: 'Anton' }}>{chofer.patente.toUpperCase()}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 800, margin: '0 0 0.25rem 0' }}>WHATSAPP</p>
                                    <p style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>{chofer.telefono}</p>
                                </div>
                            </div>

                            {chofer.zona_gastos && (
                                <div style={{ marginTop: '1rem', padding: '0.75rem', border: '1px solid #222', background: '#000', borderRadius: '2px' }}>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, margin: '0 0 0.25rem 0' }}>ZONA DE GASTOS / VIÁTICOS</p>
                                    <p style={{ margin: 0, color: 'white', fontSize: '0.85rem', fontWeight: 700 }}>{chofer.zona_gastos.toUpperCase()}</p>
                                </div>
                            )}

                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#44ff44' }}>
                                    <Shield size={14} />
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>ACCESO APP CHOFER ACTIVO</span>
                                </div>
                                <button
                                    onClick={() => handleDelete(chofer.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        padding: '0.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        fontSize: '0.7rem',
                                        fontWeight: 800
                                    }}
                                >
                                    <Trash2 size={16} /> ELIMINAR
                                </button>
                            </div>
                        </div>
                    ))}
                    {choferes.length === 0 && !loading && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                            <p className="heading-brand" style={{ fontSize: '1.5rem' }}>No hay choferes registrados</p>
                            <p style={{ fontWeight: 800 }}>A SU SERVICIO... SIEMPRE</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            {showForm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(4px)'
                }}>
                    <div className="card card-instagram" style={{ width: '100%', maxWidth: '600px', backgroundColor: '#000', border: '1px solid #333', padding: '3rem' }}>
                        <h3 className="heading-brand" style={{ fontSize: '2rem', marginBottom: '2.5rem', color: 'white', textAlign: 'center' }}>REGISTRAR NUEVO CHOFER</h3>
                        <form onSubmit={handleCreate}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="form-label">NOMBRE COMPLETO</label>
                                    <input
                                        className="form-control" required
                                        value={formData.nombre}
                                        onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                        placeholder="EJ: CARLOS PEREZ"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">EMAIL (ACCESO)</label>
                                    <input
                                        type="email" className="form-control" required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="carlos@elserrano.com"
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div className="form-group">
                                    <label className="form-label">TELÉFONO / WHATSAPP</label>
                                    <input
                                        className="form-control" required
                                        value={formData.telefono}
                                        onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                        placeholder="11 2233-4455"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">PATENTE DEL CAMIÓN</label>
                                    <input
                                        className="form-control" required
                                        value={formData.patente}
                                        onChange={e => setFormData({ ...formData, patente: e.target.value })}
                                        placeholder="ABC 123"
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label className="form-label">ZONA DE GASTOS / VIÁTICOS (OPCIONAL)</label>
                                <input
                                    className="form-control"
                                    value={formData.zona_gastos}
                                    onChange={e => setFormData({ ...formData, zona_gastos: e.target.value })}
                                    placeholder="EJ: ZONA SUR - VIÁTICOS NIVEL 1"
                                />
                            </div>
                            <div style={{ backgroundColor: 'rgba(255,84,0,0.1)', padding: '1rem', borderRadius: '4px', marginBottom: '2rem', border: '1px solid rgba(255,84,0,0.2)' }}>
                                <p style={{ color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 800, margin: 0 }}>NOTA: La contraseña por defecto será "1234". El chofer podrá cambiarla desde su panel.</p>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <button type="button" className="btn" style={{ background: '#111', color: 'white', border: '1px solid #222' }} onClick={() => setShowForm(false)}>CANCELAR</button>
                                <button type="submit" className="btn btn-primary">REGISTRAR CHOFER</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Work History Section */}
            <div style={{ marginTop: '5rem', marginBottom: '3rem' }}>
                <div style={{
                    background: '#050505',
                    padding: '2rem',
                    border: '1px solid #222',
                    borderRadius: '4px'
                }}>
                    <h2 className="heading-brand" style={{ fontSize: '2rem', color: 'white', marginBottom: '1.5rem' }}>HISTORIAL DE JORNADAS</h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #222' }}>
                                    <th style={{ padding: '1rem', color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 800 }}>CHOFER</th>
                                    <th style={{ padding: '1rem', color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 800 }}>INICIO</th>
                                    <th style={{ padding: '1rem', color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 800 }}>FIN</th>
                                    <th style={{ padding: '1rem', color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 800 }}>TOTAL HORAS</th>
                                    <th style={{ padding: '1rem', color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 800 }}>ESTADO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sesiones.map(s => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #111', background: s.fin ? 'transparent' : 'rgba(255, 84, 0, 0.05)' }}>
                                        <td style={{ padding: '1rem', color: 'white', fontWeight: 700 }}>{s.chofer_nombre.toUpperCase()}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(s.inicio).toLocaleString()}</td>
                                        <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{s.fin ? new Date(s.fin).toLocaleString() : '-'}</td>
                                        <td style={{ padding: '1rem', color: 'white', fontWeight: 800, fontFamily: 'Anton' }}>{s.total_horas ? s.total_horas.toFixed(2) + ' HS' : '-'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                fontSize: '0.6rem',
                                                fontWeight: 800,
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '2px',
                                                background: s.fin ? '#222' : 'var(--primary-color)',
                                                color: 'white'
                                            }}>
                                                {s.fin ? 'FINALIZADO' : 'EN TURNO'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {sesiones.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay jornadas registradas aún.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
