import React, { useState } from 'react';
import { X, DollarSign } from 'lucide-react';
import api from '../api/axios';

interface PaymentModalProps {
    pedidoId: number;
    montoSugerido: number;
    clienteNombre: string;
    onClose: () => void;
    onSuccess: () => void;
    metodoSugerido?: string;
    observaciones?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ pedidoId, montoSugerido, clienteNombre, onClose, onSuccess, metodoSugerido, observaciones }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        monto: montoSugerido,
        metodo_pago: metodoSugerido || 'EFECTIVO'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post(`/pedidos/${pedidoId}/pagos`, formData);
            alert('Pago registrado con éxito. El pedido ha sido completado.');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.detail || 'Error al registrar el pago');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
            <div className="card card-instagram" style={{ width: '100%', maxWidth: '500px', backgroundColor: '#000', border: '1px solid #333', padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h3 className="heading-brand" style={{ fontSize: '1.8rem', color: 'white', margin: 0 }}>REGISTRAR PAGO</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255, 84, 0, 0.05)', borderRadius: '4px', border: '1px solid #222' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 800, margin: '0 0 0.25rem 0' }}>CLIENTE</p>
                    <p style={{ margin: 0, color: 'white', fontWeight: 700, fontSize: '1.2rem' }}>{clienteNombre.toUpperCase()}</p>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>PEDIDO #{pedidoId}</p>
                    {observaciones && (
                        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#111', borderRadius: '4px', borderLeft: '4px solid var(--primary-color)' }}>
                            <p style={{ fontSize: '0.6rem', color: 'var(--primary-color)', fontWeight: 800, margin: '0 0 0.25rem 0' }}>AVISO DEL CHOFER</p>
                            <p style={{ margin: 0, color: 'white', fontSize: '0.8rem', fontStyle: 'italic' }}>"{observaciones}"</p>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">MONTO A COBRAR</label>
                        <div style={{ position: 'relative' }}>
                            <DollarSign size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color)' }} />
                            <input
                                type="number"
                                className="form-control"
                                style={{ paddingLeft: '2.5rem' }}
                                value={formData.monto}
                                onChange={e => setFormData({ ...formData, monto: Number(e.target.value) })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                        <label className="form-label">MÉTODO DE PAGO</label>
                        <select
                            className="form-control"
                            value={formData.metodo_pago}
                            onChange={e => setFormData({ ...formData, metodo_pago: e.target.value })}
                            required
                        >
                            <option value="EFECTIVO">EFECTIVO</option>
                            <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                            <option value="TARJETA">TARJETA</option>
                            <option value="MERCADO_PAGO">MERCADO PAGO</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <button type="button" className="btn" style={{ background: '#111', color: 'white', border: '1px solid #222' }} onClick={onClose}>CANCELAR</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'PROCESANDO...' : 'CONFIRMAR PAGO'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
