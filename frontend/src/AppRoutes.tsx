import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { Routes } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Frecuentes } from './pages/Frecuentes';
import { Individuales } from './pages/Individuales';
import { NuevaSolicitud } from './pages/NuevaSolicitud';
import { Historial } from './pages/Historial';
import { Balances } from './pages/Balances';
import { ChoferPanel } from './pages/ChoferPanel';
import { Clientes } from './pages/Clientes';
import { Choferes } from './pages/Choferes';
import { Zonas } from './pages/Zonas';
import { HojasDeRuta } from './pages/HojasDeRuta';
import { PortalCliente } from './pages/PortalCliente';
import { ChangePassword } from './pages/ChangePassword';
import { Logs } from './pages/Logs';
import { Layout } from './components/Layout';
import { useAuth } from './context/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) return <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>Cargando...</div>;
    if (!user) return <Navigate to="/login" />;

    if (user.require_password_change) {
        return <Navigate to="/change-password" />;
    }

    return <Layout>{children}</Layout>;
};

const ProtectedRouteNoLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) return <div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>Cargando...</div>;
    if (!user) return <Navigate to="/login" />;
    return <>{children}</>;
};

export const Home: React.FC = () => {
    const { user } = useAuth();
    if (user?.rol === 'CHOFER') {
        return <Navigate to="/chofer" replace />;
    }
    return <Dashboard />;
};

export const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<PortalCliente />} />
            <Route path="/login" element={<Login />} />
            <Route path="/change-password" element={
                <ProtectedRouteNoLayout>
                    <ChangePassword />
                </ProtectedRouteNoLayout>
            } />
            <Route path="/admin" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/nueva-solicitud" element={<ProtectedRoute><NuevaSolicitud /></ProtectedRoute>} />
            <Route path="/historial" element={<ProtectedRoute><Historial /></ProtectedRoute>} />
            <Route path="/frecuentes" element={<ProtectedRoute><Frecuentes /></ProtectedRoute>} />
            <Route path="/individuales" element={<ProtectedRoute><Individuales /></ProtectedRoute>} />
            <Route path="/balances" element={<ProtectedRoute><Balances /></ProtectedRoute>} />
            <Route path="/chofer" element={<ProtectedRoute><ChoferPanel /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
            <Route path="/choferes" element={<ProtectedRoute><Choferes /></ProtectedRoute>} />
            <Route path="/rutas-operativas" element={<ProtectedRoute><HojasDeRuta /></ProtectedRoute>} />
            <Route path="/zonas" element={<ProtectedRoute><Zonas /></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};
