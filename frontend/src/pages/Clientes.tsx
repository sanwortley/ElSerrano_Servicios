import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Trash2, Edit, Search, Navigation } from 'lucide-react';
import api from '../api/axios';

interface Cliente {
    id: number;
    nombre: string;
    telefono: string;
    direccion: string;
    email?: string;
    cuit?: string;
}

interface AddressSuggestion {
    display_name: string;
    lat: number;
    lng: number;
}

export const Clientes: React.FC = () => {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

    // Suggestions
    const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const fetchClientes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/clientes/');
            setClientes(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClientes();
    }, []);

    const handleSearchAddress = async (q: string) => {
        if (q.length < 4) {
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

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Está seguro de eliminar este cliente? Se borrarán sus datos permanentemente.')) return;
        try {
            await api.delete(`/clientes/${id}`);
            setClientes(clientes.filter(c => c.id !== id));
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.detail || 'Error al eliminar cliente';
            alert(msg);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCliente) return;
        try {
            await api.put(`/clientes/${editingCliente.id}`, editingCliente);
            setClientes(clientes.map(c => c.id === editingCliente.id ? editingCliente : c));
            setEditingCliente(null);
            alert('Cliente actualizado con éxito');
        } catch (err) {
            alert('Error al actualizar cliente');
        }
    };

    const filtered = clientes.filter(c =>
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telefono.includes(searchTerm)
    );

    return (
        <div style={{ padding: '0 1rem', paddingBottom: '5rem' }}>
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
                    <h1 className="heading-brand" style={{ fontSize: '3rem', margin: 0, color: 'white', lineHeight: 1 }}>GESTIÓN DE CLIENTES</h1>
                    <p style={{ color: 'var(--primary-color)', fontWeight: 800, letterSpacing: '0.1em', marginTop: '0.25rem' }}>DIRECTORIO CENTRALIZADO</p>
                </div>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '1.2rem', color: 'var(--text-muted)' }} size={20} />
                    <input
                        type="text"
                        placeholder="BUSCAR CLIENTE..."
                        className="form-control"
                        style={{ paddingLeft: '3rem', height: '3.5rem' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)', fontWeight: 800 }}>CARGANDO...</div>
            ) : (
                <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
                    {filtered.map(cliente => (
                        <div key={cliente.id} className="card card-instagram" style={{ backgroundColor: '#0A0A0A', border: '1px solid #333' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-color)', borderRadius: '4px' }}>
                                        <User size={24} color="white" />
                                    </div>
                                    <div>
                                        <h3 className="heading-brand" style={{ fontSize: '1.2rem', color: 'white', margin: 0 }}>{cliente.nombre.toUpperCase()}</h3>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 800, margin: 0 }}>ID: #{cliente.id}</p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => setEditingCliente(cliente)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(cliente.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <MapPin size={16} color="var(--primary-color)" />
                                    <p style={{ margin: 0, color: 'white', fontSize: '0.9rem' }}>{cliente.direccion}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Phone size={16} color="var(--primary-color)" />
                                    <p style={{ margin: 0, color: 'white', fontSize: '0.9rem' }}>{cliente.telefono}</p>
                                </div>
                                {(cliente.email || cliente.cuit) && (
                                    <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #111', display: 'grid', gap: '0.5rem' }}>
                                        {cliente.email && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>📧 {cliente.email}</p>}
                                        {cliente.cuit && <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>📄 CUIT: {cliente.cuit}</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {editingCliente && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(4px)'
                }}>
                    <div className="card card-instagram" style={{ width: '100%', maxWidth: '500px', backgroundColor: '#000', border: '1px solid #333' }}>
                        <h3 className="heading-brand" style={{ fontSize: '1.8rem', marginBottom: '2rem', color: 'white', textAlign: 'center' }}>EDITAR CLIENTE</h3>
                        <form onSubmit={handleUpdate}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label">NOMBRE</label>
                                <input
                                    className="form-control"
                                    value={editingCliente.nombre}
                                    onChange={e => setEditingCliente({ ...editingCliente, nombre: e.target.value })}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem', position: 'relative' }}>
                                <label className="form-label">DIRECCIÓN</label>
                                <input
                                    className="form-control"
                                    value={editingCliente.direccion}
                                    onChange={e => {
                                        setEditingCliente({ ...editingCliente, direccion: e.target.value });
                                        handleSearchAddress(e.target.value);
                                    }}
                                />
                                {showSuggestions && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, width: '100%', zIndex: 1100,
                                        background: '#111', border: '1px solid #444', borderRadius: '4px', overflowY: 'auto',
                                        maxHeight: '350px', boxShadow: '0 8px 30px rgba(0,0,0,0.8)', WebkitOverflowScrolling: 'touch'
                                    }}>
                                        {addressSuggestions.map((s, i) => (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    setEditingCliente({ ...editingCliente, direccion: s.display_name });
                                                    setShowSuggestions(false);
                                                }}
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
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label">TELÉFONO</label>
                                <input
                                    className="form-control"
                                    value={editingCliente.telefono}
                                    onChange={e => setEditingCliente({ ...editingCliente, telefono: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" className="btn" style={{ background: '#111', color: 'white' }} onClick={() => setEditingCliente(null)}>CANCELAR</button>
                                <button type="submit" className="btn btn-primary">GUARDAR CAMBIOS</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
