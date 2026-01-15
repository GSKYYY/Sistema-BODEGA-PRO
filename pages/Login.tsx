
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Store, User as UserIcon, Lock, ArrowLeft, Key, Loader2, UserCircle2, Shield, ShieldCheck, Zap, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export const Login: React.FC = () => {
  const { config, user, loginDemo } = useData();
  const navigate = useNavigate();
  
  // LOGIN STATE
  const [step, setStep] = useState<'selection' | 'form'>('selection');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'employee' | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect when user state updates to authenticated
  useEffect(() => {
    if (user?.isAuthenticated) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLoginSelect = (role: 'owner' | 'employee') => {
    setSelectedRole(role);
    setStep('form');
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleDemoLogin = (role: 'owner' | 'employee') => {
      loginDemo(role);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Safe Auth Check
    if (!auth || (auth as any)._isMock) {
        setError('Servicio de conexión no disponible. Por favor utilice el Modo Demo.');
        setIsLoading(false);
        return;
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
          setError('Credenciales incorrectas');
      } else if (err.code === 'auth/too-many-requests') {
          setError('Demasiados intentos. Espere un momento.');
      } else {
          setError('Error de conexión. Intente el Modo Demo.');
      }
      setIsLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${getGradient()}`}></div>
      
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

      <div className="max-w-5xl w-full relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="text-center mb-8">
            <div className="inline-flex w-20 h-20 bg-white rounded-3xl shadow-xl items-center justify-center mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
               <Store size={40} className="text-gray-800" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2 shadow-sm drop-shadow-md">Bodega Pro</h1>
            <p className="text-white/80 text-lg font-medium">{config.businessName}</p>
        </div>

        {step === 'selection' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {/* 1. Login Dueño */}
                <button 
                    onClick={() => handleLoginSelect('owner')}
                    className="group bg-white/95 hover:bg-white backdrop-blur-sm p-6 rounded-2xl shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl text-center border-2 border-transparent hover:border-blue-500 flex flex-col items-center gap-4 h-full"
                >
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-inner">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Dueño</h2>
                        <p className="text-gray-500 text-xs mt-1">Acceso total con contraseña</p>
                    </div>
                    <div className="mt-auto pt-2">
                        <span className="text-blue-600 text-sm font-bold flex items-center gap-1">
                            Ingresar <LogIn size={16}/>
                        </span>
                    </div>
                </button>

                {/* 2. Login Empleado */}
                <button 
                    onClick={() => handleLoginSelect('employee')}
                    className="group bg-white/95 hover:bg-white backdrop-blur-sm p-6 rounded-2xl shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl text-center border-2 border-transparent hover:border-green-500 flex flex-col items-center gap-4 h-full"
                >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors shadow-inner">
                        <UserCircle2 size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Empleado</h2>
                        <p className="text-gray-500 text-xs mt-1">Acceso ventas con contraseña</p>
                    </div>
                    <div className="mt-auto pt-2">
                        <span className="text-green-600 text-sm font-bold flex items-center gap-1">
                            Ingresar <LogIn size={16}/>
                        </span>
                    </div>
                </button>

                {/* 3. Demo Dueño */}
                <button 
                    onClick={() => handleDemoLogin('owner')}
                    className="group bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white p-6 rounded-2xl shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl text-center border-2 border-white/20 flex flex-col items-center gap-4 h-full relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Zap size={64} />
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md shadow-inner border border-white/30">
                        <Shield size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Demo Dueño</h2>
                        <p className="text-white/80 text-xs mt-1">Prueba rápida sin contraseña</p>
                    </div>
                    <div className="mt-auto pt-2">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-white/30">
                            Acceso Instantáneo
                        </span>
                    </div>
                </button>

                {/* 4. Demo Empleado */}
                <button 
                    onClick={() => handleDemoLogin('employee')}
                    className="group bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white p-6 rounded-2xl shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl text-center border-2 border-white/20 flex flex-col items-center gap-4 h-full relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <Zap size={64} />
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md shadow-inner border border-white/30">
                        <UserCircle2 size={32} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Demo Vendedor</h2>
                        <p className="text-white/80 text-xs mt-1">Prueba rápida sin contraseña</p>
                    </div>
                    <div className="mt-auto pt-2">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-white/30">
                            Acceso Instantáneo
                        </span>
                    </div>
                </button>
            </div>
        )}

        {step === 'form' && (
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8 max-w-md mx-auto relative animate-in zoom-in-95 duration-300">
                <button 
                    onClick={() => setStep('selection')}
                    className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 text-sm font-medium"
                >
                    <ArrowLeft size={16} /> Volver
                </button>

                <div className="text-center mb-6 mt-4">
                    <div className={`inline-flex p-3 rounded-full mb-3 ${selectedRole === 'owner' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                        {selectedRole === 'owner' ? <Shield size={32} /> : <UserCircle2 size={32} />}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Acceso {selectedRole === 'owner' ? 'Administrador' : 'Empleado'}
                    </h2>
                    <p className="text-gray-500 text-sm">Ingrese sus credenciales registradas</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Correo Electrónico</label>
                        <div className="relative group">
                        <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-gray-800 transition-colors" size={20} />
                        <input 
                            type="text" 
                            inputMode="email"
                            autoCapitalize="none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-gray-300 focus:ring-4 focus:ring-gray-100 outline-none transition-all font-medium text-gray-800 placeholder-gray-400"
                            placeholder="usuario@sistema.com"
                            autoFocus
                            required
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
                            required
                        />
                        </div>
                    </div>

                    {error && (
                        <div className="flex flex-col gap-1 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={16} />
                                <span>{error}</span>
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <button 
                            type="submit"
                            disabled={isLoading}
                            className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] ${getButtonColor()} ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
                        >
                            {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />}
                        </button>
                    </div>
                </form>
            </div>
        )}
      </div>

      <div className="absolute bottom-4 text-center w-full text-xs text-white/50">
        &copy; {new Date().getFullYear()} Bodega Pro. Sistema Seguro.
      </div>
    </div>
  );
};
