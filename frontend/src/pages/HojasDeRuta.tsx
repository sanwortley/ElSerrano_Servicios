import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Save, Wand2 } from 'lucide-react';
import api from '../api/axios';

interface RouteItem {
    id: number;
    tipo: 'P' | 'F'; // P = Pedido Individual, F = Frecuente
    cliente: string;
    direccion: string;
    lat: number | null;
    lng: number | null;
    orden_en_ruta: number | null;
    original: any;
}

export const HojasDeRuta: React.FC = () => {
    const [choferes, setChoferes] = useState<any[]>([]);
    const [selectedChoferId, setSelectedChoferId] = useState<number | string>('');
    const [items, setItems] = useState<RouteItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/chofer/choferes').then(res => setChoferes(res.data));
    }, []);

    const fetchAgenda = async () => {
        if (!selectedChoferId) return;
        setLoading(true);
        try {
            // Note: Currently we don't have an admin endpoint to get "driver today" for someone else easily
            // except the one the driver uses. I'll use a hack or assume admin can see everything.
            // Let's use the /chofer/hoy logic but adapted for admin.
            // Actually, I should have an /admin/agenda/{chofer_id} endpoint.
            // For now, I'll fetch ALL individual and frequent and filter by chofer.

            const [pedRes, freqRes] = await Promise.all([
                api.get('/pedidos/'),
                api.get('/frecuentes/')
            ]);

            const peds = pedRes.data.filter((p: any) => p.chofer_id === Number(selectedChoferId) && p.estado !== 'COMPLETADA');
            const freqs = freqRes.data.filter((f: any) => f.chofer_id === Number(selectedChoferId));

            // Map to unified format
            const unified: RouteItem[] = [
                ...peds.map((p: any) => ({
                    id: p.id,
                    tipo: 'P' as const,
                    cliente: p.cliente?.nombre || 'SIN NOMBRE',
                    direccion: p.direccion,
                    lat: p.lat,
                    lng: p.lng,
                    orden_en_ruta: p.orden_en_ruta,
                    original: p
                })),
                ...freqs.map((f: any) => ({
                    id: f.id,
                    tipo: 'F' as const,
                    cliente: f.cliente?.nombre || 'SIN NOMBRE',
                    direccion: f.direccion,
                    lat: f.lat,
                    lng: f.lng,
                    orden_en_ruta: f.orden_en_ruta,
                    original: f
                }))
            ];

            // Sort by existing orden_en_ruta or default
            unified.sort((a, b) => {
                if (a.orden_en_ruta !== null && b.orden_en_ruta !== null) return a.orden_en_ruta - b.orden_en_ruta;
                if (a.orden_en_ruta !== null) return -1;
                if (b.orden_en_ruta !== null) return 1;
                return 0;
            });

            setItems(unified);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const move = (idx: number, direction: 'up' | 'down') => {
        const newItems = [...items];
        const target = direction === 'up' ? idx - 1 : idx + 1;
        if (target < 0 || target >= newItems.length) return;

        [newItems[idx], newItems[target]] = [newItems[target], newItems[idx]];
        setItems(newItems);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = items.map((it, idx) => ({
                id: it.id,
                tipo: it.tipo,
                orden: idx + 1
            }));
            await api.post('/rutas/reordenar', data);
            alert("Ruta guardada correctamente!");
        } catch (err) {
            alert("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const optimize = () => {
        // Nearest neighbor simple local version
        if (items.length === 0) return;
        const result: RouteItem[] = [];
        const pool = [...items];

        // Start from first one or something.
        let current = pool.shift()!;
        result.push(current);

        while (pool.length > 0) {
            let closestIdx = 0;
            let minDist = Infinity;

            for (let i = 0; i < pool.length; i++) {
                if (current.lat !== null && current.lng !== null && pool[i].lat !== null && pool[i].lng !== null) {
                    const d = Math.sqrt(Math.pow(current.lat! - pool[i].lat!, 2) + Math.pow(current.lng! - pool[i].lng!, 2));
                    if (d < minDist) {
                        minDist = d;
                        closestIdx = i;
                    }
                }
            }
            current = pool.splice(closestIdx, 1)[0];
            result.push(current);
        }
        setItems(result);
    };

    return (
        <div style={{ padding: '0 1rem' }}>
            <div style={{
                marginBottom: '3rem',
                background: 'rgba(255, 84, 0, 0.05)',
                padding: '2rem',
                borderRadius: '4px',
                borderLeft: '8px solid var(--primary-color)',
                border: '1px solid #222'
            }}>
                <h1 style={{ fontSize: '3rem', margin: 0, lineHeight: 0.9, color: 'white', fontFamily: 'Anton' }}>HOJA DE RUTA</h1>
                <p style={{ color: 'var(--primary-color)', fontWeight: 800, marginTop: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '1.2rem' }}>
                    CONSTRUCCIÓN Y OPTIMIZACIÓN MANUAL
                </p>
            </div>

            <div className="responsive-grid-sidebar">
                <div className="card">
                    <h3 className="heading-brand" style={{ color: 'white', fontSize: '1.2rem', marginBottom: '1.5rem' }}>FILTROS</h3>

                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ color: 'var(--text-muted)' }}>SELECCIONAR EQUIPO / CHOFER</label>
                        <select
                            className="form-control"
                            value={selectedChoferId}
                            onChange={e => setSelectedChoferId(e.target.value)}
                        >
                            <option value="">-- SELECCIONAR --</option>
                            {choferes.map(c => (
                                <option key={c.id} value={c.id}>{c.usuario.nombre.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        className="btn btn-primary btn-block"
                        onClick={fetchAgenda}
                        disabled={!selectedChoferId || loading}
                    >
                        {loading ? 'CARGANDO...' : 'VER AGENDA ACTUAL'}
                    </button>

                    <div style={{ marginTop: '2rem', padding: '1rem', background: '#050505', border: '1px solid #222' }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '1rem' }}>SOPORTE LOGÍSTICO</p>
                        <button className="btn btn-secondary btn-block" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }} onClick={optimize}>
                            <Wand2 size={16} /> OPTIMIZAR POR CERCANÍA
                        </button>
                    </div>
                </div>

                <div>
                    <div className="card" style={{ padding: 0, background: '#000' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="heading-brand" style={{ color: 'white', margin: 0, fontSize: '1.2rem' }}>SECUENCIA DE RUTA</h3>
                            <button
                                className="btn btn-primary"
                                style={{ padding: '0.5rem 2rem' }}
                                onClick={handleSave}
                                disabled={saving || items.length === 0}
                            >
                                <Save size={18} /> {saving ? 'GUARDANDO...' : 'GUARDAR ORDEN'}
                            </button>
                        </div>

                        <div style={{ minHeight: '400px' }}>
                            {items.length === 0 ? (
                                <div style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>
                                    NO HAY TAREAS ASIGNADAS O PENDIENTES
                                </div>
                            ) : (
                                <div style={{ padding: '1rem' }}>
                                    {items.map((item, idx) => (
                                        <div key={`${item.tipo}-${item.id}`} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '1rem',
                                            background: '#050505',
                                            border: '1px solid #222',
                                            marginBottom: '0.5rem',
                                            borderRadius: '4px'
                                        }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                background: 'var(--primary-color)',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontFamily: 'Anton',
                                                color: 'white',
                                                fontSize: '1.2rem'
                                            }}>
                                                {idx + 1}
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '2px', background: item.tipo === 'P' ? '#3b82f6' : '#8b5cf6', color: 'white', fontWeight: 800 }}>
                                                        {item.tipo === 'P' ? 'INSTANTÁNEO' : 'ABONO'}
                                                    </span>
                                                    <p style={{ margin: 0, fontWeight: 800, color: 'white', textTransform: 'uppercase' }}>{(item.cliente || 'SIN NOMBRE').toUpperCase()}</p>
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.direccion}</p>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <button className="btn btn-secondary" style={{ padding: '0.2rem' }} onClick={() => move(idx, 'up')} disabled={idx === 0}>
                                                    <ChevronUp size={20} />
                                                </button>
                                                <button className="btn btn-secondary" style={{ padding: '0.2rem' }} onClick={() => move(idx, 'down')} disabled={idx === items.length - 1}>
                                                    <ChevronDown size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
