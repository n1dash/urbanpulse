import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getStatusColor } from '../utils/helpers';

// Helper component to handle click events in selector mode
const MapEvents = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Helper component to auto-recenter map when center prop changes
const RecenterMap = ({ center }) => {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

// Create a custom SVG marker based on the complaint status or priority
const createCustomMarker = (status, isSelected = false) => {
  const colorMap = {
    'Created': '#3b82f6', // Blue
    'Verified': '#6366f1', // Indigo
    'Assigned': '#f59e0b', // Amber
    'In Progress': '#a855f7', // Purple
    'Resolved': '#10b981' // Emerald
  };

  const color = colorMap[status] || '#64748b';
  const size = isSelected ? 42 : 34;

  const svgHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      <path fill="${color}" stroke="#ffffff" stroke-width="2" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

export const Map = ({ 
  mode = 'view', // 'view' or 'select'
  center = [12.9716, 77.5946], // Default Bangalore coords
  zoom = 12,
  complaints = [], 
  selectedLocation = null, 
  onLocationSelect = null,
  onMarkerClick = null
}) => {
  const [mapCenter, setMapCenter] = useState(center);

  // Sync map center if selectedLocation is passed (useful when geocoding or picking location)
  useEffect(() => {
    if (selectedLocation) {
      setMapCenter([selectedLocation.lat, selectedLocation.lng]);
    } else if (center) {
      setMapCenter(center);
    }
  }, [selectedLocation, center]);

  const defaultIcon = createCustomMarker('Created');

  return (
    <div className="w-full h-full min-h-[300px] border border-slate-200 rounded-2xl overflow-hidden shadow-sm relative">
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Recenter helper */}
        <RecenterMap center={mapCenter} />

        {/* SELECT MODE: User selects coordinates by clicking or dragging */}
        {mode === 'select' && onLocationSelect && (
          <>
            <MapEvents onLocationSelect={onLocationSelect} />
            {selectedLocation && (
              <Marker 
                position={[selectedLocation.lat, selectedLocation.lng]}
                icon={createCustomMarker('Created', true)}
              >
                <Popup>
                  <div className="text-xs font-semibold">Selected Location</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Lat: {selectedLocation.lat.toFixed(4)}, Lng: {selectedLocation.lng.toFixed(4)}
                  </div>
                </Popup>
              </Marker>
            )}
          </>
        )}

        {/* VIEW MODE: Displays markers for complaints */}
        {mode === 'view' && complaints.map((complaint) => {
          if (!complaint.location || !complaint.location.lat || !complaint.location.lng) return null;
          
          const isSelected = selectedLocation && 
            selectedLocation.lat === complaint.location.lat && 
            selectedLocation.lng === complaint.location.lng;

          return (
            <Marker
              key={complaint.id}
              position={[complaint.location.lat, complaint.location.lng]}
              icon={createCustomMarker(complaint.status, isSelected)}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) onMarkerClick(complaint);
                }
              }}
            >
              <Popup>
                <div className="p-1 space-y-1.5 max-w-[200px]">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">{complaint.id}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 border rounded-full font-semibold ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs line-clamp-1">{complaint.title}</h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2">{complaint.description}</p>
                  <div className="text-[10px] text-slate-400 font-medium">Dept: {complaint.department}</div>
                  {complaint.priorityScore && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-semibold text-slate-500">Priority Score:</span>
                      <span className="text-[10px] font-bold text-brand-600">{complaint.priorityScore}</span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
export default Map;
