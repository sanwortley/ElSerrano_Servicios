import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu, X, Home } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background-dark)' }}>
            {/* Mobile Header */}
            <header className="show-on-mobile" style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: 'var(--mobile-header-height)',
                backgroundColor: 'black',
                borderBottom: '1px solid #222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1rem',
                zIndex: 1000
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button 
                        onClick={() => window.location.href = '/'}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                        <Home size={18} />
                    </button>
                    <span style={{ fontFamily: 'Anton', fontSize: '1.2rem', color: 'white' }}>EL SERRANO</span>
                </div>
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            
            <main style={{
                marginLeft: 'var(--sidebar-width)',
                padding: '2.5rem',
                paddingTop: 'calc(2.5rem + var(--mobile-header-height))',
                width: 'calc(100% - var(--sidebar-width))',
                minHeight: '100vh',
                position: 'relative',
                transition: 'margin-left 0.3s ease',
                maxWidth: '100vw'
            }} className="mobile-full-width mobile-padding-sm">
                {children}
            </main>

            {/* Backdrop for mobile */}
            {isSidebarOpen && (
                <div 
                    onClick={() => setIsSidebarOpen(false)}
                    className="show-on-mobile"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        zIndex: 900
                    }}
                />
            )}
        </div>
    );
};
