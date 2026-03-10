import React, { useState, useEffect } from 'react';
import { Star, MapPin, Navigation } from 'lucide-react';
import api from '../api/axios';
import { PaymentModal } from '../components/PaymentModal';
import { MapPicker } from '../components/MapPicker';

interface ServicioFrecuente {
    id: number;
    tipo_servicio: string;
    cantidad: number;
    fecha_inicio: string;
    fecha_fin: string;
    dias_semana: string[];
    dia_saliente?: string;
    estado: 'ACTIVO' | 'PAUSADO' | 'PAGO_PENDIENTE' | 'COMPLETADA' | 'FINALIZADO';
    total: number;
    monto_reportado?: number;
    metodo_reportado?: string;
    observaciones_chofer?: string;
    chofer_id?: number;
    cliente: {
        id: number;
        nombre: string;
        telefono: string;
        direccion: string;
    };
}

interface AddressSuggestion {
    display_name: string;
    lat: number;
    lng: number;
    city?: string;
}

const TIPOS_SERVICIO = [
    "Desagotes y destapes de cañerías",
    "Movimiento de suelo",
    "Venta de áridos, piedras y rellenos",
    "Volquetes y contenedores para obra",
    "Alquiler de obradores",
    "Alquiler de baños químicos",
    "Otros"
];

