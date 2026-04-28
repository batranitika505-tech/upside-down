import { useCallback, useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { MapPin, AlertTriangle, ShieldCheck, AlertCircle, CheckCircle2, Navigation2, ExternalLink, Sparkles } from 'lucide-react';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// SVG marker icons as Leaflet DivIcons
function createMarkerIcon(color, glowColor, isVerified) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="${isVerified ? '3' : '1'}" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path d="M18 2C9.716 2 3 8.716 3 17c0 11.25 15 25 15 25s15-13.75 15-25C33 8.716 26.284 2 18 2z" 
            fill="${color}" stroke="${glowColor}" stroke-width="${isVerified ? '2.5' : '1'}" 
            filter="url(#glow)" opacity="${isVerified ? '1' : '0.4'}"/>
      <circle cx="18" cy="17" r="6" fill="white" opacity="${isVerified ? '1' : '0.5'}"/>
    </svg>`;
  
  return L.divIcon({
    html: svg,
    className: `custom-marker-icon ${isVerified ? 'verified-marker' : 'unverified-marker'}`,
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
}

const markerIcons = {
  danger: (v) => createMarkerIcon('#ef4444', '#ff6b6b', v),
  safe: (v) => createMarkerIcon('#22c55e', '#4ade80', v),
  hazard: (v) => createMarkerIcon('#f59e0b', '#fbbf24', v),
};

const userLocationIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-12 h-12 rounded-full bg-blue-500/20 animate-ping"></div>
      <div class="absolute w-8 h-8 rounded-full bg-blue-500/40 animate-pulse"></div>
      <div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-[0_0_15px_rgba(37,99,235,0.6)] z-10"></div>
    </div>
  `,
  className: 'user-location-icon',
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

const detectedLocationIcon = L.divIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-16 h-16 rounded-full bg-purple-500/20 animate-ping"></div>
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)] border-2 border-white/50 z-10 animate-bounce">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
      </div>
    </div>
  `,
  className: 'detected-location-icon',
  iconSize: [64, 64],
  iconAnchor: [32, 32],
});

const typeLabels = {
  danger: { label: 'Danger Zone', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/15' },
  safe: { label: 'Safe Zone', icon: ShieldCheck, color: 'text-green-400', bg: 'bg-green-500/15' },
  hazard: { label: 'Reported Hazard', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/15' },
};

function getTimeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function MapController({ center }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);
  return null;
}

function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });
  return null;
}

export default function Map({ zones, userLocation, mapCenter, detectedLocation, onMapClick, userId }) {
  const [disasterFilter, setDisasterFilter] = useState('all');
  const center = useMemo(() => mapCenter || userLocation || { lat: 18.5204, lng: 73.8567 }, [mapCenter, userLocation]);
  const [confirming, setConfirming] = useState(null);


  const handleConfirm = async (zoneId) => {
    if (!userId || confirming === zoneId) return;
    
    setConfirming(zoneId);
    try {
      const zoneRef = doc(db, 'zones', zoneId);
      await updateDoc(zoneRef, {
        confirmations: arrayUnion(userId)
      });
    } catch (error) {
      console.error('Confirmation failed:', error);
    } finally {
      setConfirming(null);
    }
  };

  return (
    <div className="absolute inset-0 z-0">
      {/* Custom Dark Theme Filter Overlay */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-resq-dark/10 backdrop-contrast-[1.1] backdrop-brightness-[0.9]" />

      {/* Real-time Scanning Effect */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-resq-accent to-transparent animate-[scan_8s_linear_infinite]" />
        <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-transparent via-resq-accent to-transparent animate-[scan-v_12s_linear_infinite]" />
      </div>
      {/* Filter Bar (Outside MapContainer to prevent click-through issues) */}
      <div className="absolute top-24 left-0 right-0 z-[1000] w-full px-4 flex justify-center pointer-events-none">
        <div className="glass-card p-1.5 flex gap-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)] border-white/10 overflow-x-auto no-scrollbar max-w-full pointer-events-auto">
          {[
            { id: 'all', label: 'ALL HAZARDS', icon: AlertTriangle },
            { id: 'flood', label: 'FLOOD', icon: Navigation2 },
            { id: 'earthquake', label: 'EARTHQUAKE', icon: AlertTriangle },
            { id: 'fire', label: 'FIRE', icon: AlertCircle },
            { id: 'manmade', label: 'TECH/MAN-MADE', icon: AlertTriangle },
            { id: 'biological', label: 'BIOLOGICAL', icon: ShieldCheck },
            { id: 'security', label: 'SECURITY', icon: ShieldCheck },
            { id: 'transport', label: 'TRANSPORT', icon: Navigation2 },
            { id: 'weather', label: 'WEATHER', icon: Sparkles },
          ].map((filter) => {
            const Icon = filter.icon;
            const isActive = disasterFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setDisasterFilter(filter.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shrink-0 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105 border border-blue-400/50' 
                    : 'bg-resq-dark/60 text-resq-muted hover:bg-resq-card hover:text-resq-text border border-resq-border/20'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-white' : 'text-blue-400/70'} />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        {/* Google Maps Stable Tiles (API-less) with CSS Dark Filter */}
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          className="map-tiles-dark"
          maxZoom={20}
          attribution='&copy; Google'
        />

        <MapController center={center} />
        <MapEvents onMapClick={onMapClick} />

        {/* User location marker with accuracy circle */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={100}
              pathOptions={{ 
                fillColor: '#3b82f6', 
                fillOpacity: 0.15, 
                color: '#3b82f6', 
                weight: 1,
                dashArray: '5, 5'
              }}
            />
            <Marker 
              position={[userLocation.lat, userLocation.lng]} 
              icon={userLocationIcon}
              zIndexOffset={1000}
            >
              <Popup className="user-popup">
                <div className="p-2 text-center">
                  <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">You are here</p>
                  <p className="text-[10px] text-resq-muted leading-tight">Live GPS tracking active</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* AI Detected Location Marker */}
        {detectedLocation && (
          <Marker 
            position={[detectedLocation.lat, detectedLocation.lng]} 
            icon={detectedLocationIcon}
            zIndexOffset={1100}
          >
            <Popup className="ai-popup">
              <div className="p-2 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Sparkles size={14} className="text-purple-500" />
                  <p className="text-xs font-black text-purple-600 uppercase tracking-widest">AI Identified</p>
                </div>
                <p className="text-[10px] text-resq-muted leading-tight font-medium">Map focused on chat location</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Zone markers (Filtered) */}
        {zones
          .filter(z => disasterFilter === 'all' || z.hazardType === 'all' || z.hazardType === disasterFilter)
          .map((zone) => {
          const confirmations = zone.confirmations?.length || 0;
          const isVerified = confirmations >= 3 || zone.type === 'safe' || zone.type === 'danger';
          const hasAlreadyConfirmed = zone.confirmations?.includes(userId);

          return (
            <Marker
              key={zone.id}
              position={[zone.lat, zone.lng]}
              icon={markerIcons[zone.type](isVerified) || markerIcons.hazard(isVerified)}
            >
              <Popup>
                <div className="p-2 min-w-[200px]" style={{ color: '#1a2233' }}>
                  {(() => {
                    const typeInfo = typeLabels[zone.type] || typeLabels.hazard;
                    const Icon = typeInfo.icon;
                    return (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${typeInfo.bg}`}>
                              <Icon size={14} className={typeInfo.color} />
                            </div>
                            <span className={`text-xs font-semibold uppercase tracking-wide ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                          </div>
                          {isVerified && (
                            <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                              <CheckCircle2 size={10} />
                              VERIFIED
                            </div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">{zone.description}</p>
                        
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                          <div className="text-[10px] text-gray-400">
                            {getTimeAgo(zone.timestamp)}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-3 flex flex-col gap-2">

                          {/* Safe zone: big prominent directions button */}
                          {zone.type === 'safe' && (
                            <button
                              onClick={() => {
                                const origin = userLocation
                                  ? `${userLocation.lat},${userLocation.lng}`
                                  : '';
                                const url = origin
                                  ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${zone.lat},${zone.lng}&travelmode=driving`
                                  : `https://www.google.com/maps/dir/?api=1&destination=${zone.lat},${zone.lng}&travelmode=driving`;
                                window.open(url, '_blank');
                              }}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[12px] uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
                            >
                              <Navigation2 size={15} />
                              Get Directions from My Location
                              <ExternalLink size={12} className="opacity-70" />
                            </button>
                          )}

                          <div className="flex gap-2">
                            {/* Confirm button — only for hazards */}
                            {zone.type === 'hazard' && (
                              <button
                                onClick={() => handleConfirm(zone.id)}
                                disabled={hasAlreadyConfirmed || confirming === zone.id}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 ${
                                  hasAlreadyConfirmed
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-resq-accent hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                }`}
                              >
                                {confirming === zone.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <>
                                    <ShieldCheck size={14} />
                                    {hasAlreadyConfirmed ? 'Verified' : 'Confirm'}
                                  </>
                                )}
                              </button>
                            )}

                            {/* Route button for danger & hazard */}
                            {zone.type !== 'safe' && (
                              <button
                                onClick={() => {
                                  const origin = userLocation
                                    ? `${userLocation.lat},${userLocation.lng}`
                                    : '';
                                  const url = origin
                                    ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${zone.lat},${zone.lng}&travelmode=driving`
                                    : `https://www.google.com/maps/dir/?api=1&destination=${zone.lat},${zone.lng}&travelmode=driving`;
                                  window.open(url, '_blank');
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-resq-card hover:bg-resq-border/40 text-resq-text font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 border border-resq-border/30"
                              >
                                <Navigation2 size={14} className="text-resq-accent" />
                                Route
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-24 right-4 z-[1000]">
        <div className="glass-card p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-resq-muted font-semibold mb-1">Legend</p>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
            <span className="text-xs text-resq-muted">Danger Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
            <span className="text-xs text-resq-muted">Safe Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
            <span className="text-xs text-resq-muted">Reported Hazard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            <span className="text-xs text-resq-muted">You</span>
          </div>
          <div className="pt-2 border-t border-resq-border/30 mt-1">
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-[10px] text-resq-muted">Unverified (Requires 3 reports)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
