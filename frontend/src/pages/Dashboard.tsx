import React, { useState, useEffect } from 'react';
import { Truck, Wallet, Users, Clock, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PaymentModal } from '../components/PaymentModal';
import { Search, DollarSign } from 'lucide-react';

interface DashboardStats {
    active_pedidos: number;
    active_frecuentes: number;
    income_today: number;
    total_choferes: number;
    breakdown: Record<string, number>;
}

interface ChartData {
    daily_stats: any[];
    hours_data: any[];
    choferes: string[];
}

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [charts, setCharts] = useState<ChartData | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [allPedidos, setAllPedidos] = useState<any[]>([]);
    const [selectedPedido, setSelectedPedido] = useState<any | null>(null);
    const [selectedAbono, setSelectedAbono] = useState<any | null>(null);
    const [agendaHoy, setAgendaHoy] = useState<any[]>([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.rol === 'CHOFER') {
            navigate('/chofer');
        }
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const [statsRes, chartsRes, pedidosRes, agendaRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/balances/charts/daily'),
                api.get('/pedidos/'),
                api.get('/frecuentes/agenda/hoy')
            ]);
            setStats(statsRes.data);
            setCharts(chartsRes.data);
            setAllPedidos(pedidosRes.data);
            setAgendaHoy(agendaRes.data);
        } catch (err) {
            console.error("Error fetching dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    useEffect(() => {
        fetchData();
    }, []);



    if (loading) return (
        <div style={{
            height: '80vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            color: 'white'
        }}>
            <div className="spinner" style={{
                width: '40px',
                height: '40px',
                border: '4px solid #333',
                borderTop: '4px solid var(--primary-color)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ fontFamily: 'Anton', fontSize: '1.2rem', letterSpacing: '0.1em' }}>CARGANDO SISTEMA...</p>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );

    const cards = [
        {
            title: 'Pedidos Activos',
            value: stats?.active_pedidos || 0,
            icon: Truck,
            color: 'var(--primary-color)',
            desc: 'Solicitudes en curso',
            path: '/individuales'
        },
        {
            title: 'Recurrentes Activos',
            value: stats?.active_frecuentes || 0,
            icon: Clock,
            color: '#8b5cf6',
            desc: 'Servicios de abono',
            path: '/frecuentes'
        },
        {
            title: 'Ingresos Hoy',
            value: `$${(stats?.income_today || 0).toLocaleString()}`,
            icon: Wallet,
            color: '#10b981',
            desc: 'Cobros registrados',
            path: '/balances'
        },
        {
            title: 'Equipos Disponibles',
            value: stats?.total_choferes || 0,
            icon: Users,
            color: '#f59e0b',
            desc: 'Choferes en sistema',
            path: '/choferes'
        }
    ];

    const isHistoryStatus = (status: string) => ['COMPLETADA', 'CANCELADA', 'FINALIZADO', 'CARGA_TARDIA'].includes(status);

    const filteredPedidos = allPedidos.filter(p => {
        const matchesSearch =
            p.cliente?.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.id.toString().includes(searchQuery);

        const isHistory = isHistoryStatus(p.estado);
        const matchesTab = activeTab === 'active' ? !isHistory : isHistory;

        return matchesSearch && matchesTab;
    });

    return (
        <div style={{ padding: '0 0.5rem' }}>
            {/* Dashboard Header */}
            <div style={{
                marginBottom: '1.5rem',
                background: 'rgba(255, 84, 0, 0.05)',
                padding: '1.5rem 1rem',
                borderRadius: '4px',
                borderLeft: '6px solid var(--primary-color)',
                position: 'relative',
                border: '1px solid #222',
                overflow: 'hidden'
            }} className="mobile-padding-sm">
                <h1 style={{ fontSize: 'clamp(1.8rem, 8vw, 2.5rem)', margin: 0, lineHeight: 1, color: 'white' }}>PANEL DE CONTROL</h1>
                <p style={{ color: 'white', fontWeight: 800, marginTop: '0.4rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '0.9rem', fontFamily: 'Anton' }}>
                    EL <span style={{ color: 'var(--primary-color)' }}>SERRANO SERVICIOS</span>
                </p>
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', opacity: 0.1 }} className="hide-on-mobile">
                    <BarChart3 size={60} color="white" />
                </div>
            </div>

            {/* Stat Cards */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                gap: '1rem', 
                marginBottom: '2rem' 
            }} className="mobile-grid-2">
                {cards.map((card, i) => (
                    <div
                        key={i}
                        className="card card-instagram"
                        onClick={() => navigate(card.path)}
                        style={{
                            backgroundColor: '#0A0A0A',
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: 'pointer',
                            padding: '1.25rem'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{
                                padding: '0.6rem',
                                backgroundColor: i % 2 === 0 ? 'var(--primary-color)' : '#222',
                                borderRadius: '2px',
                                color: 'white'
                            }}>
                                <card.icon size={20} />
                            </div>
                        </div>
                        <h3 style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 800 }}>{card.title}</h3>
                        <p style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', color: 'white', fontFamily: 'Anton', margin: 0 }}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts & Breakdown */}
            <div className="responsive-grid-cards" style={{ marginBottom: '2rem' }}>
                {/* Desglose de Pedidos */}
                <div className="card" style={{ background: '#050505', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem', color: 'white', fontFamily: 'Anton' }}>DESGLOSE ACTIVOS</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {stats?.breakdown && Object.entries(stats.breakdown).map(([tipo, count]) => (
                            <div key={tipo} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', border: '1px solid #222', background: '#000' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{tipo}</span>
                                <span style={{ color: 'var(--primary-color)', fontWeight: 800, fontSize: '0.85rem' }}>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grafico de Ingresos */}
                <div className="card" style={{ background: '#050505', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem', color: 'white', fontFamily: 'Anton' }}>INGRESOS (30 DÍAS)</h3>
                    <div style={{ height: '180px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={charts?.daily_stats || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="name" hide />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', fontSize: '0.8rem' }}
                                    itemStyle={{ color: 'var(--primary-color)', fontWeight: 800 }}
                                    formatter={(value: any) => [`$${(value || 0).toLocaleString()}`, 'Ingresos']}
                                />
                                <Area type="monotone" dataKey="ingresos" stroke="var(--primary-color)" strokeWidth={3} fill="var(--primary-color)" fillOpacity={0.1} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Collection */}
            <div className="responsive-grid-cards" style={{ marginBottom: '2rem' }}>
                <div className="card" style={{ background: '#000', border: '2px solid #222', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem', color: 'white', fontFamily: 'Anton' }}>ACCIONES RÁPIDAS</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <QuickAction
                            title="NUEVA SOLICITUD"
                            desc="CREAR PEDIDO"
                            onClick={() => navigate('/nueva-solicitud')}
                        />
                        <QuickAction
                            title="GESTIÓN ABONOS"
                            desc="SERVICIOS"
                            onClick={() => navigate('/frecuentes')}
                        />
                    </div>
                </div>

                {/* Quick Collection Section */}
                <div className="card" style={{ background: '#050505', border: '1px solid #222', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'white', fontFamily: 'Anton', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DollarSign size={20} color="var(--primary-color)" /> COBRO RÁPIDO
                    </h3>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <button
                            className={`btn ${activeTab === 'active' ? 'btn-primary' : ''}`}
                            style={{ flex: 1, padding: '0.6rem', fontSize: '0.75rem', border: activeTab === 'active' ? 'none' : '1px solid #333', background: activeTab === 'active' ? 'var(--primary-color)' : 'transparent', color: 'white' }}
                            onClick={() => setActiveTab('active')}
                        >
                            ACTIVOS
                        </button>
                        <button
                            className={`btn ${activeTab === 'history' ? 'btn-primary' : ''}`}
                            style={{ flex: 1, padding: '0.6rem', fontSize: '0.75rem', border: activeTab === 'history' ? 'none' : '1px solid #333', background: activeTab === 'history' ? '#333' : 'transparent', color: 'white' }}
                            onClick={() => setActiveTab('history')}
                        >
                            HISTORIAL
                        </button>
                    </div>

                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                        <input
                            type="text"
                            placeholder="BUSCAR CLIENTE..."
                            className="form-control"
                            style={{ paddingLeft: '2.5rem', fontSize: '0.75rem', height: '2.5rem' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {filteredPedidos.map((p: any) => (
                            <div key={p.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.8rem',
                                background: activeTab === 'history' ? '#1a1a1a' : '#000',
                                border: '1px solid #222',
                                borderRadius: '4px',
                                opacity: activeTab === 'history' ? 0.8 : 1
                            }}>
                                <div style={{ overflow: 'hidden' }}>
                                    <p style={{ margin: 0, fontWeight: 800, color: 'white', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(p.cliente?.nombre || 'CLIENTE').toUpperCase()}</p>
                                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)' }}>#{p.id} | {p.tipo_servicio}</p>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', minWidth: '80px' }}>
                                    <span style={{ fontFamily: 'Anton', color: activeTab === 'history' ? '#666' : 'var(--primary-color)', fontSize: '0.9rem' }}>{p.rango_precio ? p.rango_precio : `$${p.costo.toLocaleString()}`}</span>
                                    {activeTab === 'active' && (
                                        <button
                                            onClick={() => setSelectedPedido(p)}
                                            style={{
                                                background: 'var(--primary-color)',
                                                border: 'none',
                                                padding: '0.4rem 0.6rem',
                                                borderRadius: '2px',
                                                color: 'white',
                                                fontWeight: 800,
                                                fontSize: '0.6rem',
                                                cursor: 'pointer',
                                                width: '100%'
                                            }}
                                        >
                                            COBRAR
                                        </button>
                                    )}
                                    {activeTab === 'history' && p.estado !== 'CANCELADA' && (
                                        <button
                                            disabled={p.pagos && p.pagos.length > 0}
                                            onClick={() => {
                                                if (!p.pagos || p.pagos.length === 0) {
                                                    setSelectedPedido(p);
                                                }
                                            }}
                                            style={{
                                                background: (p.pagos && p.pagos.length > 0) ? '#333' : 'var(--primary-color)',
                                                border: 'none',
                                                padding: '0.4rem 0.6rem',
                                                borderRadius: '2px',
                                                color: (p.pagos && p.pagos.length > 0) ? '#666' : 'white',
                                                fontWeight: 800,
                                                fontSize: '0.6rem',
                                                width: '100%'
                                            }}
                                        >
                                            {(p.pagos && p.pagos.length > 0) ? 'COBRADO' : 'COBRAR'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Agenda de Abonos Hoy */}
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <h2 className="heading-brand" style={{ fontSize: '1.5rem', margin: 0, color: 'white' }}>PROGRAMADOS (ABONOS)</h2>
                    <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>{agendaHoy.length}</span>
                </div>

                <div className="responsive-grid-cards" style={{ gap: '1rem' }}>
                    {agendaHoy.map(item => (
                        <div key={item.id} className="card" style={{ background: '#0A0A0A', border: '1px solid #333', padding: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                <span style={{ color: 'var(--primary-color)', fontWeight: 800, fontSize: '0.65rem' }}>{item.tipo_servicio.toUpperCase()}</span>
                                <span style={{ color: 'white', fontWeight: 800, fontSize: '0.65rem' }}>{item.zona?.nombre || 'SIN ZONA'}</span>
                            </div>
                            <h4 style={{ margin: '0 0 0.4rem 0', color: 'white', fontFamily: 'Anton', fontSize: '1.1rem' }}>{(item.cliente?.nombre || 'CLIENTE').toUpperCase()}</h4>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.direccion}</p>

                            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ background: '#222', padding: '0.3rem 0.6rem', borderRadius: '2px' }}>
                                    <span style={{ color: 'white', fontWeight: 800, fontSize: '0.65rem' }}>CANT: {item.cantidad}</span>
                                </div>
                                <button
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.6rem', padding: '0.4rem 0.8rem' }}
                                    onClick={() => setSelectedAbono(item)}
                                >
                                    COBRAR
                                </button>
                            </div>
                        </div>
                    ))}
                    {agendaHoy.length === 0 && (
                        <div style={{ gridColumn: '1/-1', padding: '3rem', border: '2px dashed #222', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <p style={{ fontWeight: 800 }}>NO HAY SERVICIOS PROGRAMADOS PARA HOY</p>
                        </div>
                    )}
                </div>
            </div>

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

            {
                selectedAbono && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
                        <div style={{ background: '#000', border: '2px solid #333', padding: '2rem', width: '100%', maxWidth: '500px' }}>
                            <h2 className="heading-brand" style={{ fontSize: '1.5rem', color: 'white', marginBottom: '1.5rem' }}>COBRAR ABONO</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>CLIENTE: <span style={{ color: 'white', fontWeight: 800 }}>{selectedAbono.cliente?.nombre.toUpperCase()}</span></p>

                            {selectedAbono.observaciones_chofer && (
                                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255, 84, 0, 0.05)', borderRadius: '4px', border: '1px solid #222', borderLeft: '4px solid var(--primary-color)' }}>
                                    <p style={{ fontSize: '0.6rem', color: 'var(--primary-color)', fontWeight: 800, margin: '0 0 0.25rem 0' }}>AVISO DEL CHOFER</p>
                                    <p style={{ margin: 0, color: 'white', fontSize: '0.8rem', fontStyle: 'italic' }}>"{selectedAbono.observaciones_chofer}"</p>
                                </div>
                            )}

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label" style={{ color: 'var(--text-muted)' }}>MONTO A COBRAR ($)</label>
                                <input type="number" id="abono-charge-amount" className="form-control" defaultValue={selectedAbono.monto_reportado || selectedAbono.total} />
                            </div>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label className="form-label" style={{ color: 'var(--text-muted)' }}>MÉTODO DE PAGO</label>
                                <select id="abono-charge-method" className="form-control" defaultValue={selectedAbono.metodo_reportado || "EFECTIVO"}>
                                    <option value="EFECTIVO">EFECTIVO</option>
                                    <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                                    <option value="TARJETA">TARJETA</option>
                                    <option value="MERCADO_PAGO">MERCADO PAGO</option>
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <button className="btn btn-secondary" onClick={() => setSelectedAbono(null)}>CANCELAR</button>
                                <button className="btn btn-primary" onClick={async () => {
                                    try {
                                        const monto = (document.getElementById('abono-charge-amount') as HTMLInputElement).value;
                                        const metodo = (document.getElementById('abono-charge-method') as HTMLSelectElement).value;
                                        await api.post(`/frecuentes/${selectedAbono.id}/pagos`, {
                                            monto: Number(monto),
                                            metodo_pago: metodo
                                        });
                                        alert("Cobro registrado con éxito!");
                                        setSelectedAbono(null);
                                        fetchData();
                                    } catch (err) {
                                        console.error(err);
                                        alert("Error al registrar cobro");
                                    }
                                }}>REGISTRAR PAGO</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

const QuickAction: React.FC<{ title: string, desc: string, onClick: () => void }> = ({ title, desc, onClick }) => (
    <div
        onClick={onClick}
        style={{
            padding: '1rem',
            borderRadius: '2px',
            border: '2px solid #222',
            cursor: 'pointer',
            background: '#050505'
        }}
    >
        <p style={{ fontWeight: 400, fontSize: '1.1rem', marginBottom: '0.25rem', color: 'white', fontFamily: 'Anton' }}>{title}</p>
        <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800 }}>{desc}</p>
    </div>
);