export const Frecuentes: React.FC = () => {
    const [services, setServices] = useState<ServicioFrecuente[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedService, setSelectedService] = useState<any | null>(null);

    // Data for Form
    const [formData, setFormData] = useState({
        nombre_cliente: '',
        telefono: '',
        direccion: '',
        tipo_servicio: TIPOS_SERVICIO[5], // Default: Baños
        cantidad: 1,
        costo_individual: 0,
        fecha_inicio: '',
        fecha_fin: '',
        dia_saliente: '',
        lat: null as number | null,
        lng: null as number | null
    });

    const [allChoferes, setAllChoferes] = useState<any[]>([]);
    const [allClientes, setAllClientes] = useState<any[]>([]);
    const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
    const [detectedZone, setDetectedZone] = useState<any>(null);
    const [zoneMsg, setZoneMsg] = useState('');

    // Suggestions
    const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);

    const fetchServices = async () => {
        try {
            setLoading(true);
            const [servRes, , choferesRes, clientesRes] = await Promise.all([
                api.get('/frecuentes/'),
                api.get('/zonas/'),
                api.get('/chofer/choferes'),
                api.get('/clientes/')
            ]);
            setServices(servRes.data);
            setAllChoferes(choferesRes.data);
            setAllClientes(clientesRes.data);
        } catch (err) {
            console.error("Error loading data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleSearchAddress = async (q: string) => {
        if (q.length < 4 || selectedClienteId) {
            setAddressSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        try {
            const res = await api.get('/zonas/suggest-address', { params: { q } });
            setAddressSuggestions(res.data);
            setShowSuggestions(res.data.length > 0);
        } catch (err) {
            console.error(err);
        }
    };

    const selectSuggestion = (s: AddressSuggestion) => {
        setFormData(prev => ({
            ...prev,
            direccion: s.display_name,
            lat: s.lat,
            lng: s.lng
        }));
        setShowSuggestions(false);
        detectZoneForLocation(s.display_name, s.lat, s.lng);
    };

    const detectZoneForLocation = async (address: string, lat?: number | null, lng?: number | null) => {
        try {
            const params: any = {};
            if (lat && lng) {
                params.lat = lat;
                params.lng = lng;
            } else {
                params.direccion = address;
            }
            const res = await api.get('/zonas/detect', { params });
            if (res.data.zona) {
                setDetectedZone(res.data.zona);
                setZoneMsg('');
            } else {
                setDetectedZone(null);
                setZoneMsg(res.data.msg);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleMapSelect = async (lat: number, lng: number) => {
        setShowMapPicker(false);
        try {
            // Reverse geocode to get address
            const res = await api.get('/zonas/reverse', { params: { lat, lng } });
            const address = res.data.display_name;

            setFormData(prev => ({
                ...prev,
                direccion: address,
                lat,
                lng
            }));

            // Detect zone
            detectZoneForLocation(address, lat, lng);
        } catch (err) {
            console.error("Error reverse geocoding", err);
            // Fallback even if reverse fails
            setFormData(prev => ({ ...prev, lat, lng }));
            detectZoneForLocation('', lat, lng);
        }
    };

    const handleToggleActive = async (id: number) => {
        try {
            await api.patch(`/frecuentes/${id}/toggle`);
            fetchServices();
        } catch (err) {
            console.error("Error toggling service", err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este abono?")) return;
        try {
            await api.delete(`/frecuentes/${id}`);
            fetchServices();
        } catch (err) {
            console.error("Error deleting service", err);
        }
    };

    const handleAssignDriver = async (serviceId: number, choferId: number | null) => {
        try {
            await api.patch(`/frecuentes/${serviceId}/chofer`, null, {
                params: { chofer_id: choferId || undefined }
            });
            fetchServices();
        } catch (err) {
            console.error("Error assigning driver", err);
        }
    };

    const detectZoneForAddress = async (address: string) => {
        return detectZoneForLocation(address);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'direccion') {
            handleSearchAddress(value);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!detectedZone) {
            alert("No se ha detectado una zona válida para esta dirección. Por favor, selecciona una dirección sugerida o verifica la zona.");
            return;
        }

        if (loading) return;
        try {
            setLoading(true);
            let clienteId = selectedClienteId;

            if (!clienteId) {
                const existing = allClientes.find(c =>
                    c.nombre.toLowerCase().trim() === formData.nombre_cliente.toLowerCase().trim() &&
                    c.direccion.toLowerCase().trim() === formData.direccion.toLowerCase().trim()
                );

                if (existing) {
                    clienteId = existing.id;
                } else {
                    const clientRes = await api.post('/clientes/', {
                        nombre: formData.nombre_cliente,
                        direccion: formData.direccion,
                        telefono: formData.telefono
                    });
                    clienteId = clientRes.data.id;
                }
            }

            await api.post('/frecuentes/', {
                cliente_id: clienteId,
                direccion: formData.direccion,
                telefono: formData.telefono,
                tipo_servicio: formData.tipo_servicio,
                cantidad: Number(formData.cantidad),
                costo_individual: Number(formData.costo_individual),
                fecha_inicio: new Date(formData.fecha_inicio).toISOString(),
                fecha_fin: formData.fecha_fin ? new Date(formData.fecha_fin).toISOString() : null,
                dias_semana: detectedZone?.dias_operativos || [],
                dia_saliente: formData.dia_saliente,
                lat: formData.lat,
                lng: formData.lng,
                zona_id: detectedZone?.id
            });

            alert("Abono creado con éxito!");
            setShowForm(false);
            fetchServices();
        } catch (err: any) {
            console.error("Error creating frequent service:", err);
            const msg = err.response?.data?.detail || "Error al crear el abono.";
            alert(`Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    const filteredServices = services.filter(service => {
        const isHistory = ['FINALIZADO', 'COMPLETADA'].includes(service.estado);
        return activeTab === 'active' ? !isHistory : isHistory;
    });

    return (
        <div style={{ padding: '0 1rem', paddingBottom: '5rem' }}>
            <div className="mobile-stack mobile-padding-sm" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '3rem',
                background: 'rgba(255, 84, 0, 0.05)',
                padding: '2rem',
                borderRadius: '4px',
                border: '1px solid #222',
                gap: '1.5rem'
            }}>
                <div>
                    <h1 className="heading-brand" style={{ fontSize: '3rem', margin: 0, color: 'white', lineHeight: 1 }}>SERVICIOS FRECUENTES</h1>
                    <p style={{ color: 'var(--primary-color)', fontWeight: 800, letterSpacing: '0.1em', marginTop: '0.25rem' }}>RECURRENCIA Y ABONOS V2.0</p>
                </div>
                <button className={`btn ${showForm ? 'btn-danger' : 'btn-primary'} mobile-full-width`} onClick={() => setShowForm(!showForm)} style={{ height: '3.5rem', padding: '0 2rem' }}>
                    {showForm ? 'VOLVER AL LISTADO' : 'NUEVO ABONO'}
                </button>
            </div>

            {loading && <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>CARGANDO...</div>}

            {!showForm && (
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
            )}

            {!showForm ? (
                <div className="responsive-grid-cards">
                    {filteredServices.map((service) => (
                        <div key={service.id} className="card card-instagram" style={{ backgroundColor: '#0A0A0A', border: '1px solid #333', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
                                <span className={`badge ${service.estado === 'ACTIVO' ? 'badge-primary' : 'badge-warning'}`}>
                                    {service.estado}
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
                                <Star size={28} fill="var(--primary-color)" />
                                <h3 className="heading-brand" style={{ fontSize: '1.4rem', color: 'white', margin: 0 }}>{(service.tipo_servicio || "S/D").toUpperCase()}</h3>
                            </div>

                            <div style={{ display: 'grid', gap: '1.25rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, margin: 0 }}>CLIENTE</p>
                                    <p style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>{(service.cliente?.nombre || "S/D").toUpperCase()}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, margin: 0 }}>UBI / CONTACTO</p>
                                    <p style={{ margin: 0, color: 'white', fontSize: '0.9rem' }}>{service.cliente?.direccion}</p>
                                    <p style={{ margin: 0, color: 'var(--primary-color)', fontSize: '0.9rem', fontWeight: 600 }}>{service.cliente?.telefono}</p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid #111', paddingTop: '1rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, margin: 0 }}>VIGENCIA</p>
                                        <p style={{ margin: 0, color: 'white', fontSize: '0.8rem' }}>
                                            {new Date(service.fecha_inicio).toLocaleDateString()} AL {new Date(service.fecha_fin).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, margin: 0 }}>CANTIDAD</p>
                                        <p style={{ margin: 0, color: 'white', fontFamily: 'Anton', fontSize: '1.2rem' }}>{service.cantidad}u.</p>
                                    </div>
                                </div>
                                <div style={{ backgroundColor: '#050505', padding: '0.75rem', borderRadius: '2px', border: '1px solid #222' }}>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--primary-color)', fontWeight: 800, margin: '0 0 0.5rem 0' }}>DÍAS DE SERVICIO</p>
                                    <p style={{ margin: 0, color: 'white', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                                        {service.dias_semana ? service.dias_semana.join(' • ').toUpperCase() : 'NO DEFINIDO'}
                                    </p>
                                    {service.dia_saliente && (
                                        <p style={{ margin: '0.5rem 0 0 0', color: '#10b981', fontSize: '0.75rem', fontWeight: 800 }}>
                                            DÍA SALIENTE: {service.dia_saliente.toUpperCase()}
                                        </p>
                                    )}
                                </div>

                                <div style={{ borderTop: '1px solid #111', paddingTop: '1rem' }}>
                                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, margin: '0 0 0.5rem 0' }}>CHOFER ASIGNADO</p>
                                    <select
                                        className="form-control"
                                        style={{ fontSize: '0.8rem', padding: '0.4rem', height: 'auto' }}
                                        value={service.chofer_id || ''}
                                        onChange={(e) => handleAssignDriver(service.id, e.target.value ? Number(e.target.value) : null)}
                                    >
                                        <option value="">SIN ASIGNAR</option>
                                        {allChoferes.map(c => (
                                            <option key={c.id} value={c.id}>{c.usuario.nombre.toUpperCase()}</option>
                                        ))}
                                    </select>
                                </div>

                                {activeTab === 'active' ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button
                                            className={`btn ${service.estado === 'ACTIVO' ? 'btn-warning' : 'btn-success'}`}
                                            style={{ fontSize: '0.6rem', padding: '0.5rem', fontWeight: 800 }}
                                            onClick={() => handleToggleActive(service.id)}
                                        >
                                            {service.estado === 'ACTIVO' ? 'PAUSAR' : 'ACTIVAR'}
                                        </button>
                                        <button
                                            className="btn btn-primary"
                                            style={{ fontSize: '0.6rem', padding: '0.5rem', fontWeight: 800 }}
                                            onClick={() => setSelectedService(service)}
                                        >
                                            COBRAR
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            style={{ fontSize: '0.6rem', padding: '0.5rem', fontWeight: 800 }}
                                            onClick={() => handleDelete(service.id)}
                                        >
                                            ELIMINAR
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '1rem', padding: '0.5rem', background: '#222', textAlign: 'center', borderRadius: '4px' }}>
                                        <p style={{ margin: 0, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            📍 {service.cliente.direccion}
                                        </p>
                                    </div>
                                )}

                                {service.estado === 'PAGO_PENDIENTE' && (
                                    <div style={{ backgroundColor: 'rgba(255, 84, 0, 0.1)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--primary-color)', marginTop: '1.5rem' }}>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 800, margin: '0 0 0.5rem 0' }}>AVISO DE COBRO DEL CHOFER</p>
                                        <p style={{ margin: 0, color: 'white', fontSize: '0.9rem' }}>Monto: <strong>${service.monto_reportado}</strong> | Metodo: <strong>{service.metodo_reportado}</strong></p>
                                        {service.observaciones_chofer && (
                                            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>"{service.observaciones_chofer}"</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {!loading && filteredServices.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                            <p className="heading-brand" style={{ fontSize: '1.5rem' }}>No hay servicios {activeTab === 'active' ? 'activos' : 'en el historial'}</p>
                            <p style={{ fontWeight: 800 }}>A SU SERVICIO... SIEMPRE</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="card card-instagram" style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#000', border: '1px solid #333', padding: '3rem' }}>
                    <form onSubmit={handleSubmit}>
                        <h3 className="heading-brand" style={{ fontSize: '1.5rem', color: 'white', marginBottom: '2rem', borderBottom: '2px solid var(--primary-color)', display: 'inline-block' }}>DATOS DEL CLIENTE</h3>

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label className="form-label" style={{ color: 'var(--primary-color)', fontWeight: 800, fontSize: '0.7rem' }}>SELECCIONAR CLIENTE EXISTENTE (OPCIONAL)</label>
                            <select
                                className="form-control"
                                style={{ border: '1px solid var(--primary-color)' }}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) {
                                        const c = allClientes.find(cli => cli.id === Number(val));
                                        if (c) {
                                            setSelectedClienteId(c.id);
                                            setFormData(prev => ({
                                                ...prev,
                                                nombre_cliente: c.nombre,
                                                telefono: c.telefono,
                                                direccion: c.direccion
                                            }));
                                            detectZoneForAddress(c.direccion);
                                        }
                                    } else {
                                        setSelectedClienteId(null);
                                        setFormData(prev => ({ ...prev, nombre_cliente: '', telefono: '', direccion: '' }));
                                    }
                                }}
                                value={selectedClienteId || ''}
                            >
                                <option value="">-- NUEVO CLIENTE --</option>
                                {allClientes.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre.toUpperCase()} - {c.direccion}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label" style={{ color: 'var(--text-muted)' }}>NOMBRE COMPLETO</label>
                            <input
                                name="nombre_cliente"
                                required
                                onChange={handleInputChange}
                                className="form-control"
                                placeholder="JUAN PÉREZ"
                                value={formData.nombre_cliente}
                                disabled={!!selectedClienteId}
                            />
                        </div>
                        <div className="responsive-grid-2" style={{ marginBottom: '1.5rem' }}>
                            <div className="form-group" style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label className="form-label" style={{ color: 'var(--text-muted)', margin: 0 }}>UBICACIÓN PRINCIPAL</label>
                                    <button
                                        type="button"
                                        className="btn"
                                        style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: '#222', border: '1px solid #444', color: 'var(--primary-color)' }}
                                        onClick={() => setShowMapPicker(true)}
                                    >
                                        <MapPin size={12} /> SELECCIONAR EN MAPA
                                    </button>
                                </div>
                                <input
                                    name="direccion"
                                    required
                                    onChange={handleInputChange}
                                    onBlur={() => {
                                        if (formData.direccion.length > 5 && !selectedClienteId) {
                                            detectZoneForAddress(formData.direccion);
                                        }
                                    }}
                                    className="form-control"
                                    placeholder="CALLE Y NÚMERO..."
                                    value={formData.direccion}
                                    disabled={!!selectedClienteId}
                                />
                                {showSuggestions && !selectedClienteId && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 1000,
                                        background: '#111', border: '1px solid #444', borderRadius: '4px', overflowY: 'auto',
                                        maxHeight: '350px', boxShadow: '0 8px 30px rgba(0,0,0,0.8)', WebkitOverflowScrolling: 'touch'
                                    }}>
                                        {addressSuggestions.map((s, i) => (
                                            <div
                                                key={i}
                                                onClick={() => selectSuggestion(s)}
                                                style={{ padding: '1rem', borderBottom: '1px solid #222', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                                                onMouseOver={e => e.currentTarget.style.background = '#222'}
                                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <Navigation size={18} color="var(--primary-color)" />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: 800 }}>
                                                        {s.display_name.split(',').length > 1 ? s.display_name.split(',').slice(0, 2).join(',') : s.display_name}
                                                    </div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                        {s.display_name.split(',').slice(2).join(',').trim().slice(0, 80)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {zoneMsg && <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.5rem', fontWeight: 800 }}>⚠️ {zoneMsg.toUpperCase()}</p>}
                                {detectedZone && (
                                    <p style={{ color: '#10b981', fontSize: '0.7rem', marginTop: '0.5rem', fontWeight: 800 }}>
                                        📍 ZONA ASIGNADA: {detectedZone.nombre.toUpperCase()}
                                    </p>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--text-muted)' }}>TELÉFONO DE CONTACTO</label>
                                <input
                                    name="telefono"
                                    required
                                    onChange={handleInputChange}
                                    className="form-control"
                                    placeholder="11..."
                                    value={formData.telefono}
                                    disabled={!!selectedClienteId}
                                />
                            </div>
                        </div>

                        <h3 className="heading-brand" style={{ fontSize: '1.5rem', color: 'white', marginBottom: '2rem', marginTop: '3rem', borderBottom: '2px solid var(--primary-color)', display: 'inline-block' }}>DETALLES DEL SERVICIO</h3>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label" style={{ color: 'var(--text-muted)' }}>TIPO DE ABONO</label>
                            <select name="tipo_servicio" className="form-control" onChange={handleInputChange} value={formData.tipo_servicio}>
                                {TIPOS_SERVICIO.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div className="responsive-grid-2" style={{ marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--text-muted)' }}>CANTIDAD</label>
                                <input type="number" name="cantidad" min="1" required onChange={handleInputChange} className="form-control" value={formData.cantidad} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--text-muted)' }}>COSTO UNITARIO ($)</label>
                                <input type="number" name="costo_individual" min="0" required onChange={handleInputChange} className="form-control" value={formData.costo_individual} />
                            </div>
                        </div>
                        <div className="responsive-grid-2" style={{ marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--text-muted)' }}>FECHA INICIO</label>
                                <input type="date" name="fecha_inicio" required onChange={handleInputChange} className="form-control" value={formData.fecha_inicio} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--text-muted)' }}>FECHA FINALIZACIÓN</label>
                                <input type="date" name="fecha_fin" required onChange={handleInputChange} className="form-control" value={formData.fecha_fin} />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '3rem' }}>
                            <label className="form-label" style={{ color: 'var(--text-muted)' }}>DÍA ESPECÍFICO DE SALIDA (OPCIONAL)</label>
                            <select name="dia_saliente" className="form-control" onChange={handleInputChange} value={formData.dia_saliente}>
                                <option value="">POR DEFECTO (SEGÚN ZONA)</option>
                                {detectedZone ? detectedZone.dias_operativos.map((d: string) => (
                                    <option key={d} value={d}>{d.toUpperCase()}</option>
                                )) : ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                                    <option key={d} value={d}>{d.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            style={{ height: '4rem', fontSize: '1.2rem' }}
                            disabled={loading}
                        >
                            {loading ? 'PROCESANDO...' : 'GUARDAR NUEVO ABONO FRECUENTE'}
                        </button>
                    </form>
                </div>
            )}

            {selectedService && (
                <PaymentModal
                    pedidoId={selectedService.id}
                    clienteNombre={selectedService.cliente.nombre}
                    montoSugerido={selectedService.monto_reportado || selectedService.total}
                    metodoSugerido={selectedService.metodo_reportado}
                    observaciones={selectedService.observaciones_chofer}
                    onClose={() => setSelectedService(null)}
                    onSuccess={fetchServices}
                />
            )}

            {showMapPicker && (
                <MapPicker
                    initialLat={formData.lat}
                    initialLng={formData.lng}
                    onClose={() => setShowMapPicker(false)}
                    onSelect={handleMapSelect}
                />
            )}
        </div>
    );
};
