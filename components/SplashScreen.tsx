
import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { Store, Loader2 } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const { config } = useData();
  const [greeting, setGreeting] = useState('');
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Determine greeting based on time
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Buenos días');
    else if (hour >= 12 && hour < 19) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');

    // Trigger fade out before finishing
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(onFinish, 500); // Wait for fade transition
    }, 2500); // 2.5s display + 0.5s fade = 3s total

    return () => clearTimeout(timer);
  }, [onFinish]);

  // Theme color mapping
  const getThemeColor = () => {
    const colors: Record<string, string> = {
      blue: 'text-blue-600',
      emerald: 'text-emerald-600',
      violet: 'text-violet-600',
      orange: 'text-orange-600',
      rose: 'text-rose-600',
      slate: 'text-slate-600',
      christmas: 'text-red-600',
    };
    return colors[config.theme] || 'text-blue-600';
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 transition-opacity duration-500 ${fade ? 'opacity-0' : 'opacity-100'} overflow-hidden`}>
      
      {/* Snowfall Effect for Christmas Theme */}
      {config.theme === 'christmas' && (
        <>
            {[...Array(20)].map((_, i) => (
                <div 
                    key={i} 
                    className="snowflake"
                    style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${3 + Math.random() * 5}s`,
                        fontSize: `${10 + Math.random() * 20}px`,
                        color: Math.random() > 0.5 ? '#16A34A' : '#DC2626' // Red/Green flakes
                    }}
                >
                    ❄
                </div>
            ))}
        </>
      )}

      <div className="relative mb-8 z-10">
        <div className={`w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center animate-bounce duration-[2000ms]`}>
          <Store size={48} className={getThemeColor()} />
        </div>
        <div className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-black/10 rounded-full blur-sm`}></div>
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-2 animate-pulse z-10">
        {greeting}
      </h1>
      <div className="text-center z-10">
        <p className="text-gray-500 font-medium text-lg">Bodega Pro</p>
        <p className="text-gray-400 text-sm mt-1">{config.businessName}</p>
      </div>

      <div className="flex items-center gap-2 text-gray-400 text-sm mt-8 z-10">
        <Loader2 size={16} className={`animate-spin ${getThemeColor()}`} />
        <span>Cargando sistema...</span>
      </div>
    </div>
  );
};