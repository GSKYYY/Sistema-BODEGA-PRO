import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  Users, 
  Settings, 
  LogOut,
  Store,
  Truck,
  Wallet
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { config, logout, user } = useData();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const themeColors = {
    blue: 'bg-blue-600 border-blue-400',
    emerald: 'bg-emerald-600 border-emerald-400',
    violet: 'bg-violet-600 border-violet-400',
    orange: 'bg-orange-600 border-orange-400',
    rose: 'bg-rose-600 border-rose-400',
    slate: 'bg-slate-600 border-slate-400',
    christmas: 'bg-gradient-to-r from-red-700 to-green-700 border-yellow-400',
  };

  const activeClass = themeColors[config.theme] || themeColors.blue;
  const isChristmas = config.theme === 'christmas';
  // Use a fallback solid color for icons if christmas gradient is active
  const logoColor = isChristmas ? 'bg-red-600' : activeClass.split(' ')[0];

  // Helper to check permissions
  const hasAccess = (role: 'owner' | 'employee', permission?: boolean) => {
    if (!user) return false;
    if (user.role === 'owner') return true;
    if (user.role === role) {
        return permission !== undefined ? permission : true;
    }
    return false;
  };

  const allNavItems = [
    { to: '/', icon: LayoutDashboard, label: 'Panel Principal', show: true },
    { to: '/pos', icon: ShoppingCart, label: 'Punto de Venta', show: true },
    { to: '/inventory', icon: Package, label: 'Inventario', show: true },
    { to: '/sales', icon: History, label: 'Historial Ventas', show: true },
    { to: '/cashbox', icon: Wallet, label: 'Caja Diaria', show: hasAccess('employee', config.permissions.canAccessCashbox) },
    { to: '/clients', icon: Users, label: 'Clientes', show: hasAccess('employee', config.permissions.canManageClients) },
    { to: '/suppliers', icon: Truck, label: 'Proveedores', show: hasAccess('owner') },
    { to: '/settings', icon: Settings, label: 'Configuración', show: hasAccess('owner') },
  ];

  const navItems = allNavItems.filter(item => item.show);

  return (
    <div className={`w-64 h-screen fixed left-0 top-0 flex flex-col shadow-xl z-20 ${isChristmas ? 'bg-green-900 border-r-4 border-red-700' : 'bg-slate-900'} text-white`}>
      <div className="p-6 border-b border-white/10 flex items-center gap-3">
        <div className={`${logoColor} p-2 rounded-lg transition-colors duration-300 shadow-md`}>
            <Store size={24} className={isChristmas ? "text-yellow-300" : "text-white"} />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight truncate w-36">Bodega Pro</h1>
          <p className="text-xs text-gray-400">{config.businessName}</p>
        </div>
      </div>

      <nav className="flex-1 py-6 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-6 py-3 transition-all duration-300 ${
                    isActive
                      ? `${activeClass} text-white border-r-4 shadow-inner`
                      : 'text-gray-400 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} className={isChristmas && isActive ? "text-yellow-300" : ""} />
                    <span className="font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3 mb-4 px-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${logoColor}`}>
                {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate capitalize">{user?.role === 'owner' ? 'Dueño' : 'Empleado'}</p>
            </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition-colors w-full px-2"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};