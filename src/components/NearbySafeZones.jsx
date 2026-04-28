import { useMemo } from 'react';
import { ShieldCheck, MapPin, Navigation2, ExternalLink } from 'lucide-react';

export default function NearbySafeZones({ zones, userLocation }) {
  const nearestZones = useMemo(() => {
    if (!userLocation || !zones || zones.length === 0) return [];

    const safeZones = zones.filter(z => z.type === 'safe');

    return safeZones
      .map(zone => {
        // Calculate distance (Haversine formula)
        const R = 6371; // Earth's radius in km
        const dLat = (zone.lat - userLocation.lat) * (Math.PI / 180);
        const dLon = (zone.lng - userLocation.lng) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(userLocation.lat * (Math.PI / 180)) *
            Math.cos(zone.lat * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        return { ...zone, distance };
      })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3); // Get top 3
  }, [zones, userLocation]);

  if (!userLocation || nearestZones.length === 0) return null;

  return (
    <div className="absolute bottom-32 left-4 z-[1000] w-72 pointer-events-none">
      <div className="glass-panel p-4 shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-white/10 pointer-events-auto animate-bounce-in">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <ShieldCheck className="text-emerald-400" size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-tighter text-resq-text">Nearest Safe Zones</h3>
            <p className="text-[10px] text-resq-muted font-bold tracking-widest uppercase">Emergency Shelters</p>
          </div>
        </div>

        <div className="space-y-3">
          {nearestZones.map((zone) => (
            <div 
              key={zone.id} 
              className="p-3 rounded-xl bg-resq-dark/40 border border-white/5 hover:border-emerald-500/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-1.5">
                <h4 className="text-[11px] font-bold text-resq-text leading-tight pr-4 truncate">
                  {zone.description.split('—')[0].replace('🏥 SAFE ZONE: ', '').replace('🏫 SAFE ZONE: ', '').replace('🚔 SAFE ZONE: ', '')}
                </h4>
                <span className="text-[10px] font-black text-emerald-400 shrink-0">
                  {zone.distance < 1 ? `${(zone.distance * 1000).toFixed(0)}m` : `${zone.distance.toFixed(1)}km`}
                </span>
              </div>
              
              <p className="text-[9px] text-resq-muted leading-relaxed mb-3 line-clamp-2 opacity-70">
                {zone.description.split('—')[1] || zone.description}
              </p>

              <button
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${zone.lat},${zone.lng}&travelmode=driving`;
                  window.open(url, '_blank');
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
              >
                <Navigation2 size={10} />
                Get Directions
                <ExternalLink size={10} className="opacity-50" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin size={10} className="text-resq-muted" />
            <span className="text-[9px] font-bold text-resq-muted uppercase tracking-tighter">Your Location Active</span>
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-5 h-5 rounded-full border-2 border-resq-card bg-emerald-500 flex items-center justify-center">
                <ShieldCheck size={8} className="text-white" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
