import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Home } from 'lucide-react';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const response = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            await login(response.data.access_token);

            if (response.data.require_password_change) {
                navigate('/change-password');
            } else {
                navigate('/admin');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            if (!err.response) {
                setError('No se pudo conectar con el servidor. Verifique que el backend esté ejecutándose.');
            } else if (err.response.status === 401) {
                setError('Credenciales inválidas. Intente nuevamente.');
            } else if (err.response.status === 429) {
                setError('ACCESO BLOQUEADO POR SEGURIDAD. INTENTE EN 5 MINUTOS.');
            } else {
                setError('Error en el servidor. Intente más tarde.');
            }
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '1rem',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'var(--background-dark)'
        }}>
            {/* Back to Home Button */}
            <button
                onClick={() => navigate('/')}
                style={{
                    position: 'absolute',
                    top: '2rem',
                    left: '2rem',
                    background: '#111',
                    border: '1px solid #333',
                    color: 'var(--text-muted)',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.borderColor = '#333';
                }}
            >
                <Home size={20} />
            </button>

            {/* Background Decorations */}
            <div className="hide-on-mobile" style={{ position: 'absolute', top: '-10%', right: '-5%', fontSize: '20rem', fontFamily: 'Anton', opacity: 0.03, color: 'white', pointerEvents: 'none' }}>
                SERRANO
            </div>
            <div className="hide-on-mobile" style={{ position: 'absolute', bottom: '0', left: '0', fontSize: '15rem', fontFamily: 'Anton', opacity: 0.03, color: 'var(--primary-color)', pointerEvents: 'none' }}>
                V2.0
            </div>

            <div className="card card-instagram mobile-full-width" style={{ 
                width: '100%', 
                maxWidth: '450px', 
                padding: '2rem 1.5rem', 
                backgroundColor: '#000', 
                border: '1px solid #333' 
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h1 className="heading-brand" style={{ fontSize: '2.5rem', color: 'white', lineHeight: 0.9, margin: 0 }}>
                        EL SERRANO
                    </h1>
                    <h1 className="heading-brand" style={{ fontSize: '2.5rem', color: 'var(--primary-color)', lineHeight: 0.9, margin: 0 }}>
                        SERVICIOS
                    </h1>
                </div>

                {error && (
                    <div className="badge badge-danger" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.25rem', borderRadius: '4px', textAlign: 'center', fontSize: '0.8rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label" style={{ color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Identificación (Email)</label>
                        <input
                            type="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="SU@EMAIL.COM"
                            required
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                        <label className="form-label" style={{ color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem' }}>Clave de Acceso</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" style={{ fontSize: '1rem', padding: '1rem' }}>
                        ENTRAR AL SISTEMA
                    </button>
                </form>

                <p className="heading-brand" style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                    A SU SERVICIO... SIEMPRE
                </p>
            </div>
        </div>
    );
};
