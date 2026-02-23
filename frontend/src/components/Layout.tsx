import React from 'react';
import { Sidebar } from './Sidebar';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main style={{
                marginLeft: 'var(--sidebar-width)',
                padding: '2.5rem',
                width: 'calc(100% - var(--sidebar-width))',
                minHeight: '100vh',
                position: 'relative'
            }}>
                {children}
            </main>
        </div>
    );
};
