import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Truck,
    LayoutDashboard,
    PlusCircle,
    History,
    Wallet,
    Star,
    User,
    LogOut,
    Map,
    Shield
} from 'lucide-react';

export const Sidebar: React.FC = () => {
    const { user, logout } = useAuth();

    let navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Inicio' },
        { path: '/historial', icon: History, label: 'Historial' },
        { path: '/balances', icon: Wallet, label: 'Balances' },
        { path: '/frecuentes', icon: Star, label: 'Servicios Frecuentes' },
        { path: '/individuales', icon: Truck, label: 'Servicios Individuales' },
        { path: '/rutas-operativas', icon: Map, label: 'Hojas de Ruta' },
        { path: '/zonas', icon: Map, label: 'Config. Zonas' },
        { path: '/clientes', icon: User, label: 'Clientes' },
        { path: '/choferes', icon: Truck, label: 'Choferes' },
    ];

    if (user?.rol === 'ADMIN') {
        navItems.push({ path: '/logs', icon: Shield, label: 'Auditoría' });
    }

    if (user?.rol === 'CHOFER') {
        navItems = [
            { path: '/chofer', icon: Truck, label: 'Mi Ruta de Hoy' },
            { path: '/historial', icon: History, label: 'Mis Servicios' },
        ];
    }

    return (
        <aside style={{
            width: 'var(--sidebar-width)',
            backgroundColor: 'black',
            color: 'white',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #222'
        }}>
            {/* Brand */}
            <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #1A1A1A' }}>
                <h1 className="heading-brand" style={{ fontSize: '1.8rem', margin: 0, lineHeight: 1, color: 'white', letterSpacing: '0.05em' }}>
                    EL SERRANO
                </h1>
                <h1 className="heading-brand" style={{ fontSize: '1.8rem', margin: 0, lineHeight: 1, color: 'var(--primary-color)', letterSpacing: '0.05em' }}>
                    SERVICIOS
                </h1>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '1.5rem 0', overflowY: 'auto', minHeight: 0 }}>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem 1.5rem',
                                    color: isActive ? 'white' : 'var(--text-muted)',
                                    backgroundColor: isActive ? 'rgba(255, 84, 0, 0.1)' : 'transparent',
                                    borderLeft: isActive ? '4px solid var(--primary-color)' : '4px solid transparent',
                                    transition: 'all 0.3s',
                                    fontSize: '0.9rem',
                                    fontWeight: isActive ? 600 : 400,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                })}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* User Footer */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid #1A1A1A' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#0A0A0A', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'white', margin: 0 }}>{(user?.nombre || 'USUARIO').toUpperCase()}</p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--primary-color)', textTransform: 'uppercase', fontWeight: 800, margin: 0 }}>{user?.rol}</p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="btn"
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        backgroundColor: '#d32f2f',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        borderRadius: '4px',
                        boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)'
                    }}
                >
                    <LogOut size={16} />
                    CERRAR SESIÓN
                </button>

                <p className="heading-brand" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1.5rem', letterSpacing: '0.1em', opacity: 0.5 }}>
                    A SU SERVICIO... SIEMPRE
                </p>
            </div>
        </aside>
    );
};
