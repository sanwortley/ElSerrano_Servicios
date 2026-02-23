import React, { useState, useEffect } from 'react';
import { Map, Save, CheckSquare, Square, Search, Plus, Trash2, X, MapPin } from 'lucide-react';
import api from '../api/axios';

interface Zona {
    id: number;
    nombre: string;
    polygon_geojson: string;
    dias_operativos: string[];
    activo: boolean;
}

interface Localidad {
    display_name: string;
    geojson: any;
    type?: string;
}

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const Zonas: React.FC = () => {
    const [zonas, setZonas] = useState<Zona[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<number | null>(null);

    // New Zone Form
    const [showNewForm, setShowNewForm] = useState(false);
    const [newZoneName, setNewZoneName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLocalidades, setSelectedLocalidades] = useState<Localidad[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchResult, setSearchResult] = useState<Localidad | null>(null);
    const [error, setError] = useState('');

    const fetchZonas = async () => {
        try {
            const res = await api.get('/zonas/');
            setZonas(res.data);
        } catch (err) {
            console.error("Error fetching zonas", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchZonas();
    }, []);

    const handleSearchLocality = async () => {
        if (!searchTerm) return;
        setSearching(true);
        setError('');
        setSearchResult(null);
        try {
            const res = await api.get('/zonas/search-locality', { params: { q: searchTerm } });
            setSearchResult(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Localidad no encontrada");
        } finally {
            setSearching(false);
        }
    };

    const addLocalidad = () => {
        if (!searchResult) return;
        if (selectedLocalidades.length >= 10) {
            alert("Máximo 10 localidades por zona.");
            return;
        }
        if (selectedLocalidades.find(l => l.display_name === searchResult.display_name)) {
            alert("Esta localidad ya fue agregada.");
            return;
        }
        setSelectedLocalidades([...selectedLocalidades, searchResult]);
        setSearchResult(null);
        setSearchTerm('');
    };

    const removeLocalidad = (index: number) => {
        setSelectedLocalidades(selectedLocalidades.filter((_, i) => i !== index));
    };

    const handleCreateZone = async () => {
        if (!newZoneName) return alert("Ingrese el nombre de la zona");
        if (selectedLocalidades.length === 0) return alert("Agregue al menos una localidad");

        setLoading(true);
        try {
            // 1. Merge geometries on backend
            const mergeRes = await api.post('/zonas/merge', selectedLocalidades.map(l => JSON.stringify(l.geojson)));
            const finalGeojson = typeof mergeRes.data === 'string' ? mergeRes.data : JSON.stringify(mergeRes.data);

            // 2. Create the zone
            await api.post('/zonas/', {
                nombre: newZoneName,
                polygon_geojson: finalGeojson,
                dias_operativos: [],
                activo: true
            });

            // 3. Reset and refresh
            setShowNewForm(false);
            setNewZoneName('');
            setSelectedLocalidades([]);
            fetchZonas();
        } catch (err) {
            console.error(err);
            alert("Error al crear la zona");
        } finally {
            setLoading(false);
        }
    };

    const toggleDia = (zonaId: number, dia: string) => {
        setZonas(prev => prev.map(z => {
            if (z.id === zonaId) {
                const newDias = z.dias_operativos.includes(dia)
                    ? z.dias_operativos.filter(d => d !== dia)
                    : [...z.dias_operativos, dia];
                return { ...z, dias_operativos: newDias };
            }
            return z;
        }));
    };

    const handleSave = async (zona: Zona) => {
        setSaving(zona.id);
        try {
            await api.put(`/zonas/${zona.id}`, {
                nombre: zona.nombre,
                polygon_geojson: zona.polygon_geojson,
                dias_operativos: zona.dias_operativos,
                activo: zona.activo
            });
            alert(`Configuración guardada para ${zona.nombre}`);
        } catch (err) {
            console.error("Error saving zona", err);
            alert("Error al guardar la zona.");
        } finally {
            setSaving(null);
        }
    };

    const handleDeleteZone = async (id: number) => {
        if (!window.confirm("¿ELIMINAR ESTA ZONA?")) return;
        try {
            await api.delete(`/zonas/${id}`);
            fetchZonas();
        } catch (err) {
            alert("Error al eliminar");
        }
    };

    if (loading && !zonas.length) return <div style={{ padding: '4rem', textAlign: 'center', color: 'white', fontFamily: 'Anton' }}>CARGANDO...</div>;

    return (
        <div style={{ padding: '0 1rem', paddingBottom: '10rem' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '4rem',
                background: 'rgba(255, 84, 0, 0.05)',
                padding: '2.5rem',
                borderRadius: '4px',
                border: '1px solid #222',
                borderLeft: '10px solid var(--primary-color)'
            }}>
                <div>
                    <h1 style={{ fontSize: '3.5rem', margin: 0, lineHeight: 0.9, color: 'white', fontFamily: 'Anton' }}>GESTIÓN DE ZONAS</h1>
                    <p style={{ color: 'var(--primary-color)', fontWeight: 800, marginTop: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                        LOCALIDADES Y LOGÍSTICA
                    </p>
                </div>
                <button
                    className={`btn ${showNewForm ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => setShowNewForm(!showNewForm)}
                    style={{ height: '4rem', padding: '0 2.5rem' }}
                >
                    {showNewForm ? <X /> : <Plus />} {showNewForm ? 'CANCELAR' : 'NUEVA ZONA'}
                </button>
            </div>

            {showNewForm && (
                <div className="card card-instagram" style={{ backgroundColor: '#000', border: '2px solid white', marginBottom: '4rem', padding: '3rem' }}>
                    <h2 className="heading-brand" style={{ fontSize: '2rem', marginBottom: '2rem', color: 'white' }}>CREAR NUEVA ÁREA OPERATIVA</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                        {/* Step 1: Name and Search */}
                        <div>
                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label className="form-label" style={{ color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 800 }}>NOMBRE DE LA ZONA (Ej: ZONA SUR)</label>
                                <input
                                    className="form-control"
                                    style={{ fontSize: '1.2rem', padding: '1rem', border: '1px solid #444' }}
                                    placeholder="Nombre identificador..."
                                    value={newZoneName}
                                    onChange={e => setNewZoneName(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 800 }}>AGREGAR LOCALIDAD</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        className="form-control"
                                        placeholder="Buscar ciudad o pueblo (Ej: Villa General Belgrano)"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        onKeyPress={e => e.key === 'Enter' && handleSearchLocality()}
                                    />
                                    <button className="btn btn-primary" onClick={handleSearchLocality} disabled={searching}>
                                        <Search size={20} />
                                    </button>
                                </div>
                                {error && <p style={{ color: 'var(--danger-color)', fontSize: '0.7rem', marginTop: '0.5rem', fontWeight: 800 }}>{error.toUpperCase()}</p>}
                            </div>

                            {searchResult && (
                                <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#111', border: '1px solid var(--primary-color)', borderRadius: '2px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white', margin: 0 }}>{searchResult.display_name}</p>
                                        <span className={`badge ${searchResult.type?.includes('Polygon') ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.6rem' }}>
                                            {searchResult.type?.toUpperCase() || 'PUNTO'}
                                        </span>
                                    </div>
                                    {searchResult.type === 'Point' && (
                                        <p style={{ color: '#ef4444', fontSize: '0.65rem', marginBottom: '1rem', fontWeight: 800 }}>
                                            ⚠️ ESTA LOCALIDAD NO TIENE POLÍGONO. LA ZONA SERÁ SOLO UN PUNTO.
                                        </p>
                                    )}
                                    <button className="btn btn-primary btn-block" style={{ fontSize: '0.8rem' }} onClick={addLocalidad}>
                                        VINCULAR ESTA LOCALIDAD
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Step 2: Selected Localities */}
                        <div style={{ background: '#050505', border: '1px solid #222', padding: '2rem' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '1.5rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem' }}>
                                LOCALIDADES VINCULADAS ({selectedLocalidades.length}/10)
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {selectedLocalidades.map((loc, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '1rem', border: '1px solid #333' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <MapPin size={16} color="var(--primary-color)" />
                                            <span style={{ fontSize: '0.8rem', color: 'white', fontWeight: 600 }}>{loc.display_name.split(',')[0]}</span>
                                        </div>
                                        <button onClick={() => removeLocalidad(idx)} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                {selectedLocalidades.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#333', border: '2px dashed #111' }}>
                                        <Map size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                        <p style={{ fontSize: '0.7rem', fontWeight: 800 }}>SIN LOCALIDADES SELECCIONADAS</p>
                                    </div>
                                )}
                            </div>

                            <button
                                className="btn btn-primary btn-block"
                                style={{ marginTop: '2rem', height: '3.5rem' }}
                                onClick={handleCreateZone}
                                disabled={selectedLocalidades.length === 0 || !newZoneName}
                            >
                                GENERAR ZONA OPERATIVA
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))' }}>
                {zonas.map(zona => (
                    <div key={zona.id} className="card" style={{ backgroundColor: '#000', border: '1px solid #222', padding: '2rem', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h3 className="heading-brand" style={{ fontSize: '1.8rem', color: 'white', margin: 0, lineHeight: 1 }}>{zona.nombre}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <span style={{ width: '8px', height: '8px', background: 'var(--primary-color)', borderRadius: '50%' }}></span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>ÁREA CONFIGURADA</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn" onClick={() => handleSave(zona)} style={{ background: '#111', border: '1px solid #333', color: 'white' }}>
                                    <Save size={18} />
                                </button>
                                <button className="btn" onClick={() => handleDeleteZone(zona.id)} style={{ background: '#111', border: '1px solid #333', color: 'var(--danger-color)' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                            {DIAS.map(dia => {
                                const isSelected = zona.dias_operativos.includes(dia);
                                return (
                                    <div
                                        key={dia}
                                        onClick={() => toggleDia(zona.id, dia)}
                                        style={{
                                            padding: '0.5rem',
                                            textAlign: 'center',
                                            background: isSelected ? 'var(--primary-color)' : '#050505',
                                            border: `1px solid ${isSelected ? 'var(--primary-color)' : '#222'}`,
                                            cursor: 'pointer',
                                            borderRadius: '2px',
                                            transition: 'all 0.1s'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.6rem', fontWeight: 900, color: isSelected ? 'white' : '#444' }}>
                                            {dia.substring(0, 3).toUpperCase()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
            {zonas.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '8rem', color: 'var(--text-muted)' }}>
                    <Map size={60} style={{ marginBottom: '2rem', opacity: 0.1 }} />
                    <p style={{ fontFamily: 'Anton', fontSize: '1.5rem', letterSpacing: '0.1em' }}>NO HAY ZONAS CONFIGURADAS</p>
                    <p style={{ fontSize: '0.8rem', fontWeight: 800 }}>COMIENCE CREANDO UNA NUEVA ZONA OPERATIVA</p>
                </div>
            )}
        </div>
    );
};
