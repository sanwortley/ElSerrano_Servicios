import React, { useState } from 'react';
import { Truck, Droplets, Trash2, Send, Phone, MapPin, Mountain, Home, Hammer, Lock } from 'lucide-react';
import api from '../api/axios';

export const PortalCliente: React.FC = () => {
    const [phoneSearch, setPhoneSearch] = useState('');
    const [trackingResults, setTrackingResults] = useState<any[]>([]);
    const [isTracking, setIsTracking] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const [quoteData, setQuoteData] = useState({
        nombre: '',
        telefono: '',
        direccion: '',
        tipo_servicio: 'Volquetes y contenedores para obra',
        descripcion: ''
    });
    const [quoteSent, setQuoteSent] = useState(false);

    const handleTrack = async () => {
        if (!phoneSearch) return;
        setIsTracking(true);
        try {
            const res = await api.get(`/public/track/${phoneSearch}`);
            setTrackingResults(res.data);
            setHasSearched(true);
        } catch (err) {
            console.error(err);
        } finally {
            setIsTracking(false);
        }
    };

    const handleSendQuote = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/public/quote', quoteData);
            setQuoteSent(true);
            setQuoteData({ nombre: '', telefono: '', direccion: '', tipo_servicio: 'Volquetes y contenedores para obra', descripcion: '' });
        } catch (err) {
            alert("Error al enviar presupuesto");
        }
    };

    return (
        <div style={{ backgroundColor: 'var(--background-dark)', minHeight: '100vh', color: 'var(--text-white)', fontFamily: 'Inter, sans-serif' }}>
            {/* Nav */}
            <nav style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', borderBottom: '1px solid var(--border-dark)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Truck size={32} color="var(--primary-color)" />
                    <span style={{ fontWeight: 900, fontSize: '1.5rem', letterSpacing: '0.05em', color: '#fff', fontFamily: 'Anton' }}>EL SERRANO</span>
                </div>
                <div style={{ display: 'flex', gap: '2rem', fontWeight: 600, fontSize: '0.9rem' }}>
                    <a href="#servicios" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>SERVICIOS</a>
                    <a href="#seguimiento" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>SEGUIMIENTO</a>
                    <a href="#presupuesto" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>SOLICITAR PRESUPUESTO</a>
                </div>
            </nav>

            {/* Hero */}
            <header style={{
                padding: '8rem 2rem',
                textAlign: 'center',
                background: 'radial-gradient(circle at center, #222 0%, var(--background-dark) 100%)',
                borderBottom: '1px solid var(--border-dark)'
            }}>
                <h1 style={{ fontSize: '4.5rem', fontWeight: 900, marginBottom: '1.5rem', color: '#fff', lineHeight: 1, fontFamily: 'Anton' }}>
                    Soluciones de <span style={{ color: 'var(--primary-color)' }}>Logística</span> <br /> que impulsan tu obra.
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto 3rem' }}>
                    Líderes en alquiler de volquetes, áridos y servicios de saneamiento en toda la región. Rapidez, confianza y profesionalismo en cada entrega.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <a href="#presupuesto" className="btn btn-primary" style={{ padding: '1.2rem 2.5rem', fontSize: '1.1rem' }}>EMPEZAR AHORA</a>
                    <a href="#servicios" className="btn" style={{ border: '2px solid #fff', color: '#fff', padding: '1.2rem 2.5rem' }}>VER SERVICIOS</a>
                </div>
            </header>

            {/* Tracking Section */}
            <section id="seguimiento" style={{ padding: '7rem 2rem', backgroundColor: '#0a0a0a' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,84,0,0.1)', color: 'var(--primary-color)', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                        <Send size={16} /> SEGUIMIENTO EN VIVO
                    </div>
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', fontFamily: 'Anton' }}>¿Dónde está mi pedido?</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Ingresa tu número de teléfono para ver el estado de tus servicios activos.</p>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '3rem' }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Tu teléfono (ej: 351...)"
                            style={{ height: '3.5rem', fontSize: '1.1rem', backgroundColor: '#111', color: '#fff' }}
                            value={phoneSearch}
                            onChange={(e) => setPhoneSearch(e.target.value)}
                        />
                        <button
                            className="btn btn-primary"
                            style={{ width: '150px' }}
                            onClick={handleTrack}
                            disabled={isTracking}
                        >
                            {isTracking ? 'BUSCANDO...' : 'CONSULTAR'}
                        </button>
                    </div>

                    {trackingResults.length > 0 ? (
                        <div style={{ textAlign: 'left', border: '1px solid var(--border-dark)', borderRadius: '12px', background: 'var(--surface-dark)', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                            {trackingResults.map((p, i) => (
                                <div key={p.id} style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: i === trackingResults.length - 1 ? 'none' : '1px solid var(--border-dark)' }}>
                                    <div>
                                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>{p.servicio}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Destino: {p.direccion} • {new Date(p.fecha).toLocaleDateString()}</div>
                                    </div>
                                    <div style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        backgroundColor: p.estado === 'COMPLETADA' ? 'rgba(16,185,129,0.1)' : 'rgba(255,84,0,0.1)',
                                        color: p.estado === 'COMPLETADA' ? '#10b981' : 'var(--primary-color)',
                                        border: '1px solid currentColor'
                                    }}>
                                        {p.estado}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : hasSearched && !isTracking ? (
                        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>No se encontraron servicios activos para este número.</p>
                    ) : (
                        <p style={{ color: 'var(--text-muted)' }}>Ingrese su número para consultar servicios activos.</p>
                    )}
                </div>
            </section>

            {/* Services Grid */}
            <section id="servicios" style={{ padding: '7rem 2rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, textAlign: 'center', marginBottom: '4rem', fontFamily: 'Anton' }}>Nuestros Servicios</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                        {[
                            { icon: Droplets, title: 'Desagotes y Destapes', desc: 'Desagotes y destapes de cañerías con equipos de alta potencia.' },
                            { icon: Hammer, title: 'Movimiento de Suelo', desc: 'Nivelación, excavación y limpieza de terrenos.' },
                            { icon: Mountain, title: 'Venta de Áridos', desc: 'Piedras, arena, rellenos y materiales para la construcción.' },
                            { icon: Truck, title: 'Volquetes', desc: 'Volquetes y contenedores para obra de diversos tamaños.' },
                            { icon: Home, title: 'Obradores', desc: 'Alquiler de módulos habitacionales y obradores móviles.' },
                            { icon: Trash2, title: 'Baños Químicos', desc: 'Alquiler de baños químicos para obras y eventos.' },
                        ].map((s, idx) => (
                            <div key={idx} className="card card-instagram" style={{ padding: '3rem', transition: 'all 0.3s ease', cursor: 'default', backgroundColor: 'var(--surface-dark)' }}>
                                <div style={{ color: 'var(--primary-color)', marginBottom: '1.5rem' }}>
                                    <s.icon size={48} />
                                </div>
                                <h3 style={{ fontWeight: 800, fontSize: '1.8rem', marginBottom: '1rem', color: '#fff', fontFamily: 'Anton' }}>{s.title}</h3>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '1.05rem' }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quote Form */}
            <section id="presupuesto" style={{ padding: '7rem 2rem', background: '#111', borderTop: '1px solid var(--border-dark)' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.5fr', gap: '5rem', alignItems: 'start' }}>
                    <div>
                        <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '1.5rem', lineHeight: 1, fontFamily: 'Anton' }}>Solicitá tu <br /><span style={{ color: 'var(--primary-color)' }}>Presupuesto</span></h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '3rem' }}>Completa el formulario y un asesor se contactará con vos en menos de una hora.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ background: 'rgba(255,84,0,0.1)', padding: '1rem', borderRadius: '12px' }}>
                                    <Phone size={28} color="var(--primary-color)" />
                                </div>
                                <div><div style={{ fontWeight: 800, color: '#fff' }}>Llamanos</div><div style={{ color: 'var(--text-muted)' }}>351 755-2167</div></div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ background: 'rgba(255,84,0,0.1)', padding: '1rem', borderRadius: '12px' }}>
                                    <MapPin size={28} color="var(--primary-color)" />
                                </div>
                                <div><div style={{ fontWeight: 800, color: '#fff' }}>Ubicación</div><div style={{ color: 'var(--text-muted)' }}>Córdoba Capital y Alrededores</div></div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: 'var(--surface-dark)', padding: '3.5rem', borderRadius: '0px', border: '2px solid white', boxShadow: '10px 10px 0px rgba(0,0,0,0.5)' }}>
                        {quoteSent ? (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <div style={{ color: 'var(--success-color)', marginBottom: '1.5rem' }}><Send size={64} /></div>
                                <h3 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Anton', color: '#fff' }}>¡Mensaje Enviado!</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Nos pondremos en contacto a la brevedad.</p>
                                <button className="btn" style={{ border: '2px solid #fff', color: '#fff' }} onClick={() => setQuoteSent(false)}>Enviar otro mensaje</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSendQuote} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block', letterSpacing: '0.05em' }}>NOMBRE COMPLETO</label>
                                    <input type="text" className="form-control" value={quoteData.nombre} onChange={e => setQuoteData({ ...quoteData, nombre: e.target.value })} required style={{ backgroundColor: '#000', color: '#fff' }} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div className="form-group">
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block' }}>TELÉFONO</label>
                                        <input type="text" className="form-control" value={quoteData.telefono} onChange={e => setQuoteData({ ...quoteData, telefono: e.target.value })} required style={{ backgroundColor: '#000', color: '#fff' }} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block' }}>DIRECCIÓN</label>
                                        <input type="text" className="form-control" value={quoteData.direccion} onChange={e => setQuoteData({ ...quoteData, direccion: e.target.value })} required style={{ backgroundColor: '#000', color: '#fff' }} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block' }}>SERVICIO DE INTERÉS</label>
                                    <select className="form-control" value={quoteData.tipo_servicio} onChange={e => setQuoteData({ ...quoteData, tipo_servicio: e.target.value })} style={{ backgroundColor: '#000', color: '#fff' }}>
                                        <option>Volquetes y contenedores para obra</option>
                                        <option>Desagotes y destapes de cañerías</option>
                                        <option>Movimiento de suelo</option>
                                        <option>Venta de áridos, piedras y rellenos</option>
                                        <option>Alquiler de obradores</option>
                                        <option>Alquiler de baños químicos</option>
                                        <option>Otros</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.6rem', display: 'block' }}>DETALLES ADICIONALES</label>
                                    <textarea className="form-control" rows={4} value={quoteData.descripcion} onChange={e => setQuoteData({ ...quoteData, descripcion: e.target.value })} style={{ backgroundColor: '#000', color: '#fff', resize: 'none' }}></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ padding: '1.2rem', fontWeight: 900, borderRadius: 0 }}>ENVIAR SOLICITUD <Send size={20} /></button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#000', borderTop: '1px solid var(--border-dark)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>© 2026 El Serrano Servicios. Siempre a su servicio.</p>
                <a
                    href="/login"
                    style={{
                        color: '#666',
                        textDecoration: 'none',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        border: '1px solid #222',
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        transition: 'all 0.2s'
                    }}
                >
                    <Lock size={12} /> Acceso Administrativo
                </a>
            </footer>
        </div>
    );
};
