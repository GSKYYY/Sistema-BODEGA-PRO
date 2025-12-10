
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Store, User as UserIcon, Lock, ArrowRight, ShieldCheck, ArrowLeft, Briefcase, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const { login, config } = useData();
  const navigate = useNavigate();
  
  // State for the 2-step process
  const [selectedRole, setSelectedRole] = useState<'owner' | 'employee' | null>(null);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileSelect = (role: 'owner' | 'employee') => {
    setSelectedRole(role);
    setError('');
    setUsername('');
    setPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay for effect
    setTimeout(() => {
      if (selectedRole === 'owner') {
        if (username === 'admin' && password === 'admin') {
            login(username, 'owner', 'Dueño');
            navigate('/');
        } else {
            setError('Credenciales de Dueño incorrectas');
            setIsLoading(false);
        }
      } 
      else if (selectedRole === 'employee') {
        if (username === 'empleado' && password === '1234') {
            login(username, 'employee', 'Empleado');
            navigate('/');
        } else {
            setError('Credenciales de Empleado incorrectas');
            setIsLoading(false);
        }
      }
    }, 800);
  };

  // Helper for gradients based on theme
  const getGradient = () => {
    const gradients: Record<string, string> = {
      blue: 'from-blue-600 to-indigo-900',
      emerald: 'from-emerald-600 to-teal-900',
      violet: 'from-violet-600 to-purple-900',
      orange: 'from-orange-600 to-red-900',
      rose: 'from-rose-600 to-pink-900',
      slate: 'from-slate-700 to-gray-900',
      christmas: 'from-red-700 via-green-800 to-red-900',
    };
    return gradients[config.theme] || 'from-blue-600 to-indigo-900';
  };

  const getButtonColor = () => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      emerald: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
      violet: 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-500',
      orange: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
      rose: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
      slate: 'bg-slate-700 hover:bg-slate-800 focus:ring-slate-500',
      christmas: 'bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 border border-yellow-400 shadow-md',
    };
    return colors[config.theme] || 'bg-blue-600 hover:bg-blue-700';
  };

  const getTextHighlight = () => {
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

  const getRingColor = () => {
    const colors: Record<string, string> = {
        blue: 'group-hover:ring-blue-200',
        emerald: 'group-hover:ring-emerald-200',
        violet: 'group-hover:ring-violet-200',
        orange: 'group-hover:ring-orange-200',
        rose: 'group-hover:ring-rose-200',
        slate: 'group-hover:ring-slate-200',
        christmas: 'group-hover:ring-red-200',
    };
    return colors[config.theme] || 'group-hover:ring-blue-200';
  };

  // Safe background color for dynamic classes (avoids undefined errors)
  const getThemeBgLight = () => {
     const colors: Record<string, string> = {
        blue: 'bg-blue-50 group-hover:bg-blue-100',
        emerald: 'bg-emerald-50 group-hover:bg-emerald-100',
        violet: 'bg-violet-50 group-hover:bg-violet-100',
        orange: 'bg-orange-50 group-hover:bg-orange-100',
        rose: 'bg-rose-50 group-hover:bg-rose-100',
        slate: 'bg-slate-50 group-hover:bg-slate-100',
        christmas: 'bg-red-50 group-hover:bg-green-50',
    };
    return colors[config.theme] || 'bg-blue-50 group-hover:bg-blue-100';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${getGradient()}`}></div>
      
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
                        animationDuration: `${5 + Math.random() * 10}s`,
                        fontSize: `${10 + Math.random() * 20}px`
                    }}
                >
                    ❄
                </div>
            ))}
        </>
      )}

      <div className="max-w-4xl w-full relative z-10">
        <div className="text-center mb-8">
            <div className="inline-flex w-20 h-20 bg-white rounded-3xl shadow-xl items-center justify-center mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
               <Store size={40} className={getTextHighlight()} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 shadow-sm drop-shadow-md">Bodega Pro</h1>
            <p className="text-white/80 text-lg font-medium">{config.businessName}</p>
        </div>

        {/* STEP 1: PROFILE SELECTION */}
        {!selectedRole && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Owner Profile Card */}
                <button 
                    onClick={() => handleProfileSelect('owner')}
                    className={`group bg-white p-8 rounded-3xl shadow-xl border-2 border-transparent hover:border-white transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl text-left relative overflow-hidden ring-4 ring-transparent ${getRingColor()}`}
                >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full transform translate-x-10 -translate-y-10 transition-colors opacity-50`}></div>
                    <div className="relative z-10">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${getThemeBgLight().split(' ')[0]}`}>
                            <ShieldCheck size={32} className="text-gray-600 group-hover:text-gray-900" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Dueño</h3>
                        <p className="text-gray-500 text-sm mb-4">Acceso total a configuración, finanzas, inventario y gestión de usuarios.</p>
                        <div className="flex items-center text-sm font-semibold text-gray-400 group-hover:text-gray-800">
                            Ingresar <ArrowRight size={16} className="ml-2" />
                        </div>
                    </div>
                </button>

                {/* Employee Profile Card */}
                <button 
                    onClick={() => handleProfileSelect('employee')}
                    className={`group bg-white p-8 rounded-3xl shadow-xl border-2 border-transparent hover:border-white transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl text-left relative overflow-hidden ring-4 ring-transparent ${getRingColor()}`}
                >
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full transform translate-x-10 -translate-y-10 transition-colors opacity-50`}></div>
                    <div className="relative z-10">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors ${getThemeBgLight().split(' ')[0]}`}>
                            <Briefcase size={32} className="text-gray-600 group-hover:text-gray-900" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Empleado</h3>
                        <p className="text-gray-500 text-sm mb-4">Acceso limitado a punto de venta, inventario (lectura) y registro de ventas.</p>
                        <div className="flex items-center text-sm font-semibold text-gray-400 group-hover:text-gray-800">
                            Ingresar <ArrowRight size={16} className="ml-2" />
                        </div>
                    </div>
                </button>
            </div>
        )}

        {/* STEP 2: CREDENTIALS FORM */}
        {selectedRole && (
            <div className="max-w-md w-full mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8 relative">
                    <button 
                        onClick={() => setSelectedRole(null)}
                        className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                        <ArrowLeft size={16} /> Volver
                    </button>

                    <div className="text-center mt-6 mb-8">
                        <div className={`inline-flex w-12 h-12 rounded-xl bg-gray-100 items-center justify-center mb-3 ${getTextHighlight()}`}>
                            {selectedRole === 'owner' ? <ShieldCheck size={24} /> : <Briefcase size={24} />}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {selectedRole === 'owner' ? 'Acceso Administrativo' : 'Acceso de Personal'}
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Usuario</label>
                            <div className="relative group">
                            <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-gray-800 transition-colors" size={20} />
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 outline-none transition-all font-medium text-gray-800 placeholder-gray-400"
                                placeholder={selectedRole === 'owner' ? 'admin' : 'empleado'}
                                autoFocus
                            />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Contraseña</label>
                            <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-gray-800 transition-colors" size={20} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 outline-none transition-all font-medium text-gray-800 placeholder-gray-400"
                                placeholder="••••••••"
                            />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                            <ShieldCheck size={16} />
                            {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] ${getButtonColor()} ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
                            >
                                {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
                                {!isLoading && <Key size={18} />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>

      <div className="absolute bottom-4 text-center w-full text-xs text-white/50">
        &copy; {new Date().getFullYear()} Bodega Pro. Sistema Seguro.
      </div>
    </div>
  );
};
