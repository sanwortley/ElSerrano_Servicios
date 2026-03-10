import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Truck,
    LayoutDashboard,
    History,
    Wallet,
    Star,
    User,
    LogOut,
    Map,
    Shield,
    Home
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
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

    const isMobile = window.innerWidth <= 768;

    return (
        <aside style={{
            width: '260px',
            backgroundColor: 'black',
            color: 'white',
            height: '100vh',
            position: 'fixed',
            left: isMobile ? (isOpen ? '0' : '-260px') : '0',
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #222',
            zIndex: 1100,
            transition: 'left 0.3s ease'
        }}>
            {/* Brand */}
            <div style={{ padding: '0.4rem 1.5rem', borderBottom: '1px solid #1A1A1A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="heading-brand" style={{ fontSize: '1.1rem', margin: 0, lineHeight: 1.1, color: 'white', letterSpacing: '0.05em' }}>
                        EL SERRANO
                    </h1>
                    <h1 className="heading-brand" style={{ fontSize: '1.1rem', margin: 0, lineHeight: 1.1, color: 'var(--primary-color)', letterSpacing: '0.05em' }}>
                        SERVICIOS
                    </h1>
                </div>
                <button 
                    onClick={() => window.location.href = '/'} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                    <Home size={18} />
                </button>
            </div>

            {/* Navigation */}
            <nav 
                className="no-scrollbar"
                style={{ flex: 1, padding: '0.15rem 0', overflowY: 'auto', minHeight: 0 }}
            >
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.05rem' }}>
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                onClick={() => isMobile && onClose()}
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.45rem 1.2rem',
                                    color: isActive ? 'white' : 'var(--text-muted)',
                                    backgroundColor: isActive ? 'rgba(255, 84, 0, 0.1)' : 'transparent',
                                    borderLeft: isActive ? '3px solid var(--primary-color)' : '4px solid transparent',
                                    transition: 'all 0.3s',
                                    fontSize: '0.72rem',
                                    fontWeight: isActive ? 600 : 400,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                })}
                            >
                                <item.icon size={15} />
                                <span>{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* User Footer */}
            <div style={{ padding: '0.4rem 1.2rem', borderTop: '1px solid #1A1A1A', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#0A0A0A', padding: '0.3rem 0.5rem', borderRadius: '4px', marginBottom: '0.3rem' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.62rem', fontWeight: 700, color: 'white', margin: 0 }}>{(user?.nombre || 'USUARIO').toUpperCase()}</p>
                        <p style={{ fontSize: '0.48rem', color: 'var(--primary-color)', textTransform: 'uppercase', fontWeight: 800, margin: 0 }}>{user?.rol}</p>
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
                        gap: '0.3rem',
                        backgroundColor: '#d32f2f',
                        color: 'white',
                        border: 'none',
                        padding: '0.35rem',
                        fontSize: '0.58rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        borderRadius: '4px',
                        boxShadow: '0 1px 6px rgba(211, 47, 47, 0.1)'
                    }}
                >
                    <LogOut size={11} />
                    CERRAR SESIÓN
                </button>

                <p className="heading-brand" style={{ fontSize: '0.42rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.4rem', letterSpacing: '0.1em', opacity: 0.3 }}>
                    A SU SERVICIO... SIEMPRE
                </p>
            </div>
        </aside>
    );
};
