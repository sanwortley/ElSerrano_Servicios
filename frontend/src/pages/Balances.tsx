import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, FileText, Trash2, Edit3, Save, X, Fuel } from 'lucide-react';
import api from '../api/axios';
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar
} from 'recharts';

interface PagoReciente {
    id: number;
    fecha: string;
    monto: number;
    metodo: string;
    cliente: string;
    servicio: string;
    estado_pedido?: string;
    registrado_por: string;
}

interface GastoReciente {
    id: number;
    fecha: string;
    monto: number;
    categoria: string;
    descripcion: string;
    chofer: string;
    registrado_por: string;
}

interface BalanceSummary {
    total_ingresos: number;
    detalle_ingresos: { metodo: string; monto: number }[];
    total_gastos: number;
    detalle_gastos: { categoria: string; monto: number }[];
    total_trabajo: number;
    balance_neto: number;
}

interface DailyStat {
    name: string;
    ingresos: number;
    gastos: number;
    individuales: number;
    frecuentes: number;
}

export const Balances: React.FC = () => {
    const [pagos, setPagos] = useState<PagoReciente[]>([]);
    const [gastos, setGastos] = useState<GastoReciente[]>([]);
    const [summary, setSummary] = useState<BalanceSummary | null>(null);
    const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);

    const [editingPagoId, setEditingPagoId] = useState<number | null>(null);
    const [editData, setEditData] = useState({ monto: 0, metodo_pago: '' });

    // Dates for summary
    const [dates, setDates] = useState({
        desde: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        hasta: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
        fetchCharts();
    }, []);

    const fetchData = async () => {
        try {
            const [pagosRes, summaryRes, gastosRes] = await Promise.all([
                api.get('/balances/pagos'),
                api.get('/balances/semanal', { params: { desde: dates.desde, hasta: dates.hasta + 'T23:59:59' } }),
                api.get('/balances/gastos')
            ]);
            setPagos(pagosRes.data);
            setSummary(summaryRes.data);
            setGastos(gastosRes.data);
        } catch (err) {
            console.error("Error fetching balances", err);
        }
    };

    const fetchCharts = async () => {
        try {
            const res = await api.get('/balances/charts/daily', { params: { days: 30 } });
            setDailyStats(res.data.daily_stats);
        } catch (err) {
            console.error("Error fetching charts", err);
        }
    };

    const handleDeletePago = async (id: number) => {
        if (!window.confirm("¿ESTÁ SEGURO DE ELIMINAR ESTE INGRESO? ESTO AFECTARÁ LOS BALANCES.")) return;
        try {
            await api.delete(`/balances/pagos/${id}`);
            fetchData();
        } catch (err) {
            alert("Error al eliminar");
        }
    };

    const handleStartEdit = (p: PagoReciente) => {
        setEditingPagoId(p.id);
        setEditData({ monto: p.monto, metodo_pago: p.metodo });
    };

    const handleSaveEdit = async (id: number) => {
        try {
            await api.patch(`/balances/pagos/${id}`, editData);
            setEditingPagoId(null);
            fetchData();
        } catch (err) {
            alert("Error al guardar cambios");
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ backgroundColor: '#000', border: '1px solid #333', padding: '1rem', borderRadius: '4px' }}>
                    <p style={{ color: '#aaa', fontSize: '0.7rem', marginBottom: '0.5rem', fontWeight: 800 }}>{label}</p>
                    {payload.map((p: any, i: number) => (
                        <p key={i} style={{ color: p.color, fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>
                            {p.name.toUpperCase()}: ${p.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ padding: '0 1rem', paddingBottom: '5rem' }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.5rem', 
                marginBottom: '3rem', 
                background: 'rgba(255, 84, 0, 0.05)', 
                padding: '1.5rem', 
                borderRadius: '4px', 
                border: '1px solid #222',
                overflow: 'hidden'
            }} className="mobile-stack">
                <Wallet size={40} color="var(--primary-color)" className="hide-on-mobile" />
                <div>
                    <h1 className="heading-brand" style={{ fontSize: 'clamp(1.8rem, 8vw, 2.5rem)', margin: 0, color: 'white', lineHeight: 1 }}>BALANCES Y FINANZAS</h1>
                    <p style={{ color: 'var(--primary-color)', fontWeight: 800, letterSpacing: '0.1em', marginTop: '0.25rem', fontSize: '0.8rem' }}>CONTROL ECONÓMICO V2.0</p>
                </div>
            </div>

            <div className="responsive-grid-2" style={{ marginBottom: '3rem' }}>
                {/* Charts: Income & Expenses */}
                <div className="card" style={{ backgroundColor: '#000', border: '1px solid #222', minHeight: '400px' }}>
                    <h3 className="heading-brand" style={{ fontSize: '1.1rem', marginBottom: '2rem', color: 'white' }}>EVOLUCIÓN ECONÓMICA (30 DÍAS)</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="name" hide />
                                <YAxis stroke="#444" fontSize={10} tickFormatter={(val) => `$${val / 1000}k`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend iconType="circle" />
                                <Line type="monotone" dataKey="ingresos" name="Ingresos" stroke="#10b981" strokeWidth={3} dot={false} />
                                <Line type="monotone" dataKey="gastos" name="Gastos" stroke="#ef4444" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Charts: Individual vs Frequent */}
                <div className="card" style={{ backgroundColor: '#000', border: '1px solid #222', minHeight: '400px' }}>
                    <h3 className="heading-brand" style={{ fontSize: '1.1rem', marginBottom: '2rem', color: 'white' }}>VOLUMEN DE SERVICIOS</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="name" hide />
                                <YAxis stroke="#444" fontSize={10} />
                                <Tooltip cursor={{ fill: '#111' }} />
                                <Legend />
                                <Bar dataKey="individuales" name="Individuales" fill="var(--primary-color)" />
                                <Bar dataKey="frecuentes" name="Frecuentes" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="responsive-grid-sidebar">
                {/* Column 1: Summary & Filters */}
                <div>
                    <div className="card card-instagram" style={{ backgroundColor: '#000', border: '1px solid #333' }}>
                        <h3 className="heading-brand" style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <TrendingUp size={20} color="var(--primary-color)" /> FILTROS
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--text-muted)' }}>DESDE</label>
                                <input type="date" className="form-control" value={dates.desde} onChange={e => setDates({ ...dates, desde: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label" style={{ color: 'var(--text-muted)' }}>HASTA</label>
                                <input type="date" className="form-control" value={dates.hasta} onChange={e => setDates({ ...dates, hasta: e.target.value })} />
                            </div>
                            <button className="btn btn-primary btn-block" onClick={fetchData}>ACTUALIZAR RESUMEN</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ backgroundColor: '#111', padding: '1.5rem', border: '1px solid #222', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.6rem', color: '#10b981', marginBottom: '0.25rem', fontWeight: 800 }}>CAJA</p>
                                <p style={{ fontSize: '1.5rem', color: 'white', fontFamily: 'Anton', margin: 0 }}>
                                    ${summary?.total_ingresos.toLocaleString() || 0}
                                </p>
                            </div>
                            <div style={{ backgroundColor: '#111', padding: '1.5rem', border: '1px solid #222', textAlign: 'center' }}>
                                <p style={{ fontSize: '0.6rem', color: '#ef4444', marginBottom: '0.25rem', fontWeight: 800 }}>GASTOS</p>
                                <p style={{ fontSize: '1.5rem', color: 'white', fontFamily: 'Anton', margin: 0 }}>
                                    ${summary?.total_gastos.toLocaleString() || 0}
                                </p>
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#050505', padding: '1.5rem', border: '2px solid #222', textAlign: 'center', marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 800 }}>BALANCE NETO</p>
                            <p style={{ fontSize: '2.5rem', color: (summary?.balance_neto || 0) >= 0 ? '#10b981' : '#ef4444', fontFamily: 'Anton', margin: 0 }}>
                                ${summary?.balance_neto.toLocaleString() || 0}
                            </p>
                        </div>

                        <div style={{ padding: '1rem', borderTop: '1px solid #222' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-color)', marginBottom: '1rem', textTransform: 'uppercase' }}>Ingresos</p>
                            {summary?.detalle_ingresos.map((d, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #111' }}>
                                    <span style={{ fontSize: '0.8rem', color: '#ccc' }}> {d.metodo} </span>
                                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'white' }}>${d.monto.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Column 2: Tables */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* INCOMES TABLE */}
                    <div className="card" style={{ padding: 0, backgroundColor: '#000', border: '1px solid #222' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="heading-brand" style={{ fontSize: '1.2rem', margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <FileText size={20} color="#10b981" /> DETALLE DE INGRESOS
                            </h3>
                        </div>

                        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                            <div className="table-container">
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: '#050505', position: 'sticky', top: 0, zIndex: 10 }}>
                                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #222' }}>
                                            <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>FECHA / ORIGEN</th>
                                            <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>CLIENTE / DETALLE</th>
                                            <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>MÉTODO</th>
                                            <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>MONTO</th>
                                            <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>ACCIONES</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagos.map(p => (
                                            <tr key={p.id} style={{ borderBottom: '1px solid #111' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>{new Date(p.fecha).toLocaleDateString('es-AR')}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{p.servicio.toUpperCase()}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {p.cliente}
                                                        {p.estado_pedido === 'CARGA_TARDIA' && (
                                                            <span className="badge badge-warning" style={{ fontSize: '0.5rem', padding: '0.1rem 0.3rem' }}>CARGA TARDÍA</span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>REG: {p.registrado_por}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    {editingPagoId === p.id ? (
                                                        <select
                                                            className="form-control"
                                                            style={{ fontSize: '0.75rem', padding: '0.3rem' }}
                                                            value={editData.metodo_pago}
                                                            onChange={e => setEditData({ ...editData, metodo_pago: e.target.value })}
                                                        >
                                                            <option value="EFECTIVO">EFECTIVO</option>
                                                            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                                                            <option value="TARJETA">TARJETA</option>
                                                            <option value="MERCADO_PAGO">MERCADO PAGO</option>
                                                        </select>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ccc' }}>{p.metodo}</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                                    {editingPagoId === p.id ? (
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            style={{ fontSize: '0.75rem', padding: '0.3rem', textAlign: 'right' }}
                                                            value={editData.monto}
                                                            onChange={e => setEditData({ ...editData, monto: Number(e.target.value) })}
                                                        />
                                                    ) : (
                                                        <span style={{ fontFamily: 'Anton', fontSize: 'clamp(0.9rem, 4vw, 1.2rem)', color: 'white' }}>${p.monto.toLocaleString()}</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        {editingPagoId === p.id ? (
                                                            <>
                                                                <button onClick={() => handleSaveEdit(p.id)} style={{ background: '#10b981', border: 'none', color: 'white', padding: '0.4rem', borderRadius: '2px', cursor: 'pointer' }}>
                                                                    <Save size={14} />
                                                                </button>
                                                                <button onClick={() => setEditingPagoId(null)} style={{ background: '#333', border: 'none', color: 'white', padding: '0.4rem', borderRadius: '2px', cursor: 'pointer' }}>
                                                                    <X size={14} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => handleStartEdit(p)} style={{ background: 'transparent', border: '1px solid #333', color: '#aaa', padding: '0.4rem', borderRadius: '2px', cursor: 'pointer' }}>
                                                                    <Edit3 size={14} />
                                                                </button>
                                                                <button onClick={() => handleDeletePago(p.id)} style={{ background: 'transparent', border: '1px solid #333', color: 'var(--danger-color)', padding: '0.4rem', borderRadius: '2px', cursor: 'pointer' }}>
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* EXPENSES TABLE */}
                    <div className="card" style={{ padding: 0, backgroundColor: '#000', border: '1px solid #222' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="heading-brand" style={{ fontSize: '1.2rem', margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Fuel size={20} color="#ef4444" /> DETALLE DE GASTOS
                            </h3>
                        </div>

                        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                            <div className="table-container">
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: '#050505', position: 'sticky', top: 0, zIndex: 10 }}>
                                        <tr style={{ textAlign: 'left', borderBottom: '2px solid #222' }}>
                                            <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>FECHA / CATEGORÍA</th>
                                            <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>DESCRIPCIÓN / RESPONSABLE</th>
                                            <th style={{ padding: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>MONTO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {gastos.map(g => (
                                            <tr key={g.id} style={{ borderBottom: '1px solid #111' }}>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'white' }}>{new Date(g.fecha).toLocaleDateString('es-AR')}</div>
                                                    <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 800 }}>{g.categoria.toUpperCase()}</div>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ fontSize: '0.8rem', color: 'white' }}>{g.descripcion || 'Sin descripción'}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>RESP: {g.chofer} | REG: {g.registrado_por}</div>
                                                </td>
                                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontFamily: 'Anton', fontSize: 'clamp(0.9rem, 4vw, 1.2rem)', color: 'white' }}>
                                                    -${g.monto.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                        {gastos.length === 0 && (
                                            <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>SIN GASTOS REGISTRADOS</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
