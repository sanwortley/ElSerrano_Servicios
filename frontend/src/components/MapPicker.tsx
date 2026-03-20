
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { X, Check } from 'lucide-react';

// Fix for default marker icons in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
    initialLat?: number | null;
    initialLng?: number | null;
    onSelect: (lat: number, lng: number) => void;
    onClose: () => void;
    zones?: any[];
}

export const MapPicker: React.FC<MapPickerProps> = ({ initialLat, initialLng, onSelect, onClose, zones }) => {
    const [position, setPosition] = useState<[number, number] | null>(
        initialLat && initialLng ? [initialLat, initialLng] : [-31.9774, -64.5714] // Default center (VGB area)
    );

    const LocationMarker = () => {
        useMapEvents({
            click(e) {
                setPosition([e.latlng.lat, e.latlng.lng]);
            },
        });

        return position === null ? null : (
            <Marker position={position}></Marker>
        );
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div className="card card-instagram" style={{
                width: '100%', maxWidth: '900px', height: '80vh', display: 'flex',
                flexDirection: 'column', background: '#000', border: '2px solid white', padding: 0
            }}>
                <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
                    <h3 className="heading-brand" style={{ margin: 0, color: 'white' }}>SELECCIONAR UBICACIÓN</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ flex: 1, position: 'relative' }}>
                    <MapContainer
                        center={position || [-31.9774, -64.5714]}
                        zoom={14}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker />
                        {zones && zones.map(z => {
                            try {
                                const geojson = JSON.parse(z.polygon_geojson);
                                return (
                                    <GeoJSON 
                                        key={z.id} 
                                        data={geojson} 
                                        style={{ 
                                            color: '#10b981', 
                                            fillColor: '#10b981', 
                                            fillOpacity: 0.15, 
                                            weight: 2 
                                        }} 
                                    />
                                );
                            } catch (e) {
                                return null;
                            }
                        })}
                    </MapContainer>
                </div>

                <div style={{ padding: '1.5rem', background: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: 'white', fontSize: '0.8rem' }}>
                        {position ? (
                            <span>Coordenadas: {position[0].toFixed(5)}, {position[1].toFixed(5)}</span>
                        ) : (
                            <span>Haz clic en el mapa para ubicar el punto</span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn" style={{ background: '#333', color: 'white' }} onClick={onClose}>CANCELAR</button>
                        <button
                            className="btn btn-primary"
                            disabled={!position}
                            onClick={() => position && onSelect(position[0], position[1])}
                        >
                            <Check size={18} /> CONFIRMAR PUNTO
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
