import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, UserPlus, MapPin, FileText, Navigation, X } from 'lucide-react';
import api from '../api/axios';
import { MapPicker } from '../components/MapPicker';

interface Cliente {
    id: number;
    nombre: string;
    telefono: string;
    direccion: string;
}

interface AddressSuggestion {
    display_name: string;
    lat: number;
    lng: number;
    city?: string;
}

export const NuevaSolicitud: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [showNewClienteForm, setShowNewClienteForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // New Solicitud Form
    const [formData, setFormData] = useState({
        tipo_servicio: 'Volquetes y contenedores para obra',
        direccion: '',
        descripcion: '',
        costo: 0,
        metodo_pago: 'EFECTIVO',
        fecha_hora_ejecucion: new Date().toISOString().slice(0, 16),
        zona_id: null as number | null,
        lat: null as number | null,
        lng: null as number | null
    });

    const [detectedZone, setDetectedZone] = useState<any>(null);
    const [zoneMsg, setZoneMsg] = useState('');

    // Suggestions
    const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [suggestionContext, setSuggestionContext] = useState<'solicitud' | 'cliente'>('solicitud');

    // New Cliente Form
    const [newClienteData, setNewClienteData] = useState({
        nombre: '',
        telefono: '',
        direccion: '',
        lat: null as number | null,
        lng: null as number | null
    });


    useEffect(() => {
        fetchClientes();
    }, []);

    const fetchClientes = async () => {
        try {
            const [cRes] = await Promise.all([
                api.get('/clientes/'),
                api.get('/zonas/')
            ]);
            setClientes(cRes.data);
        } catch (err) {
            console.error("Error fetching data", err);
        }
    };

    const handleSearchAddress = async (q: string, context: 'solicitud' | 'cliente') => {
        if (q.length < 4) {
            setAddressSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        try {
            const res = await api.get('/zonas/suggest-address', { params: { q } });
            setAddressSuggestions(res.data);
            setShowSuggestions(res.data.length > 0);
            setSuggestionContext(context);
        } catch (err) {
            console.error("Error suggesting address", err);
        }
    };

    const selectSuggestion = (s: AddressSuggestion) => {
        if (suggestionContext === 'solicitud') {
            setFormData(prev => ({
                ...prev,
                direccion: s.display_name,
                lat: s.lat,
                lng: s.lng
            }));
            // Trigger zone detection for these coords
            detectZoneForCoords(s.lat, s.lng);
        } else {
            setNewClienteData(prev => ({
                ...prev,
                direccion: s.display_name,
                lat: s.lat,
                lng: s.lng
            }));
        }
        setShowSuggestions(false);
    };

    const detectZoneForCoords = async (lat: number, lng: number) => {
        try {
            const res = await api.get('/zonas/detect', { params: { lat, lng } });
            if (res.data.zona) {
                setDetectedZone(res.data.zona);
                setFormData(prev => ({ ...prev, zona_id: res.data.zona.id }));
                setZoneMsg('');
            } else {
                setDetectedZone(null);
                setFormData(prev => ({ ...prev, zona_id: null }));
                setZoneMsg(res.data.msg);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleMapSelect = async (lat: number, lng: number) => {
        setShowMapPicker(false);
        try {
            const res = await api.get('/zonas/reverse', { params: { lat, lng } });
            const address = res.data.display_name;

            if (suggestionContext === 'solicitud') {
                setFormData(prev => ({
                    ...prev,
                    direccion: address,
                    lat,
                    lng
                }));
                detectZoneForCoords(lat, lng);
            } else {
                setNewClienteData(prev => ({
                    ...prev,
                    direccion: address,
                    lat,
                    lng
                }));
            }
        } catch (err) {
            console.error("Error reverse geocoding", err);
            if (suggestionContext === 'solicitud') {
                setFormData(prev => ({ ...prev, lat, lng }));
                detectZoneForCoords(lat, lng);
            } else {
                setNewClienteData(prev => ({ ...prev, lat, lng }));
            }
        }
    };

    const handleCreateSolicitud = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCliente) {
            setMsg({ type: 'error', text: 'Debe seleccionar un cliente' });
            return;
        }
        setLoading(true);
        try {
            await api.post('/pedidos/', {
                ...formData,
                cliente_id: Number(selectedCliente.id),
                costo: Number(formData.costo)
            });
            setMsg({ type: 'success', text: 'SOLICITUD CREADA CON ÉXITO' });
            setFormData({
                tipo_servicio: 'Volquetes y contenedores para obra',
                direccion: '',
                descripcion: '',
                costo: 0,
                metodo_pago: 'EFECTIVO',
                fecha_hora_ejecucion: new Date().toISOString().slice(0, 16),
                zona_id: null,
                lat: null,
                lng: null
            });
            setSelectedCliente(null);
            setSearchTerm('');
            if (onSuccess) onSuccess();
        } catch (err: any) {
            console.error(err);
            setMsg({ type: 'error', text: 'ERROR AL CREAR SOLICITUD' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCliente = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/clientes/', newClienteData);
            setClientes([...clientes, res.data]);
            setSelectedCliente(res.data);
            setShowNewClienteForm(false);
            setMsg({ type: 'success', text: 'Cliente creado correctamente' });
            setFormData(prev => ({ ...prev, direccion: res.data.direccion, lat: newClienteData.lat, lng: newClienteData.lng }));
            detectZoneForLocation(res.data.direccion, newClienteData.lat, newClienteData.lng);
        } catch (err) {
            setMsg({ type: 'error', text: 'Error al crear cliente' });
        } finally {
            setLoading(false);
        }
    };

    const detectZoneForLocation = async (address: string, lat?: number | null, lng?: number | null) => {
        if (!address && !lat) return;
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
                setFormData(prev => ({
                    ...prev,
                    zona_id: res.data.zona.id,
                    lat: res.data.lat,
                    lng: res.data.lng
                }));
                setZoneMsg('');
            } else {
                setDetectedZone(null);
                setFormData(prev => ({
                    ...prev,
                    zona_id: null,
                    lat: res.data.lat,
                    lng: res.data.lng
                }));
                setZoneMsg(res.data.msg);
            }
        } catch (err) {
            console.error("Error detecting zone", err);
        }
    };

    const filteredClientes = clientes.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.direccion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '0 1rem', maxWidth: '1000px', margin: '0 auto', paddingBottom: '5rem' }}>
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
                <PlusCircle size={40} color="var(--primary-color)" />
                <div>
                    <h1 className="heading-brand" style={{ fontSize: '2.5rem', margin: 0, color: 'white', lineHeight: 1 }}>NUEVA SOLICITUD</h1>
                    <p style={{ color: 'var(--primary-color)', fontWeight: 800, letterSpacing: '0.1em', marginTop: '0.25rem' }}>INGRESO DE PEDIDOS V2.0</p>
                </div>
            </div>


            {msg.text && (
                <div className={`badge ${msg.type === 'success' ? 'badge-success' : 'badge-danger'}`} style={{ width: '100%', padding: '1.5rem', marginBottom: '2rem', textAlign: 'center', borderRadius: '4px' }}>
                    {msg.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                {/* Column 1: Client Selection */}
                <div className="card card-instagram" style={{ backgroundColor: '#000', border: '1px solid #333' }}>
                    <h3 className="heading-brand" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Search size={22} color="var(--primary-color)" /> CLIENTE
                    </h3>

                    {!selectedCliente ? (
                        <>
                            <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--text-muted)' }}>BUSCAR EXISTENTE</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="NOMBRE O DIRECCIÓN..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div style={{
                                maxHeight: '300px',
                                overflowY: 'auto',
                                border: '2px solid #111',
                                backgroundColor: '#050505',
                                borderRadius: '4px',
                                marginTop: '1rem'
                            }}>
                                {filteredClientes.length > 0 ? (
                                    filteredClientes.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => {
                                                setSelectedCliente(c);
                                                setFormData(prev => ({ ...prev, direccion: c.direccion }));
                                                detectZoneForLocation(c.direccion);
                                            }}
                                            style={{
                                                padding: '1rem',
                                                borderBottom: '1px solid #111',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#111')}
                                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                                        >
                                            <p style={{ fontWeight: 800, margin: 0, color: 'white', textTransform: 'uppercase' }}>{c.nombre}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>{c.direccion}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800, fontSize: '0.8rem' }}>
                                        SIN RESULTADOS
                                    </div>
                                )}
                            </div>

                            <button
                                className="btn"
                                style={{
                                    width: '100%',
                                    marginTop: '2rem',
                                    border: '1px dashed var(--primary-color)',
                                    color: 'var(--primary-color)',
                                    background: 'rgba(255, 84, 0, 0.05)'
                                }}
                                onClick={() => setShowNewClienteForm(true)}
                            >
                                <UserPlus size={18} color="var(--primary-color)" /> + NUEVO CLIENTE
                            </button>
                        </>
                    ) : (
                        <div style={{ padding: '2rem', backgroundColor: '#111', border: '2px solid var(--primary-color)', borderRadius: '2px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <p className="heading-brand" style={{ fontSize: '1.2rem', color: 'white', marginBottom: '0.5rem' }}>{selectedCliente.nombre}</p>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MapPin size={14} color="var(--primary-color)" /> {selectedCliente.direccion}
                                    </p>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        📞 {selectedCliente.telefono}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedCliente(null)}
                                    className="btn btn-danger"
                                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                                >
                                    CAMBIAR
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Column 2: Solicitud Details */}
                <div className="card card-instagram" style={{ backgroundColor: '#000', border: '1px solid #333' }}>
                    <h3 className="heading-brand" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={22} color="var(--primary-color)" /> DETALLES
                    </h3>
                    <form onSubmit={handleCreateSolicitud}>
                        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                            <label className="form-label" style={{ color: 'var(--text-muted)' }}>SERVICIO</label>
                            <select
                                className="form-control"
                                value={formData.tipo_servicio}
                                onChange={(e) => setFormData({ ...formData, tipo_servicio: e.target.value })}
                            >
                                <option value="Volquetes y contenedores para obra">ALQUILER DE VOLQUETE / OBRA</option>
                                <option value="Venta de áridos, piedras y rellenos">VENTA DE ÁRIDOS / PIEDRA</option>
                                <option value="Desagotes y destapes de cañerías">DESAGOTES / DESTAPES</option>
                                <option value="Alquiler de baños químicos">ALQUILER DE BAÑO QUÍMICO</option>
                                <option value="Movimiento de suelo">MOVIMIENTO DE SUELO</option>
                                <option value="Alquiler de obradores">ALQUILER DE OBRADORES</option>
                                <option value="Otros">OTROS</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.25rem', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label className="form-label" style={{ color: 'var(--text-muted)', margin: 0 }}>DIRECCIÓN DE ENTREGA</label>
                                <button
                                    type="button"
                                    className="btn"
                                    style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: '#222', border: '1px solid #444', color: 'var(--primary-color)' }}
                                    onClick={() => {
                                        setSuggestionContext('solicitud');
                                        setShowMapPicker(true);
                                    }}
                                >
                                    <MapPin size={12} /> ELEGIR EN EL MAPA
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="ESCRIBA CALLE Y NÚMERO..."
                                    required
                                    value={formData.direccion}
                                    onChange={(e) => {
                                        setFormData({ ...formData, direccion: e.target.value });
                                        handleSearchAddress(e.target.value, 'solicitud');
                                    }}
                                />
                            </div>

                            {showSuggestions && suggestionContext === 'solicitud' && (
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

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--text-muted)' }}>PROGRAMACIÓN</label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    required
                                    value={formData.fecha_hora_ejecucion}
                                    onChange={(e) => setFormData({ ...formData, fecha_hora_ejecucion: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--text-muted)' }}>PRECIO COBRADO</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="0"
                                    required
                                    value={formData.costo}
                                    onChange={(e) => setFormData({ ...formData, costo: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-block"
                            style={{ height: '4rem', fontSize: '1.2rem' }}
                            disabled={loading || !selectedCliente}
                        >
                            {loading ? 'PROCESANDO...' : 'CONFIRMAR SOLICITUD'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Modal: New Cliente */}
            {showNewClienteForm && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(4px)'
                }}>
                    <div className="card card-instagram" style={{ width: '100%', maxWidth: '500px', backgroundColor: '#000', border: '1px solid #333', position: 'relative', overflow: 'visible' }}>
                        <button
                            onClick={() => setShowNewClienteForm(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>
                        <h3 className="heading-brand" style={{ fontSize: '1.8rem', marginBottom: '2rem', color: 'white', textAlign: 'center' }}>NUEVO CLIENTE</h3>
                        <form onSubmit={handleCreateCliente}>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label className="form-label" style={{ color: 'var(--text-muted)' }}>NOMBRE COMPLETO</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    required
                                    value={newClienteData.nombre}
                                    onChange={(e) => setNewClienteData({ ...newClienteData, nombre: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label className="form-label" style={{ color: 'var(--text-muted)' }}>TELÉFONO / WHATSAPP</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    required
                                    value={newClienteData.telefono}
                                    onChange={(e) => setNewClienteData({ ...newClienteData, telefono: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '2rem', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label className="form-label" style={{ color: 'var(--text-muted)', margin: 0 }}>DIRECCIÓN (CALLE Y NÚMERO)</label>
                                    <button
                                        type="button"
                                        className="btn"
                                        style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: '#222', border: '1px solid #444', color: 'var(--primary-color)' }}
                                        onClick={() => {
                                            setSuggestionContext('cliente');
                                            setShowMapPicker(true);
                                        }}
                                    >
                                        <MapPin size={12} /> ELEGIR EN EL MAPA
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    className="form-control"
                                    required
                                    placeholder="Villa Gral Belgrano, Santa Rosa, etc..."
                                    value={newClienteData.direccion}
                                    onChange={(e) => {
                                        setNewClienteData({ ...newClienteData, direccion: e.target.value });
                                        handleSearchAddress(e.target.value, 'cliente');
                                    }}
                                />
                                {showSuggestions && suggestionContext === 'cliente' && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 2000,
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
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <button type="button" className="btn" style={{ background: '#111', color: 'white', border: '1px solid #222' }} onClick={() => setShowNewClienteForm(false)}>CANCELAR</button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>GUARDAR</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showMapPicker && (
                <MapPicker
                    initialLat={suggestionContext === 'solicitud' ? formData.lat : newClienteData.lat}
                    initialLng={suggestionContext === 'solicitud' ? formData.lng : newClienteData.lng}
                    onClose={() => setShowMapPicker(false)}
                    onSelect={handleMapSelect}
                />
            )}
        </div>
    );
};
