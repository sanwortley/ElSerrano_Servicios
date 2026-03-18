import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export interface RouteMapItem {
    id: number | string;
    lat: number | null;
    lng: number | null;
    cliente: string;
    direccion: string;
    tipo?: string;
}

interface RouteMapProps {
    items: RouteMapItem[];
    height?: string;
}

// Component to handle map bounds adaptation
const ChangeView: React.FC<{ items: RouteMapItem[] }> = ({ items }) => {
    const map = useMap();

    useEffect(() => {
        const validCoords = items.filter(it => it.lat !== null && it.lng !== null);
        if (validCoords.length === 0) return;

        const bounds = L.latLngBounds(validCoords.map(it => [it.lat!, it.lng!]));
        map.fitBounds(bounds, { padding: [50, 50] });
    }, [items, map]);

    return null;
};

export const RouteMap: React.FC<RouteMapProps> = ({ items, height = '400px' }) => {
    const validItems = items.filter(it => it.lat !== null && it.lng !== null);
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

    // Coordenadas de salida de los camiones (Base)
    const BASE_LOCATION: [number, number] = [-32.079573, -64.530513];
    
    // Fallback de líneas rectas
    const straightLines: [number, number][] = [
        BASE_LOCATION,
        ...validItems.map(it => [it.lat!, it.lng!] as [number, number])
    ];

    useEffect(() => {
        if (validItems.length === 0) {
            setRouteCoords([]);
            return;
        }

        const fetchRoute = async () => {
            try {
                // OSRM format: lon,lat
                const waypoints = [
                    `${BASE_LOCATION[1]},${BASE_LOCATION[0]}`, // Base
                    ...validItems.map(it => `${it.lng},${it.lat}`)
                ].join(';');

                // Usamos HTTPS para evitar bloqueos por contenido mixto
                const url = `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.routes && data.routes.length > 0) {
                    const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
                    setRouteCoords(coords);
                } else {
                    setRouteCoords([]);
                }
            } catch (err) {
                console.error("Error fetching OSRM route:", err);
                setRouteCoords([]); // Fallback
            }
        };

        fetchRoute();
    }, [items]); // Corre cuando cambian los ítems (reordenamiento)

    const createNumberedIcon = (number: number) => {
        return L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="
                background-color: var(--primary-color, #FF5400); 
                color: white; 
                border-radius: 50%; 
                width: 30px; 
                height: 30px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-weight: bold; 
                font-family: 'Anton', sans-serif;
                border: 2px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.5);
            ">${number}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
    };

    const createBaseIcon = () => {
        return L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="
                background-color: #000; 
                color: white; 
                border-radius: 4px; 
                width: 32px; 
                height: 32px; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 1.1rem;
                border: 2px solid var(--primary-color, #FF5400);
                box-shadow: 0 2px 5px rgba(0,0,0,0.5);
            ">🚚</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
    };

    return (
        <div style={{ height, width: '100%', borderRadius: '4px', overflow: 'hidden', border: '1px solid #222' }}>
            <MapContainer
                center={BASE_LOCATION}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Marker para la Base/Salida */}
                <Marker 
                    position={BASE_LOCATION}
                    icon={createBaseIcon()}
                >
                    <Popup>
                        <div style={{ color: '#000' }}>
                            <strong style={{ textTransform: 'uppercase', color: 'var(--primary-color)' }}>BASE</strong>
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', fontWeight: 600 }}>PUNTO DE SALIDAS</p>
                        </div>
                    </Popup>
                </Marker>

                {validItems.map((item, index) => (
                    <Marker 
                        key={`${item.id}-${index}`} 
                        position={[item.lat!, item.lng!]}
                        icon={createNumberedIcon(index + 1)}
                    >
                        <Popup>
                            <div style={{ color: '#000' }}>
                                <strong style={{ textTransform: 'uppercase' }}>{item.cliente}</strong>
                                <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem' }}>{item.direccion}</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Renderizar ruta real si está disponible, de lo contrario fallback de líneas rectas */}
                {routeCoords.length > 1 ? (
                    <Polyline 
                        positions={routeCoords} 
                        color="var(--primary-color, #FF5400)" 
                        weight={4}
                    />
                ) : straightLines.length > 1 ? (
                    <Polyline 
                        positions={straightLines} 
                        color="var(--primary-color, #FF5400)" 
                        weight={4}
                        dashArray="5, 5"
                    />
                ) : null}

                <ChangeView items={[...items, { id: 'base', lat: BASE_LOCATION[0], lng: BASE_LOCATION[1], cliente: 'Base', direccion: 'Salida' }]} />
            </MapContainer>
        </div>
    );
};
