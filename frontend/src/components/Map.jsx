import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Setup standard Leaflet icons so they render correctly in bundler environments
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// A component that handles map clicks and triggers coordinate selection
const LocationMarkerSelector = ({ onLocationSelect, selectedLocation }) => {
  const map = useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const latRounded = Math.round(lat * 1000000) / 1000000;
      const lngRounded = Math.round(lng * 1000000) / 1000000;
      onLocationSelect({ lat: latRounded, lng: lngRounded });
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (selectedLocation) {
      map.panTo([selectedLocation.lat, selectedLocation.lng]);
    }
  }, [selectedLocation, map]);

  return selectedLocation ? (
    <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={customIcon}>
      <Popup>
        <span className="text-xs font-bold text-slate-800">Pinned Location: {selectedLocation.lat}, {selectedLocation.lng}</span>
      </Popup>
    </Marker>
  ) : null;
};

const Map = ({ 
  center = [20.5937, 78.9629], 
  zoom = 13, 
  markers = [], 
  selectable = false, 
  selectedLocation = null, 
  onLocationSelect = () => {},
  height = "350px"
}) => {
  // Determine starting center
  const mapCenter = selectedLocation 
    ? [selectedLocation.lat, selectedLocation.lng] 
    : (markers.length > 0 && markers[0].lat && markers[0].lng ? [markers[0].lat, markers[0].lng] : center);

  return (
    <div style={{ height }} className="relative w-full rounded-2xl border border-slate-200 shadow-sm overflow-hidden z-10 bg-slate-50">
      <MapContainer 
        center={mapCenter} 
        zoom={selectedLocation ? 15 : zoom} 
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Marker Selection mode */}
        {selectable && (
          <LocationMarkerSelector 
            onLocationSelect={onLocationSelect} 
            selectedLocation={selectedLocation} 
          />
        )}

        {/* Read-only multiple markers display mode */}
        {!selectable && markers.map((marker) => {
          if (!marker.lat || !marker.lng) return null;
          return (
            <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={customIcon}>
              <Popup>
                <div className="p-1 max-w-sm select-none">
                  <h5 className="font-extrabold text-slate-850 text-xs mb-1 truncate">{marker.title}</h5>
                  <p className="text-[10px] text-slate-500 mb-2 leading-tight line-clamp-2">{marker.description}</p>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
                    <span className="inline-block px-2 py-0.5 text-[8px] font-bold rounded-full bg-accent-50 text-accent-700 uppercase border border-accent-100">
                      {marker.status}
                    </span>
                    <a 
                      href={`/complaints/${marker.id}`} 
                      className="text-[9px] font-extrabold text-accent-600 hover:text-accent-700 hover:underline"
                    >
                      Audit Details &rarr;
                    </a>
                  </div>
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
