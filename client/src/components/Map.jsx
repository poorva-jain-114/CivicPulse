import React, { useEffect, useState, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Dynamic custom DIV icons to guarantee rendering without local asset dependency
const getCustomIcon = (priority, status, isSpam) => {
  let color = '#3B82F6'; // Default Low priority blue
  
  if (isSpam) {
    color = '#94A3B8'; // Slate grey for spam
  } else if (status === 'Resolved' || status === 'Verified') {
    color = '#10B981'; // Emerald for resolved/verified
  } else if (priority >= 75) {
    color = '#EF4444'; // Crimson for emergency priority
  } else if (priority >= 45) {
    color = '#F59E0B'; // Amber for warning priority
  }

  return L.divIcon({
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: ${color}; opacity: 0.4; animation: pulse-ring 1.5s infinite ease-in-out;"></span>
        <span style="position: relative; width: 14px; height: 14px; border-radius: 50%; background-color: ${color}; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></span>
      </div>
    `,
    className: 'sarthi-map-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Selection marker for pinning
const getPinIcon = () => {
  return L.divIcon({
    html: `
      <div style="display: flex; align-items: center; justify-content: center;">
        <span style="position: relative; width: 18px; height: 18px; border-radius: 50%; background-color: #7C3AED; border: 3px solid white; box-shadow: 0 0 10px rgba(124, 58, 237, 0.8);"></span>
      </div>
    `,
    className: 'sarthi-pin-marker',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
};

// Map click detector component
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    }
  });
  return null;
}

// Controller component to center map on state change
function MapRecenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

export default function Map({ 
  incidents = [], 
  selectedLat, 
  selectedLng, 
  onMapClick, 
  center = [21.1458, 79.0882], // Nagpur center default
  zoom = 13 
}) {
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);

  // Auto-request location access on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setMapZoom(14);
          if (onMapClick) {
            onMapClick(latitude, longitude);
          }
        },
        (error) => {
          console.warn("User geolocation access request was denied or failed:", error);
        }
      );
    }
  }, []);

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setMapZoom(14);
          if (onMapClick) {
            onMapClick(latitude, longitude);
          }
        },
        (error) => {
          alert("Could not retrieve location. Please check browser permissions.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="w-full h-full relative border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <MapContainer 
        center={mapCenter} 
        zoom={mapZoom} 
        scrollWheelZoom={true} 
        className="w-full h-full min-h-[300px]"
      >
        {/* Recenter handler */}
        <MapRecenter center={mapCenter} zoom={mapZoom} />

        {/* OpenStreetMap Standard Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Click detection for drop pins */}
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

        {/* Temporary placed pin */}
        {selectedLat && selectedLng && (
          <Marker position={[selectedLat, selectedLng]} icon={getPinIcon()}>
            <Popup>
              <div className="text-xs font-semibold p-1">
                📍 Location Captured<br />
                Ready to submit grievance.
              </div>
            </Popup>
          </Marker>
        )}

        {/* Existing tickets markers */}
        {incidents.map((inc) => {
          if (!inc.latitude || !inc.longitude) return null;

          const isUnresolvedActive = 
            inc.status !== 'Resolved' && 
            inc.status !== 'Verified' && 
            !inc.isSpam;

          let circleColor = '#3B82F6'; // Default Low priority blue
          let circleRadius = 100;

          if (inc.priority >= 75) {
            circleColor = '#EF4444'; // Red
            circleRadius = 250;
          } else if (inc.priority >= 45) {
            circleColor = '#F59E0B'; // Amber
            circleRadius = 180;
          }

          const incKey = inc._id || inc.id;

          return (
            <Fragment key={incKey}>
              {isUnresolvedActive && (
                <Circle
                  center={[inc.latitude, inc.longitude]}
                  radius={circleRadius}
                  pathOptions={{
                    color: circleColor,
                    fillColor: circleColor,
                    fillOpacity: 0.15,
                    weight: 1,
                    dashArray: '4, 4'
                  }}
                />
              )}
              <Marker 
                position={[inc.latitude, inc.longitude]} 
                icon={getCustomIcon(inc.priority, inc.status, inc.isSpam)}
              >
                <Popup>
                  <div className="p-2 max-w-[200px] text-xs">
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="font-bold text-slate-800">{inc.category}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        inc.status === 'Verified' || inc.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inc.priority >= 75
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inc.status}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-700 mt-1">{inc.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{inc.description}</p>
                    
                    {inc.isClusterMaster && inc.confirmations > 1 && (
                      <div className="mt-2 bg-indigo-50 border border-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded text-[9px] font-semibold text-center">
                        👥 Clustered: {inc.confirmations} Citizens reported
                      </div>
                    )}

                    {inc.escalated && (
                      <div className="mt-1 bg-red-50 border border-red-100 text-red-800 px-1.5 py-0.5 rounded text-[9px] font-bold text-center">
                        🚨 ESCALATED TO COMMISSIONER
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </Fragment>
          );
        })}
      </MapContainer>
      
      {/* Floating Locate Me control */}
      <button
        type="button"
        onClick={handleLocateMe}
        className="absolute top-2 right-2 z-[1000] w-9 h-9 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center group active:scale-95 no-print"
        title="Locate Me"
      >
        <span className="text-sm font-bold group-hover:scale-110 transition-transform">🎯</span>
      </button>

      {/* Map legend overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white bg-opacity-95 p-2 rounded-lg shadow-md border border-slate-200 text-[10px] space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gov-crimson inline-block border border-white shadow-sm"></span>
          <span>Emergency Priority (&ge;75)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gov-amber inline-block border border-white shadow-sm"></span>
          <span>Medium Priority (&ge;45)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block border border-white shadow-sm"></span>
          <span>Low Priority (&lt;45)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gov-emerald inline-block border border-white shadow-sm"></span>
          <span>Resolved / Verified Works</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block border border-white shadow-sm"></span>
          <span>Spam / Non-civic</span>
        </div>
      </div>
    </div>
  );
}
