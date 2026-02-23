import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Lock, Save, ShieldCheck } from 'lucide-react';

export const ChangePassword: React.FC = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/change-password', { new_password: newPassword });
            alert('¡Contraseña actualizada con éxito! Por favor, ingrese nuevamente.');
            logout();
            navigate('/login');
        } catch (err) {
            console.error(err);
            setError('Error al actualizar la contraseña. Intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            padding: '1rem',
            backgroundColor: 'var(--background-dark)'
        }}>
            <div className="card card-instagram" style={{ width: '100%', maxWidth: '450px', padding: '3rem', backgroundColor: '#000', border: '1px solid #333' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'rgba(255, 84, 0, 0.1)', borderRadius: '50%', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
                        <ShieldCheck size={48} />
                    </div>
                    <h1 className="heading-brand" style={{ fontSize: '2.2rem', color: 'white', lineHeight: 1, margin: 0, marginBottom: '0.5rem' }}>
                        CAMBIO OBLIGATORIO
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Por seguridad, debés actualizar tu clave de acceso.
                    </p>
                </div>

                {error && (
                    <div className="badge badge-danger" style={{ width: '100%', padding: '1rem', marginBottom: '1.5rem', borderRadius: '4px', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">NUEVA CONTRASEÑA</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                className="form-control"
                                style={{ paddingLeft: '3rem' }}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="MÍNIMO 6 CARACTERES"
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label className="form-label">CONFIRMAR CONTRASEÑA</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'var(--text-muted)' }} />
                            <input
                                type="password"
                                className="form-control"
                                style={{ paddingLeft: '3rem' }}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="REPITA LA CLAVE"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={loading}
                        style={{ fontSize: '1.1rem', padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
                    >
                        {loading ? 'GUARDANDO...' : (
                            <>
                                <Save size={20} /> ACTUALIZAR Y CONTINUAR
                            </>
                        )}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <button
                        onClick={() => logout()}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Salir sin cambiar
                    </button>
                </div>
            </div>
        </div>
    );
};
