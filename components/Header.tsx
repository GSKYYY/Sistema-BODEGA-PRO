
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Bell, AlertTriangle, CheckCircle, Info, Menu } from 'lucide-react';

interface HeaderProps {
    title: string;
    onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const { config, updateConfig, notifications, products, user } = useData();
  const [showNotifications, setShowNotifications] = useState(false);

  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.status === 'active').length;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 shadow-sm shrink-0">
      <div className="flex items-center gap-3">
        {onMenuClick && (
            <button 
                onClick={onMenuClick}
                className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
                <Menu size={24} />
            </button>
        )}
        <h2 className="text-lg md:text-xl font-bold text-gray-800 truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Dynamic Currency Widget */}
        <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5 gap-2">
                <span className="text-xs font-semibold text-gray-600">
                    Tasa {config.currencyCode}:
                </span>
                <div className="flex items-center text-green-600 font-bold text-sm">
                    <span className="mr-1">{config.currencySymbol}</span>
                    <input 
                        type="number" 
                        value={config.exchangeRate}
                        onChange={(e) => updateConfig({ ...config, exchangeRate: parseFloat(e.target.value) || 0 })}
                        className="w-20 bg-transparent border-b border-gray-300 focus:border-green-500 focus:outline-none text-right px-1"
                    />
                </div>
            </div>
        </div>
        
        {/* Simple Rate - Mobile/Tablet */}
        <div className="lg:hidden flex items-center bg-gray-50 rounded-lg px-2 py-1">
             <span className="text-xs font-bold text-green-600">
                {config.currencyCode} {config.exchangeRate}
             </span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 relative"
          >
            <Bell size={20} />
            {(notifications.length > 0 || lowStockCount > 0) && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in slide-in-from-top-2">
                <div className="p-3 bg-gray-50 border-b border-gray-100 font-semibold text-gray-700 flex justify-between">
                    <span>Notificaciones</span>
                    {lowStockCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{lowStockCount} Alertas</span>}
                </div>
                <div className="max-h-64 overflow-y-auto">
                    {lowStockCount > 0 && (
                        <div className="p-3 border-b border-gray-50 bg-red-50 flex items-start gap-3">
                            <AlertTriangle size={16} className="text-red-500 mt-1" />
                            <div>
                                <p className="text-sm font-medium text-red-800">Stock Bajo</p>
                                <p className="text-xs text-red-600">Hay {lowStockCount} productos por debajo del mínimo.</p>
                            </div>
                        </div>
                    )}
                    {notifications.length === 0 && lowStockCount === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm">No hay notificaciones recientes</div>
                    ) : (
                        notifications.slice().reverse().map(note => (
                            <div key={note.id} className="p-3 border-b border-gray-50 hover:bg-gray-50 flex items-start gap-3">
                                {note.type === 'success' && <CheckCircle size={16} className="text-green-500 mt-1" />}
                                {note.type === 'error' && <AlertTriangle size={16} className="text-red-500 mt-1" />}
                                {(note.type === 'info' || note.type === 'warning') && <Info size={16} className="text-blue-500 mt-1" />}
                                <div>
                                    <p className="text-sm text-gray-700">{note.message}</p>
                                    <p className="text-xs text-gray-400">{new Date(note.timestamp).toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3 pl-6 border-l border-gray-200">
          <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
            {user?.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role === 'owner' ? 'Dueño' : 'Empleado'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
