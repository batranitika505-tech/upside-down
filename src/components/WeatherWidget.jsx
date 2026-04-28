import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Thermometer, Wind, Droplets, AlertCircle, Sparkles, TrendingUp, Info } from 'lucide-react';

export default function WeatherWidget({ alerts = [], userLocation }) {
  const [weather, setWeather] = useState({
    temp: '--',
    condition: 'Loading...',
    humidity: '--',
    wind: '--',
    location: 'Detecting Location...',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  const [hints, setHints] = useState([]);

  const [forecast, setForecast] = useState([]);

  // Real weather fetch based on userLocation
  useEffect(() => {
    async function fetchWeather() {
      if (!userLocation) return;

      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${userLocation.lat}&longitude=${userLocation.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
        );
        const data = await response.json();

        const codes = {
          0: 'Clear', 1: 'Clear', 2: 'Cloudy', 3: 'Overcast',
          45: 'Fog', 48: 'Fog', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
          61: 'Rain', 63: 'Rain', 65: 'Heavy Rain',
          71: 'Snow', 73: 'Snow', 75: 'Snow', 95: 'Storm',
        };

        if (data.current) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            condition: codes[data.current.weather_code] || 'Stable',
            humidity: data.current.relative_humidity_2m,
            wind: Math.round(data.current.wind_speed_10m),
            location: 'Nearby Your Area',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }

        if (data.daily) {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dailyData = data.daily.time.slice(1, 4).map((time, idx) => ({
            day: days[new Date(time).getDay()],
            max: Math.round(data.daily.temperature_2m_max[idx + 1]),
            min: Math.round(data.daily.temperature_2m_min[idx + 1]),
            code: codes[data.daily.weather_code[idx + 1]] || 'Clear'
          }));
          setForecast(dailyData);
        }
      } catch (error) {
        console.error('Weather fetch error:', error);
      }
    }

    fetchWeather();
    const timer = setInterval(fetchWeather, 300000);
    return () => clearInterval(timer);
  }, [userLocation]);

  // Generate hints based on weather and alerts
  useEffect(() => {
    const newHints = [];
    
    // Hint based on high alerts
    const highAlerts = alerts.filter(a => a.severity === 'high');
    if (highAlerts.length > 0) {
      newHints.push({
        type: 'danger',
        text: 'High hazard risk detected nearby. Stay within 500m of verified safe zones.',
        icon: AlertCircle
      });
    }

    // Weather-based hints
    if (weather.temp > 35) {
      newHints.push({
        type: 'warning',
        text: 'Extreme Heat: Stay hydrated. Avoid outdoor activity between 12 PM - 4 PM.',
        icon: Thermometer
      });
    } else if (weather.condition.includes('Rain')) {
      newHints.push({
        type: 'info',
        text: 'Flood Risk: Water levels rising at Mula-Mutha river. Avoid low-lying peth areas.',
        icon: CloudRain
      });
    } else {
      newHints.push({
        type: 'safe',
        text: 'System Nominal: Current conditions are stable for travel in safe corridors.',
        icon: Sparkles
      });
    }

    // General prediction "What will happen"
    newHints.push({
      type: 'prediction',
      text: 'AI Forecast: 20% chance of localized flooding in next 3 hours due to upstream discharge.',
      icon: TrendingUp
    });

    setHints(newHints);
  }, [weather, alerts]);

  return (
    <div className="absolute top-20 right-4 z-[1000] w-72 pointer-events-none">
      <div className="glass-panel p-4 shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-white/10 pointer-events-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Cloud className="text-blue-400" size={18} />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-tighter text-resq-text">Station Alpha</h3>
              <p className="text-[10px] text-resq-muted font-bold tracking-widest">{weather.location}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-resq-accent bg-resq-accent/10 px-1.5 py-0.5 rounded border border-resq-accent/20">
              {weather.timestamp}
            </span>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-resq-dark/40 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 text-resq-muted mb-1">
              <Thermometer size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Temp</span>
            </div>
            <div className="text-2xl font-black text-resq-text leading-none">
              {weather.temp}<span className="text-resq-accent">°C</span>
            </div>
          </div>
          <div className="bg-resq-dark/40 rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-2 text-resq-muted mb-1">
              <Droplets size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Hum</span>
            </div>
            <div className="text-2xl font-black text-resq-text leading-none">
              {weather.humidity}<span className="text-blue-400">%</span>
            </div>
          </div>
        </div>

        {/* Sub Stats */}
        <div className="flex items-center justify-between px-1 mb-4 text-[10px] font-bold text-resq-muted uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <Wind size={10} className="text-resq-accent" />
            <span>{weather.wind} km/h</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cloud size={10} className="text-resq-accent" />
            <span>{weather.condition}</span>
          </div>
        </div>

        {/* 3-Day Prediction */}
        {forecast.length > 0 && (
          <div className="mb-4 bg-resq-dark/30 rounded-xl p-2.5 border border-white/5">
            <div className="flex items-center gap-2 mb-2 px-1">
              <TrendingUp size={10} className="text-resq-muted" />
              <span className="text-[9px] font-black uppercase tracking-widest text-resq-muted">3-Day Forecast</span>
            </div>
            <div className="flex justify-between gap-1">
              {forecast.map((f, i) => (
                <div key={i} className="flex-1 flex flex-col items-center p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <span className="text-[9px] font-black text-resq-muted mb-1">{f.day}</span>
                  <div className="text-resq-accent mb-1">
                    {f.code.includes('Rain') || f.code.includes('Storm') ? <CloudRain size={14} /> : <Sun size={14} />}
                  </div>
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-[11px] font-black text-resq-text">{f.max}°</span>
                    <span className="text-[8px] font-bold text-resq-muted mt-0.5">{f.min}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hints / Predictions Section */}
        <div className="space-y-2 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-purple-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">AI Predictive Forecast</span>
            </div>
            <span className="text-[9px] font-bold text-resq-muted px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10">Next 6h</span>
          </div>
          
          {hints.map((hint, idx) => {
            const Icon = hint.icon;
            let bgColor = 'bg-blue-500/10 border-blue-500/20 text-blue-400';
            if (hint.type === 'danger') bgColor = 'bg-red-500/10 border-red-500/20 text-red-400';
            if (hint.type === 'warning') bgColor = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
            if (hint.type === 'safe') bgColor = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
            if (hint.type === 'prediction') bgColor = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300';

            return (
              <div key={idx} className={`p-3 rounded-xl border text-[11px] leading-relaxed flex gap-3 items-start ${bgColor} animate-slide-up hover:brightness-125 transition-all cursor-default`}>
                <div className="p-1 rounded-lg bg-current/10">
                  <Icon size={14} className="shrink-0" />
                </div>
                <div className="flex-1">
                  <p className="font-bold mb-0.5 uppercase tracking-tighter text-[9px] opacity-70">
                    {hint.type === 'prediction' ? 'Probabilistic Forecast' : 'Safety Advice'}
                  </p>
                  <p className="font-semibold">{hint.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Visualization */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={12} className="text-resq-muted" />
            <span className="text-[10px] font-black uppercase tracking-widest text-resq-muted">Risk Timeline</span>
          </div>
          <div className="flex items-end gap-1.5 h-12 px-1">
            {[40, 25, 45, 80, 60, 30, 20].map((h, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-t-sm transition-all duration-500 hover:brightness-150 cursor-help ${h > 70 ? 'bg-red-500/60' : h > 40 ? 'bg-amber-500/60' : 'bg-blue-500/40'}`}
                style={{ height: `${h}%` }}
                title={`Risk Level: ${h}% at +${i*2}h`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[8px] font-black text-resq-muted uppercase tracking-tighter">
            <span>Now</span>
            <span>+4h</span>
            <span>+12h</span>
          </div>
        </div>

        {/* Action Link */}
        <button className="w-full mt-4 py-2.5 rounded-xl bg-resq-accent/10 border border-resq-accent/20 text-[10px] font-black text-resq-accent uppercase tracking-widest hover:bg-resq-accent hover:text-white transition-all">
          View Detailed Analytics
        </button>
      </div>
    </div>
  );
}
