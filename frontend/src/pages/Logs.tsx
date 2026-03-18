import React, { useState, useEffect } from 'react';
import { Search, User, Clock, Shield } from 'lucide-react';
import api from '../api/axios';

interface AuditLog {
    id: number;
    user: string;
    accion: string;
    recurso: string;
    recurso_id: number | null;
    detalles: any;
    ip: string | null;
    timestamp: string;
}

export const Logs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/audit/');
            setLogs(res.data);
        } catch (err) {
            console.error("Error fetching logs", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.recurso.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <Shield size={40} color="var(--primary-color)" />
                <div>
                    <h1 className="heading-brand" style={{ fontSize: '2.5rem', margin: 0, color: 'white', lineHeight: 1 }}>AUDITORÍA DEL SISTEMA</h1>
                    <p style={{ color: 'var(--primary-color)', fontWeight: 800, letterSpacing: '0.1em', marginTop: '0.25rem' }}>LOGS DE ACTIVIDAD V2.0</p>
                </div>
            </div>

            <div className="card card-instagram" style={{ marginBottom: '3rem', padding: '1.5rem', backgroundColor: '#000', border: '1px solid #333' }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <label className="form-label" style={{ color: 'var(--text-muted)' }}>FILTRAR ACTIVIDAD</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--primary-color)' }} />
                            <input
                                type="text"
                                className="form-control"
                                style={{ paddingLeft: '3rem' }}
                                placeholder="USUARIO, ACCIÓN O RECURSO..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', backgroundColor: '#000', border: '1px solid #222' }}>
                <div className="table-container" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ backgroundColor: '#050505', borderBottom: '2px solid #222' }}>
                            <tr>
                                <th style={{ padding: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>FECHA</th>
                                <th style={{ padding: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>USUARIO</th>
                                <th style={{ padding: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>ACCIÓN</th>
                                <th style={{ padding: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }} className="hide-on-mobile">RECURSO</th>
                                <th style={{ padding: '0.5rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textAlign: 'right' }}>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>CARGANDO...</td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 800 }}>SIN ACTIVIDAD RECIENTE</td>
                                </tr>
                            ) : (
                                filteredLogs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid #111' }}>
                                        <td style={{ padding: '0.5rem' }}>
                                            <div style={{ fontSize: '0.7rem', color: 'white', fontWeight: 600 }}>
                                                {new Date(log.timestamp + 'Z').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                                            </div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                <Clock size={8} /> {new Date(log.timestamp + 'Z').toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'white', fontWeight: 800, fontSize: '0.7rem' }}>
                                                <User size={12} color="var(--primary-color)" /> {log.user.toUpperCase()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.5rem' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-color)' }}>{log.accion}</span>
                                            {log.detalles && (
                                                <div style={{ fontSize: '0.55rem', color: '#999', marginTop: '0.2rem', background: '#111', padding: '0.2rem', borderRadius: '4px' }} className="hide-on-mobile">
                                                    {Object.entries(log.detalles).slice(0, 2).map(([k, v]) => (
                                                        <div key={k} style={{ display: 'flex', gap: '0.2rem' }}>
                                                            <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{k}:</span>
                                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(v)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.5rem' }} className="hide-on-mobile">
                                            <div style={{ fontSize: '0.7rem', color: 'white', fontWeight: 600 }}>{log.recurso.toUpperCase()}</div>
                                            {log.recurso_id && <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>ID: #{log.recurso_id}</div>}
                                        </td>
                                        <td className="ip-column" style={{ padding: '0.5rem', fontSize: 'clamp(0.6rem, 2.5vw, 0.7rem)', color: 'var(--text-muted)', fontFamily: 'monospace', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                            {log.ip || '---'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
