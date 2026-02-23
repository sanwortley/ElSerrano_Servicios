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
        <div style={{ padding: '0 1rem' }}>
            <div style={{
                marginBottom: '2rem',
                background: 'rgba(255, 84, 0, 0.05)',
                padding: '2rem',
                borderRadius: '4px',
                borderLeft: '8px solid var(--primary-color)',
                position: 'relative',
                border: '1px solid #222'
            }}>
                <h1 style={{ fontSize: '3.5rem', margin: 0, lineHeight: 0.9, color: 'white' }}>PANEL DE CONTROL</h1>
                <p style={{ color: 'white', fontWeight: 800, marginTop: '0.5rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontSize: '1.2rem', fontFamily: 'Anton' }}>
                    EL <span style={{ color: 'var(--primary-color)' }}>SERRANO SERVICIOS</span>
                </p>
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', opacity: 0.1 }}>
                    <BarChart3 size={80} color="white" />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
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
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div style={{
                                padding: '1rem',
                                backgroundColor: i % 2 === 0 ? 'var(--primary-color)' : '#222',
                                borderRadius: '2px',
                                color: 'white'
                            }}>
                                <card.icon size={24} />
                            </div>
                        </div>
                        <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 800 }}>{card.title}</h3>
                        <p style={{ fontSize: '2.8rem', color: 'white', fontFamily: 'Anton', margin: 0 }}>{card.value}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                {/* Desglose de Pedidos */}
                <div className="card" style={{ background: '#050505' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'white', fontFamily: 'Anton' }}>DESGLOSE ACTIVOS</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {stats?.breakdown && Object.entries(stats.breakdown).map(([tipo, count]) => (
                            <div key={tipo} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', border: '1px solid #222', background: '#000' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{tipo}</span>
                                <span style={{ color: 'var(--primary-color)', fontWeight: 800 }}>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Grafico de Ingresos */}
                <div className="card" style={{ background: '#050505' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'white', fontFamily: 'Anton' }}>INGRESOS (30 DÍAS)</h3>
                    <div style={{ height: '200px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={charts?.daily_stats || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="name" hide />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                    itemStyle={{ color: 'var(--primary-color)', fontWeight: 800 }}
                                    formatter={(value: any) => [`$${(value || 0).toLocaleString()}`, 'Ingresos']}
                                />
                                <Area type="monotone" dataKey="ingresos" stroke="var(--primary-color)" strokeWidth={3} fill="var(--primary-color)" fillOpacity={0.1} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <div className="card" style={{ background: '#000', border: '2px solid #222' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'white', fontFamily: 'Anton' }}>ACCIONES RÁPIDAS</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <QuickAction
                            title="NUEVA SOLICITUD"
                            desc="CREAR PEDIDO"
                            onClick={() => navigate('/nueva-solicitud')}
                        />
                        <QuickAction
                            title="GESTIÓN ABONOS"
                            desc="SERVICIOS RECURRENTES"
                            onClick={() => navigate('/frecuentes')}
                        />
                    </div>
                </div>

                {/* Quick Collection Section */}
                <div className="card" style={{ background: '#050505', border: '1px solid #222' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'white', fontFamily: 'Anton', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <DollarSign size={24} color="var(--primary-color)" /> COBRO RÁPIDO Y PEDIDOS
                    </h3>

                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
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

                    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
                        <input
                            type="text"
                            placeholder="BUSCAR CLIENTE O N° PEDIDO..."
                            className="form-control"
                            style={{ paddingLeft: '3rem', fontSize: '0.8rem' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {filteredPedidos.map((p: any) => (
                            <div key={p.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                background: activeTab === 'history' ? '#1a1a1a' : '#000',
                                border: '1px solid #222',
                                borderRadius: '4px',
                                opacity: activeTab === 'history' ? 0.8 : 1,
                                filter: activeTab === 'history' ? 'grayscale(100%)' : 'none'
                            }}>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>{(p.cliente?.nombre || 'CLIENTE SIN NOMBRE').toUpperCase()}</p>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>#{p.id} | {p.tipo_servicio}</p>
                                </div>
                                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontFamily: 'Anton', color: activeTab === 'history' ? '#666' : 'var(--primary-color)' }}>${p.costo.toLocaleString()}</span>
                                    {activeTab === 'active' && (
                                        <button
                                            onClick={() => setSelectedPedido(p)}
                                            style={{
                                                background: 'var(--primary-color)',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '2px',
                                                color: 'white',
                                                fontWeight: 800,
                                                fontSize: '0.7rem',
                                                cursor: 'pointer'
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
                                                padding: '0.5rem 1rem',
                                                borderRadius: '2px',
                                                color: (p.pagos && p.pagos.length > 0) ? '#666' : 'white',
                                                fontWeight: 800,
                                                fontSize: '0.7rem',
                                                cursor: (p.pagos && p.pagos.length > 0) ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {(p.pagos && p.pagos.length > 0) ? 'COBRADO' : 'COBRAR'}
                                        </button>
                                    )}
                                    {activeTab === 'history' && p.estado === 'CANCELADA' && (
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#ef4444' }}>
                                            CANCELADA
                                        </span>
                                    )}

                                </div>
                            </div>
                        ))}
                        {filteredPedidos.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No hay pedidos {activeTab === 'active' ? 'activos' : 'en el historial'}.</p>
                        )}
                    </div>
                </div>

                <div className="card" style={{ background: 'var(--primary-color)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1.5rem', border: 'none' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontFamily: 'Anton' }}>ESTADO</h3>
                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '2px' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 800 }}>✅ SISTEMA OPERATIVO</p>
                        <p style={{ fontSize: '0.8rem', fontWeight: 800 }}>✅ DB CONNECTED</p>
                    </div>
                </div>
            </div>

            {/* Agenda de Abonos Hoy */}
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <h2 className="heading-brand" style={{ fontSize: '2rem', margin: 0, color: 'white' }}>PROGRAMADOS PARA HOY (ABONOS)</h2>
                    <span className="badge badge-primary">{agendaHoy.length}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {agendaHoy.map(item => (
                        <div key={item.id} className="card" style={{ background: '#0A0A0A', border: '1px solid #333', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <span style={{ color: 'var(--primary-color)', fontWeight: 800, fontSize: '0.7rem' }}>{item.tipo_servicio.toUpperCase()}</span>
                                <span style={{ color: 'white', fontWeight: 800, fontSize: '0.7rem' }}>{item.zona?.nombre || 'SIN ZONA'}</span>
                            </div>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'white', fontFamily: 'Anton', fontSize: '1.2rem' }}>{(item.cliente?.nombre || 'CLIENTE').toUpperCase()}</h4>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.direccion}</p>

                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ background: '#222', padding: '0.4rem 0.8rem', borderRadius: '2px' }}>
                                    <span style={{ color: 'white', fontWeight: 800, fontSize: '0.7rem' }}>CANT: {item.cantidad}</span>
                                </div>
                                <button
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.6rem', padding: '0.4rem 1rem' }}
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
                        montoSugerido={selectedPedido.costo}
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
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>CLIENTE: <span style={{ color: 'white', fontWeight: 800 }}>{selectedAbono.cliente?.nombre.toUpperCase()}</span></p>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="form-label" style={{ color: 'var(--text-muted)' }}>MONTO A COBRAR ($)</label>
                                <input type="number" id="abono-charge-amount" className="form-control" defaultValue={selectedAbono.total} />
                            </div>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label className="form-label" style={{ color: 'var(--text-muted)' }}>MÉTODO DE PAGO</label>
                                <select id="abono-charge-method" className="form-control">
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
