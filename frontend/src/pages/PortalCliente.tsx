import React, { useState } from 'react';
import { Truck, Droplets, Trash2, Send, Phone, Mountain, Home, Hammer, Lock, Menu, X, Mail, Instagram } from 'lucide-react';
import api from '../api/axios';

const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
    </svg>
);

export const PortalCliente: React.FC = () => {
    const [phoneSearch, setPhoneSearch] = useState('');
    const [trackingResults, setTrackingResults] = useState<any[]>([]);
    const [isTracking, setIsTracking] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            <nav style={{ 
                padding: '1rem 1.5rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                backgroundColor: 'rgba(0,0,0,0.9)', 
                borderBottom: '1px solid var(--border-dark)', 
                backdropFilter: 'blur(10px)', 
                position: 'sticky', 
                top: 0, 
                zIndex: 100 
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Truck size={28} color="var(--primary-color)" />
                    <span style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '0.05em', color: '#fff', fontFamily: 'Anton' }}>EL SERRANO</span>
                </div>
                
                {/* Desktop Menu */}
                <div className="hide-on-mobile" style={{ display: 'flex', gap: '2rem', fontWeight: 600, fontSize: '0.9rem' }}>
                    <a href="#servicios" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>SERVICIOS</a>
                    <a href="#seguimiento" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>SEGUIMIENTO</a>
                    <a href="#presupuesto" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>SOLICITAR PRESUPUESTO</a>
                </div>

                {/* Mobile Menu Toggle */}
                <button 
                    className="show-on-mobile"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    style={{ background: 'none', border: 'none', color: 'white' }}
                >
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>

                {/* Mobile Dropdown */}
                {isMenuOpen && (
                    <div className="show-on-mobile" style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'black',
                        padding: '2rem 1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2rem',
                        borderBottom: '1px solid var(--border-dark)',
                        zIndex: 1000
                    }}>
                        <a href="#servicios" onClick={() => setIsMenuOpen(false)} style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '1.2rem', display: 'block' }}>SERVICIOS</a>
                        <a href="#seguimiento" onClick={() => setIsMenuOpen(false)} style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '1.2rem', display: 'block' }}>SEGUIMIENTO</a>
                        <a href="#presupuesto" onClick={() => setIsMenuOpen(false)} style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 700, fontSize: '1.2rem', display: 'block' }}>SOLICITAR PRESUPUESTO</a>
                    </div>
                )}
            </nav>

            {/* Hero */}
            <header className="mobile-padding-sm" style={{
                padding: '6rem 1rem',
                textAlign: 'center',
                background: 'radial-gradient(circle at center, #222 0%, var(--background-dark) 100%)',
                borderBottom: '1px solid var(--border-dark)'
            }}>
                <h1 style={{ marginBottom: '1.5rem', color: '#fff', lineHeight: 1.1, fontFamily: 'Anton' }}>
                    Soluciones de <span style={{ color: 'var(--primary-color)' }}>Logística</span> <br /> que impulsan tu obra.
                </h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '700px', margin: '0 auto 2.5rem' }}>
                    Líderes en alquiler de volquetes, áridos y servicios de saneamiento en toda la región. Rapidez, confianza y profesionalismo en cada entrega.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <a href="#presupuesto" className="btn btn-primary" style={{ padding: '1rem 1.5rem', fontSize: '1rem' }}>EMPEZAR AHORA</a>
                    <a href="#servicios" className="btn" style={{ border: '2px solid #fff', color: '#fff', padding: '1rem 1.5rem' }}>VER SERVICIOS</a>
                </div>
            </header>

            {/* Tracking Section */}
            <section id="seguimiento" style={{ padding: '5rem 1rem', backgroundColor: '#0a0a0a' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,84,0,0.1)', color: 'var(--primary-color)', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '1.2rem' }}>
                        <Send size={16} /> SEGUIMIENTO EN VIVO
                    </div>
                    <h2 style={{ marginBottom: '1rem', fontFamily: 'Anton' }}>¿Dónde está mi pedido?</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Ingresa tu número de teléfono para ver el estado de tus servicios activos.</p>

                    <div className="mobile-stack" style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem' }}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Tu teléfono (ej: 3546...)"
                            style={{ height: '3.5rem', fontSize: '1rem', backgroundColor: '#111', color: '#fff' }}
                            value={phoneSearch}
                            onChange={(e) => setPhoneSearch(e.target.value)}
                        />
                        <button
                            className="btn btn-primary"
                            style={{ minWidth: '150px', height: '3.5rem' }}
                            onClick={handleTrack}
                            disabled={isTracking}
                        >
                            {isTracking ? 'BUSCANDO...' : 'CONSULTAR'}
                        </button>
                    </div>

                    {trackingResults.length > 0 ? (
                        <div style={{ textAlign: 'left', border: '1px solid var(--border-dark)', borderRadius: '8px', background: 'var(--surface-dark)', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                            {trackingResults.map((p, i) => (
                                <div key={p.id} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderBottom: i === trackingResults.length - 1 ? 'none' : '1px solid var(--border-dark)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>{p.servicio}</div>
                                        <div style={{
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            backgroundColor: p.estado === 'COMPLETADA' ? 'rgba(16,185,129,0.1)' : 'rgba(255,84,0,0.1)',
                                            color: p.estado === 'COMPLETADA' ? '#10b981' : 'var(--primary-color)',
                                            border: '1px solid currentColor'
                                        }}>
                                            {p.estado}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Destino: {p.direccion} • {new Date(p.fecha).toLocaleDateString()}</div>
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
            <section id="servicios" style={{ padding: '5rem 1rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontFamily: 'Anton' }}>Nuestros Servicios</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {[
                            { icon: Droplets, title: 'Desagotes y Destapes', desc: 'Desagotes de pozos, cámaras, sangrías, etc. Destape de cañerías.' },
                            { icon: Truck, title: 'Volquetes', desc: 'Volquetes grandes y chicos para obras y limpieza.' },
                            { icon: Home, title: 'Obradores y Casillas', desc: 'Obradores para obras, casillas de vigilancia, habitables y boleterías.' },
                            { icon: Trash2, title: 'Baños Químicos', desc: 'Alquiler de baños químicos para eventos y obras.' },
                            { icon: Hammer, title: 'Movimiento de Suelo', desc: 'Nivelación, excavación de piletas y limpieza de terrenos.' },
                            { icon: Mountain, title: 'Venta de Áridos', desc: 'Envíos de áridos, granzas, escombros y materiales.' },
                        ].map((s, idx) => (
                            <div key={idx} className="card card-instagram" style={{ padding: '2rem', transition: 'all 0.3s ease', cursor: 'default', backgroundColor: 'var(--surface-dark)' }}>
                                <div style={{ color: 'var(--primary-color)', marginBottom: '1.2rem' }}>
                                    <s.icon size={40} />
                                </div>
                                <h3 style={{ fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.8rem', color: '#fff', fontFamily: 'Anton' }}>{s.title}</h3>
                                <p style={{ color: 'var(--text-muted)', lineHeight: 1.5, fontSize: '1rem' }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quote Form */}
            <section id="presupuesto" style={{ padding: '5rem 1rem', background: '#111', borderTop: '1px solid var(--border-dark)' }}>
                <div className="mobile-stack" style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '3rem', alignItems: 'start' }}>
                    <div>
                        <h2 style={{ marginBottom: '1.2rem', lineHeight: 1, fontFamily: 'Anton' }}>Solicitá tu <br /><span style={{ color: 'var(--primary-color)' }}>Presupuesto</span></h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2.5rem' }}>Completa el formulario y un asesor se contactará con vos en menos de una hora.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            {/* WhatsApp / Celular */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <a 
                                    href="https://wa.me/5493546403242" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '45px', height: '45px', borderRadius: '10px', textDecoration: 'none', transition: 'all 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <WhatsAppIcon />
                                </a>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WhatsApp / Celular</div>
                                    <a href="tel:3546403242" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.95rem' }}>3546-403242</a>
                                </div>
                            </div>

                            {/* Teléfono Fijo */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <a 
                                    href="tel:03546421937" 
                                    style={{ background: 'rgba(255, 84, 0, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '45px', height: '45px', borderRadius: '10px', textDecoration: 'none', transition: 'all 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <Phone size={22} />
                                </a>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teléfono Fijo</div>
                                    <a href="tel:03546421937" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.95rem' }}>03546-421937</a>
                                </div>
                            </div>

                            {/* Email */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <a 
                                    href="mailto:elserranoservicios@gmail.com" 
                                    style={{ background: 'rgba(255, 84, 0, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '45px', height: '45px', borderRadius: '10px', textDecoration: 'none', transition: 'all 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <Mail size={22} />
                                </a>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
                                    <a href="mailto:elserranoservicios@gmail.com" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.95rem' }}>elserranoservicios@gmail.com</a>
                                </div>
                            </div>

                            {/* Instagram */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <a 
                                    href="https://instagram.com/elserranoservicioss" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ background: 'rgba(255, 84, 0, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '45px', height: '45px', borderRadius: '10px', textDecoration: 'none', transition: 'all 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <Instagram size={22} />
                                </a>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Instagram</div>
                                    <a href="https://instagram.com/elserranoservicioss" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.95rem' }}>@elserranoservicioss</a>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="mobile-padding-sm" style={{ background: 'var(--surface-dark)', padding: '2.5rem', borderRadius: '0px', border: '2px solid white', boxShadow: '10px 10px 0px rgba(0,0,0,0.5)' }}>
                        {quoteSent ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                                <div style={{ color: 'var(--success-color)', marginBottom: '1rem' }}><Send size={48} /></div>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Anton', color: '#fff' }}>¡Mensaje Enviado!</h3>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Nos pondremos en contacto a la brevedad.</p>
                                <button className="btn" style={{ border: '2px solid #fff', color: '#fff' }} onClick={() => setQuoteSent(false)}>Enviar otro mensaje</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSendQuote} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div className="form-group">
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block', letterSpacing: '0.05em' }}>NOMBRE COMPLETO</label>
                                    <input type="text" className="form-control" value={quoteData.nombre} onChange={e => setQuoteData({ ...quoteData, nombre: e.target.value })} required style={{ backgroundColor: '#000', color: '#fff' }} />
                                </div>
                                <div className="mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
                                    <div className="form-group">
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>TELÉFONO</label>
                                        <input type="text" className="form-control" value={quoteData.telefono} onChange={e => setQuoteData({ ...quoteData, telefono: e.target.value })} required style={{ backgroundColor: '#000', color: '#fff' }} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>DIRECCIÓN</label>
                                        <input type="text" className="form-control" value={quoteData.direccion} onChange={e => setQuoteData({ ...quoteData, direccion: e.target.value })} required style={{ backgroundColor: '#000', color: '#fff' }} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>SERVICIO DE INTERÉS</label>
                                    <select className="form-control" value={quoteData.tipo_servicio} onChange={e => setQuoteData({ ...quoteData, tipo_servicio: e.target.value })} style={{ backgroundColor: '#000', color: '#fff' }}>
                                        <option>Volquetes (Grandes y Chicos)</option>
                                        <option>Desagotes (Pozos, Cámaras, Sangrías)</option>
                                        <option>Destape de Cañerías</option>
                                        <option>Alquiler de Obradores y Casillas</option>
                                        <option>Alquiler de Baños Químicos</option>
                                        <option>Movimiento de Suelo / Cavado de Piletas</option>
                                        <option>Venta de Áridos (Granza, Escombro)</option>
                                        <option>Otros</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>DETALLES ADICIONALES</label>
                                    <textarea className="form-control" rows={4} value={quoteData.descripcion} onChange={e => setQuoteData({ ...quoteData, descripcion: e.target.value })} style={{ backgroundColor: '#000', color: '#fff', resize: 'none' }}></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ padding: '1rem', fontWeight: 900, borderRadius: 0 }}>ENVIAR SOLICITUD <Send size={20} /></button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '3rem 1rem', textAlign: 'center', backgroundColor: '#000', borderTop: '1px solid var(--border-dark)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>© 2026 El Serrano Servicios. Siempre a su servicio.</p>
                <a
                    href="/login"
                    style={{
                        color: '#666',
                        textDecoration: 'none',
                        fontSize: '0.7rem',
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
